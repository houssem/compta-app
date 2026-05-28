// src/app/features/suppliers/suppliers.component.ts
import { Component, computed, signal, OnInit, HostListener } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink, Router } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'
import { SupplierService } from './supplier.service'
import { Supplier } from '../../shared/models/supplier.model'

type FilterTab = 'all' | 'overdue' | 'high-priority'

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslateModule],
  templateUrl: './suppliers.component.html',
  styleUrl: './suppliers.component.scss'
})
export class SuppliersComponent implements OnInit {

  private allSuppliers = signal<Supplier[]>([])
  loading  = signal(true)
  error    = signal('')

  searchQuery = signal('')
  activeTab   = signal<FilterTab>('all')
  currentPage = signal(1)
  readonly pageSize = 6

  // ── KPIs ─────────────────────────────────────────────
  totalSuppliers = computed(() => this.allSuppliers().length)

  openBalanceTotal = computed(() => 0)

  overdueTotal = computed(() => 0)

  nouveaux30j = computed(() => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
    return this.allSuppliers().filter(s => s.createdAt && new Date(s.createdAt).getTime() >= cutoff).length
  })

  // ── Action menu ──────────────────────────────────────
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

  constructor(private supplierService: SupplierService, private router: Router) {}

  ngOnInit(): void {
    this.supplierService.getAll().subscribe({
      next: (suppliers) => {
        this.allSuppliers.set(suppliers)
        this.loading.set(false)
      },
      error: () => {
        this.error.set('Impossible de charger les fournisseurs. Veuillez réessayer.')
        this.loading.set(false)
      }
    })
  }

  // ── Computed ─────────────────────────────────────────
  tabFilteredSuppliers = computed(() => {
    const tab = this.activeTab()
    const suppliers = this.allSuppliers()
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000

    if (tab === 'overdue') {
      return suppliers.filter(s =>
        s.createdAt && new Date(s.createdAt).getTime() < cutoff
      )
    }
    if (tab === 'high-priority') {
      return suppliers.filter(s => s.status === 'high-priority')
    }
    return suppliers
  })

  filteredSuppliers = computed(() => {
    const q = this.searchQuery().toLowerCase()
    if (!q) return this.tabFilteredSuppliers()
    const primaryContact = (s: any) => s.contacts?.find((c: any) => c.isPrimary) ?? s.contacts?.[0]
    return this.tabFilteredSuppliers().filter(s => {
      const contact = primaryContact(s)
      return s.companyName.toLowerCase().includes(q) ||
        (contact?.fullName ?? '').toLowerCase().includes(q) ||
        (contact?.email ?? '').toLowerCase().includes(q) ||
        s.address.city.toLowerCase().includes(q)
    })
  })

  totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredSuppliers().length / this.pageSize))
  )

  pagedSuppliers = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize
    return this.filteredSuppliers().slice(start, start + this.pageSize)
  })

  pageStart = computed(() =>
    this.filteredSuppliers().length === 0 ? 0 : (this.currentPage() - 1) * this.pageSize + 1
  )

  pageEnd = computed(() =>
    Math.min(this.currentPage() * this.pageSize, this.filteredSuppliers().length)
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

  // ── Actions ──────────────────────────────────────────
  setTab(tab: FilterTab): void {
    this.activeTab.set(tab)
    this.currentPage.set(1)
  }

  onSearchChange(val: string): void {
    this.searchQuery.set(val)
    this.currentPage.set(1)
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page)
    }
  }

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

  editSupplier(id: string): void {
    this.router.navigate(['/supplier/edit', id])
  }

  confirmDelete(id: string, event: MouseEvent): void {
    event.stopPropagation()
    this.confirmDeleteId.set(id)
  }

  deleteSupplier(id: string, event: MouseEvent): void {
    event.stopPropagation()
    this.supplierService.delete(id).subscribe({
      next: () => {
        this.allSuppliers.update(list => list.filter(s => s.id !== id))
        this.openMenuId.set(null)
        this.confirmDeleteId.set(null)
      }
    })
  }

  initials(name: string): string {
    return name.split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase()
  }

  formatAmount(value: number): string {
    return (value ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TND'
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  }
}
