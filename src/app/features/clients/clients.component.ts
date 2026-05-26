import { Component, computed, signal, OnInit, HostListener } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink, Router } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'
import { ClientService } from './client.service'
import { Client } from '../../shared/models/client.model'

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslateModule],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.scss'
})
export class ClientsComponent implements OnInit {

  private allClients = signal<Client[]>([])
  loading  = signal(true)
  error    = signal('')

  searchQuery = signal('')
  currentPage = signal(1)
  readonly pageSize = 6
  readonly soldeGlobalDu = 0

  nouveaux30j = computed(() => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
    return this.allClients().filter(c => new Date(c.createdAt).getTime() >= cutoff).length
  })

  // ── Action menu ──────────────────────────────────────────────
  openMenuId      = signal<string | null>(null)
  confirmDeleteId = signal<string | null>(null)
  menuAnchorRect  = signal<{ top: number; right: number } | null>(null)

  @HostListener('document:click')
  onDocumentClick(): void {
    this.openMenuId.set(null)
    this.confirmDeleteId.set(null)
    this.menuAnchorRect.set(null)
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.openMenuId.set(null)
    this.confirmDeleteId.set(null)
    this.menuAnchorRect.set(null)
  }

  constructor(private clientService: ClientService, private router: Router) {}

  ngOnInit(): void {
    this.clientService.getAll().subscribe({
      next: (clients) => {
        this.allClients.set(clients)
        this.loading.set(false)
      },
      error: () => {
        this.error.set('Impossible de charger les clients. Veuillez réessayer.')
        this.loading.set(false)
      }
    })
  }

  // ── Computed ─────────────────────────────────────────────────
  totalClients = computed(() => this.allClients().length)

  filteredClients = computed(() => {
    const q = this.searchQuery().toLowerCase()
    if (!q) return this.allClients()
    return this.allClients().filter(c =>
      c.companyName.toLowerCase().includes(q) ||
      (c.contacts?.[0]?.fullName ?? '').toLowerCase().includes(q) ||
      (c.contacts?.[0]?.email ?? '').toLowerCase().includes(q) ||
      c.billingAddress.city.toLowerCase().includes(q)
    )
  })

  totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredClients().length / this.pageSize))
  )

  pagedClients = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize
    return this.filteredClients().slice(start, start + this.pageSize)
  })

  pageStart = computed(() =>
    this.filteredClients().length === 0 ? 0 : (this.currentPage() - 1) * this.pageSize + 1
  )

  pageEnd = computed(() =>
    Math.min(this.currentPage() * this.pageSize, this.filteredClients().length)
  )

  visiblePages = computed(() => {
    const total   = this.totalPages()
    const current = this.currentPage()
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
    const pages: (number | '...')[] = [1]
    if (current > 3) pages.push('...')
    for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
      pages.push(p)
    }
    if (current < total - 2) pages.push('...')
    pages.push(total)
    return pages
  })

  // ── Actions ──────────────────────────────────────────────────
  onSearchChange(val: string): void {
    this.searchQuery.set(val)
    this.currentPage.set(1)
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page)
    }
  }

  // ── Helpers ──────────────────────────────────────────────────
  toggleMenu(id: string, event: MouseEvent): void {
    event.stopPropagation()
    this.confirmDeleteId.set(null)
    if (this.openMenuId() === id) {
      this.openMenuId.set(null)
      this.menuAnchorRect.set(null)
    } else {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
      this.menuAnchorRect.set({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
      this.openMenuId.set(id)
    }
  }

  editClient(id: string): void {
    this.router.navigate(['/client/edit', id])
  }

  confirmDelete(id: string, event: MouseEvent): void {
    event.stopPropagation()
    this.confirmDeleteId.set(id)
  }

  deleteClient(id: string, event: MouseEvent): void {
    event.stopPropagation()
    this.clientService.delete(id).subscribe({
      next: () => {
        this.allClients.update(list => list.filter(c => c.id !== id))
        this.openMenuId.set(null)
        this.confirmDeleteId.set(null)
      }
    })
  }

  formatAmount(value: number): string {
    return value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TND'
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  }
}
