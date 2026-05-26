import { Component, computed, signal, OnInit, inject, HostListener } from '@angular/core'
import { RouterLink, Router } from '@angular/router'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { PurchaseInvoiceService } from './purchase-invoice.service'
import { ApiPurchaseInvoice, PurchaseInvoiceStatus } from '../../shared/models/purchase-invoice.model'

interface PurchaseInvoice {
  id: string
  dbId: string
  supplier: string
  initial: string
  avatarColor: string
  dateFacture: string
  montantTTC: number
  currency: string
  statut: PurchaseInvoiceStatus
}

@Component({
  selector: 'app-purchase-invoices',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './purchase-invoices.component.html',
  styleUrl: './purchase-invoices.component.scss'
})
export class PurchaseInvoicesComponent implements OnInit {

  private service = inject(PurchaseInvoiceService)
  private router  = inject(Router)

  loading = signal(true)
  error   = signal('')

  openMenuId      = signal<string | null>(null)
  confirmDeleteId = signal<string | null>(null)
  menuAnchorRect  = signal<{ top: number; right: number } | null>(null)

  searchQuery  = signal('')
  statusFilter = signal<PurchaseInvoiceStatus | ''>('')
  currentPage  = signal(1)
  readonly pageSize = 5

  private allInvoices = signal<PurchaseInvoice[]>([])

  filteredInvoices = computed(() => {
    const q = this.searchQuery().toLowerCase()
    const s = this.statusFilter()
    return this.allInvoices().filter(inv => {
      const matchesSearch = !q || inv.supplier.toLowerCase().includes(q) || inv.id.toLowerCase().includes(q)
      const matchesStatus = !s || inv.statut === s
      return matchesSearch && matchesStatus
    })
  })

  totalPages    = computed(() => Math.max(1, Math.ceil(this.filteredInvoices().length / this.pageSize)))
  pagedInvoices = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize
    return this.filteredInvoices().slice(start, start + this.pageSize)
  })
  pages   = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1))
  pageEnd = computed(() => Math.min(this.currentPage() * this.pageSize, this.filteredInvoices().length))

  readonly statusOptions: { value: PurchaseInvoiceStatus | '', label: string }[] = [
    { value: '',           label: 'Tous' },
    { value: 'reçue',     label: 'Reçue' },
    { value: 'validée',   label: 'Validée' },
    { value: 'payée',     label: 'Payée' },
    { value: 'en retard', label: 'En retard' },
  ]

  readonly badgeClassMap: Record<PurchaseInvoiceStatus, string> = {
    'reçue':     'recue',
    'validée':   'validee',
    'payée':     'payee',
    'en retard': 'en-retard',
  }

  ngOnInit(): void {
    this.service.getAll().subscribe({
      next: (data) => {
        this.allInvoices.set(data.map(a => this.mapInvoice(a)))
        this.loading.set(false)
      },
      error: () => {
        this.error.set("Impossible de charger les factures d'achat. Veuillez réessayer.")
        this.loading.set(false)
      }
    })
  }

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
    this.router.navigate(['/purchase-invoice/edit', dbId])
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
    this.service.delete(dbId).subscribe({
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
  onStatusChange(val: string): void { this.statusFilter.set(val as PurchaseInvoiceStatus | ''); this.currentPage.set(1) }

  formatAmount(value: number, currency = 'TND'): string {
    const symbols: Record<string, string> = { TND: 'DT', EUR: '€', USD: '$', GBP: '£' }
    return value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + (symbols[currency] ?? currency)
  }

  private mapInvoice(api: ApiPurchaseInvoice): PurchaseInvoice {
    const today = new Date().toISOString().split('T')[0]
    const overdue = api.dueDate < today && api.status !== 'payée'
    return {
      id:          api.invoiceNumber,
      dbId:        String(api.id),
      supplier:    api.supplierName,
      initial:     api.supplierName.charAt(0).toUpperCase(),
      avatarColor: this.hashColor(api.supplierName),
      dateFacture: this.formatDate(api.issueDate),
      montantTTC:  api.totalTTC,
      currency:    api.currency,
      statut:      overdue ? 'en retard' : api.status,
    }
  }

  private formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  private hashColor(name: string): string {
    const palette = ['#3B82F6','#10B981','#F59E0B','#6366F1','#EC4899','#14B8A6','#F97316','#8B5CF6','#0EA5E9','#94A3B8']
    let hash = 0
    for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff
    return palette[hash % palette.length]
  }
}
