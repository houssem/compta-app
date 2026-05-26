import { Component, computed, signal, OnInit, inject, HostListener } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink, Router, ActivatedRoute } from '@angular/router'
import { CommonModule } from '@angular/common'
import { TranslateModule } from '@ngx-translate/core'
import { HttpClient } from '@angular/common/http'
import { Currency, Client, CURRENCIES } from '../../../shared/models/client.model'

interface Language { id: number; value: string; label: string }

interface LineItem {
  id: number
  description: string
  qty: number
  priceHT: number
  discPct: number
  vatPct: number
}

interface StoredInvoice {
  id: number | string
  clientId: string
  clientName: string
  invoiceNumber: string
  issueDate: string
  dueDate: string
  currency: string
  language: string
  lineItems: LineItem[]
  internalNotes: string
  termsAndConditions: string
  status: string
}

@Component({
  selector: 'app-new-invoice',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule, TranslateModule],
  templateUrl: './new-invoice.component.html',
  styleUrl: './new-invoice.component.scss'
})
export class NewInvoiceComponent implements OnInit {

  private http   = inject(HttpClient)
  private router = inject(Router)
  private route  = inject(ActivatedRoute)

  // Edit mode
  editMode   = signal(false)
  private invoiceDbId: string | null = null

  // Invoice fields
  invoiceNumber      = signal('')   // set from response in edit mode; not shown in create mode
  issueDate          = signal(this.dateOffset(0))
  dueDate            = signal(this.dateOffset(30))
  currency           = signal('TND')
  language           = signal('FR')
  internalNotes      = signal('')
  termsAndConditions = signal('')

  // Client selector
  allClients      = signal<Client[]>([])
  selectedClient  = signal<Client | null>(null)
  clientSearch    = signal('')
  clientModalOpen = signal(false)

  filteredClientOptions = computed(() => {
    const q = this.clientSearch().toLowerCase().trim()
    if (!q) return this.allClients()
    return this.allClients().filter(c =>
      c.companyName.toLowerCase().includes(q) ||
      (c.contacts?.[0]?.fullName ?? '').toLowerCase().includes(q) ||
      (c.contacts?.[0]?.email ?? '').toLowerCase().includes(q)
    )
  })

  // Config — hardcoded constants
  readonly currencies: Currency[] = CURRENCIES
  readonly languages: Language[] = [
    { id: 1, value: 'FR', label: 'Français' },
    { id: 2, value: 'EN', label: 'English'  },
    { id: 3, value: 'AR', label: 'العربية'  },
  ]
  configLoading = signal(true)

  // Line items
  private nextId = 1
  lineItems = signal<LineItem[]>([])
  vatRates  = [0, 7, 13, 19]

  // Validation / save state
  formSubmitted = signal(false)
  saving        = signal(false)
  saveError     = signal('')

  isFormValid = computed(() =>
    !!this.selectedClient() &&
    !!this.issueDate() &&
    !!this.dueDate() &&
    this.lineItems().length > 0 &&
    this.lineItems().every(i => i.description.trim() !== '' && i.qty > 0 && i.priceHT >= 0)
  )

  // Computed totals
  lineTotal = (item: LineItem) => item.qty * item.priceHT * (1 - item.discPct / 100)

  totalHT = computed(() => this.lineItems().reduce((s, i) => s + this.lineTotal(i), 0))

  vatBreakdown = computed(() => {
    const map = new Map<number, number>()
    for (const item of this.lineItems()) {
      const vat = this.lineTotal(item) * (item.vatPct / 100)
      map.set(item.vatPct, (map.get(item.vatPct) ?? 0) + vat)
    }
    return Array.from(map.entries()).map(([rate, amount]) => ({ rate, amount }))
  })

  totalVAT = computed(() => this.vatBreakdown().reduce((s, v) => s + v.amount, 0))
  totalTTC = computed(() => this.totalHT() + this.totalVAT())

  // Validation computed signals
  clientError    = computed(() => this.formSubmitted() && !this.selectedClient())
  issueDateError = computed(() => this.formSubmitted() && !this.issueDate())
  dueDateError   = computed(() => this.formSubmitted() && !this.dueDate())
  noItemsError   = computed(() => this.formSubmitted() && this.lineItems().length === 0)

  itemDescError  = (item: LineItem) => this.formSubmitted() && !item.description.trim()
  itemQtyError   = (item: LineItem) => this.formSubmitted() && item.qty <= 0
  itemPriceError = (item: LineItem) => this.formSubmitted() && item.priceHT < 0

  @HostListener('document:keydown.escape')
  onEscape() { this.clientModalOpen.set(false) }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')
    if (id) {
      this.editMode.set(true)
      this.invoiceDbId = id
    }

    if (this.editMode()) {
      this.http.get<Client[]>('/api/clients').subscribe({
        next: (clients) => {
          this.allClients.set(clients)
          this.http.get<StoredInvoice>(`/api/sales-invoices/${id}`).subscribe({
            next: (invoice) => { this.configLoading.set(false); this.patchFromInvoice(invoice, clients) },
            error: () => this.router.navigate(['/invoices'])
          })
        },
        error: () => this.router.navigate(['/invoices'])
      })
    } else {
      this.http.get<Client[]>('/api/clients').subscribe({
        next: (clients) => { this.allClients.set(clients); this.configLoading.set(false) },
        error: () => this.configLoading.set(false)
      })
    }
  }

  private patchFromInvoice(inv: StoredInvoice, clients: Client[]): void {
    this.invoiceNumber.set(inv.invoiceNumber)
    this.issueDate.set(inv.issueDate)
    this.dueDate.set(inv.dueDate)
    this.currency.set(inv.currency)
    this.language.set(inv.language)
    this.internalNotes.set(inv.internalNotes ?? '')
    this.termsAndConditions.set(inv.termsAndConditions ?? '')
    const maxId = Math.max(0, ...inv.lineItems.map(i => i.id))
    this.nextId = maxId + 1
    this.lineItems.set(inv.lineItems)
    const client = clients.find(c => c.id === inv.clientId) ?? null
    this.selectedClient.set(client)
  }

  // ── Helpers ───────────────────────────────────────────
  private dateOffset(days: number): string {
    const d = new Date()
    d.setDate(d.getDate() + days)
    return d.toISOString().split('T')[0]
  }

  // ── Client selector ───────────────────────────────────
  openClientModal(): void { this.clientSearch.set(''); this.clientModalOpen.set(true) }
  closeClientModal(): void { this.clientModalOpen.set(false) }

  selectClient(client: Client): void {
    this.selectedClient.set(client)
    this.clientModalOpen.set(false)
    if (!this.editMode() && client.financial.currency) this.currency.set(client.financial.currency)
  }

  clearClient(event: MouseEvent): void {
    event.stopPropagation()
    this.selectedClient.set(null)
  }

  getInitials(name: string): string {
    return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }

  // ── Line items ────────────────────────────────────────
  addItem(): void {
    this.lineItems.update(items => [
      ...items,
      { id: this.nextId++, description: '', qty: 1, priceHT: 0, discPct: 0, vatPct: 19 }
    ])
  }

  removeItem(id: number): void {
    this.lineItems.update(items => items.filter(i => i.id !== id))
  }

  updateItem(id: number, field: keyof LineItem, value: string | number): void {
    this.lineItems.update(items => items.map(i => i.id === id ? { ...i, [field]: value } : i))
  }

  formatAmount(value: number): string {
    const symbol = this.currencies.find(c => c.value === this.currency())?.symbol ?? this.currency()
    return value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + symbol
  }

  // ── Save ──────────────────────────────────────────────
  save(): void {
    this.formSubmitted.set(true)
    if (!this.isFormValid()) return

    this.saving.set(true)
    this.saveError.set('')

    const payload = {
      clientId:           this.selectedClient()!.id,
      clientName:         this.selectedClient()!.companyName,
      issueDate:          this.issueDate(),
      dueDate:            this.dueDate(),
      currency:           this.currency(),
      language:           this.language(),
      lineItems:          this.lineItems(),
      internalNotes:      this.internalNotes(),
      termsAndConditions: this.termsAndConditions(),
      totalHT:            this.totalHT(),
      totalTTC:           this.totalTTC(),
      status:             'pending',
      createdAt:          new Date().toISOString()
    }

    const request$ = this.editMode()
      ? this.http.put(`/api/sales-invoices/${this.invoiceDbId}`, payload)
      : this.http.post('/api/sales-invoices', payload)

    request$.subscribe({
      next:  () => { this.saving.set(false); this.router.navigate(['/invoices']) },
      error: (e) => {
        this.saveError.set(e?.error?.message ?? 'Une erreur est survenue. Veuillez réessayer.')
        this.saving.set(false)
      }
    })
  }

  sendByEmail(): void {}
  preview(): void {}
}
