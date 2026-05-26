import { Component, computed, signal, OnInit, inject, HostListener } from '@angular/core'
import { RouterLink, Router } from '@angular/router'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { InvoiceService } from './invoice.service'
import { ApiInvoice, InvoiceStatus } from '../../shared/models/invoice.model'

interface Invoice {
  id: string
  dbId: string
  client: string
  initial: string
  avatarColor: string
  dateFacture: string
  echeance: string
  montantTTC: number
  currency: string
  statut: InvoiceStatus
  echeanceOverdue: boolean
}

interface Activity {
  dot: 'green' | 'amber'
  text: string
  sub: string
}

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, TranslateModule],
  templateUrl: './invoices.component.html',
  styleUrl: './invoices.component.scss'
})
export class InvoicesComponent implements OnInit {

  private invoiceService = inject(InvoiceService)
  private router         = inject(Router)

  loading = signal(true)
  error   = signal('')

  openMenuId      = signal<string | null>(null)
  confirmDeleteId = signal<string | null>(null)
  menuAnchorRect  = signal<{ top: number; right: number } | null>(null)

  searchQuery  = signal('')
  statusFilter = signal<InvoiceStatus | ''>('')
  currentPage  = signal(1)
  readonly pageSize = 5

  private allInvoices = signal<Invoice[]>([])

  // ── KPIs ────────────────────────────────────────────
  totalAPayer = computed(() =>
    this.allInvoices().filter(i => i.statut !== 'paid').reduce((s, i) => s + i.montantTTC, 0)
  )
  recuesCount    = computed(() => this.allInvoices().length)
  enAttenteCount = computed(() => this.allInvoices().filter(i => i.statut === 'pending').length)
  totalEnRetard  = computed(() =>
    this.allInvoices().filter(i => i.echeanceOverdue || i.statut === 'overdue')
                      .reduce((s, i) => s + i.montantTTC, 0)
  )

  // ── Filtering & pagination ───────────────────────────
  filteredInvoices = computed(() => {
    const q = this.searchQuery().toLowerCase()
    const s = this.statusFilter()
    return this.allInvoices().filter(inv => {
      const matchesSearch = !q || inv.client.toLowerCase().includes(q) || inv.id.toLowerCase().includes(q)
      const matchesStatus = !s || inv.statut === s
      return matchesSearch && matchesStatus
    })
  })

  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredInvoices().length / this.pageSize)))

  pagedInvoices = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize
    return this.filteredInvoices().slice(start, start + this.pageSize)
  })

  pages   = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1))
  pageEnd = computed(() => Math.min(this.currentPage() * this.pageSize, this.filteredInvoices().length))

  readonly activities: Activity[] = [
    { dot: 'green', text: 'Paiement effectué pour <strong>Office supplies Co.</strong>', sub: 'Il y a 2 heures · Par Jean D.' },
    { dot: 'amber', text: 'Nouvelle facture importée : <strong>Swift Logistique</strong>', sub: 'Hier, 16:45 · Système OCR' },
  ]

  readonly statusOptions: { value: InvoiceStatus | '', label: string }[] = [
    { value: '',         label: 'INVOICES.STATUS_ALL' },
    { value: 'paid',     label: 'INVOICES.STATUS_PAID' },
    { value: 'pending',  label: 'INVOICES.STATUS_PENDING' },
    { value: 'approved', label: 'INVOICES.STATUS_APPROVED' },
    { value: 'overdue',  label: 'INVOICES.STATUS_OVERDUE' },
    { value: 'draft',    label: 'INVOICES.STATUS_DRAFT' },
    { value: 'sent',     label: 'INVOICES.STATUS_SENT' },
  ]

  ngOnInit(): void {
    this.invoiceService.getAll().subscribe({
      next: (data) => {
        this.allInvoices.set(data.map(a => this.mapInvoice(a)))
        this.loading.set(false)
      },
      error: () => {
        this.error.set('Impossible de charger les factures. Veuillez réessayer.')
        this.loading.set(false)
      }
    })
  }

  // ── Actions ──────────────────────────────────────────
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

  toggleMenu(dbId: string, event: MouseEvent): void {
    event.stopPropagation()
    this.confirmDeleteId.set(null)
    if (this.openMenuId() === dbId) {
      this.openMenuId.set(null)
      this.menuAnchorRect.set(null)
    } else {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
      this.menuAnchorRect.set({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
      this.openMenuId.set(dbId)
    }
  }

  editInvoice(dbId: string): void {
    this.openMenuId.set(null)
    this.router.navigate(['/invoice/edit', dbId])
  }

  confirmDelete(dbId: string, event: MouseEvent): void {
    event.stopPropagation()
    this.confirmDeleteId.set(dbId)
  }

  cancelDelete(event: MouseEvent): void {
    event.stopPropagation()
    this.confirmDeleteId.set(null)
    this.openMenuId.set(null)
  }

  deleteInvoice(dbId: string, event: MouseEvent): void {
    event.stopPropagation()
    this.invoiceService.delete(dbId).subscribe({
      next: () => {
        this.allInvoices.update(list => list.filter(i => i.dbId !== dbId))
        this.openMenuId.set(null)
        this.confirmDeleteId.set(null)
        if (this.currentPage() > this.totalPages()) this.currentPage.set(this.totalPages())
      }
    })
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) this.currentPage.set(page)
  }

  onSearchChange(val: string): void { this.searchQuery.set(val); this.currentPage.set(1) }
  onStatusChange(val: string): void { this.statusFilter.set(val as InvoiceStatus | ''); this.currentPage.set(1) }

  formatAmount(value: number, currency = 'TND'): string {
    const symbols: Record<string, string> = { TND: 'DT', EUR: '€', USD: '$', GBP: '£' }
    const symbol = symbols[currency] ?? currency
    return value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + symbol
  }

  // ── Mapping ──────────────────────────────────────────
  private mapInvoice(api: ApiInvoice): Invoice {
    const today = new Date().toISOString().split('T')[0]
    const overdue = api.dueDate < today && api.status !== 'paid'
    return {
      id:              api.invoiceNumber,
      dbId:            String(api.id),
      client:          api.clientName,
      initial:         api.clientName.charAt(0).toUpperCase(),
      avatarColor:     this.hashColor(api.clientName),
      dateFacture:     this.formatDate(api.issueDate),
      echeance:        this.formatDate(api.dueDate),
      montantTTC:      api.totalTTC,
      currency:        api.currency,
      statut:          overdue ? 'overdue' : api.status,
      echeanceOverdue: overdue
    }
  }

  private formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  private hashColor(name: string): string {
    const palette = ['#3B82F6', '#10B981', '#F59E0B', '#6366F1', '#EC4899', '#14B8A6', '#F97316', '#8B5CF6', '#0EA5E9', '#94A3B8']
    let hash = 0
    for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff
    return palette[hash % palette.length]
  }
}
