import { Component, computed, signal, OnInit, inject, HostListener } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink, Router, ActivatedRoute } from '@angular/router'
import { CommonModule } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { Currency, CURRENCIES } from '../../../shared/models/client.model'
import { Supplier, SupplierContact } from '../../../shared/models/supplier.model'
import { PurchaseInvoiceService } from '../purchase-invoice.service'
import { LineItem, StoredPurchaseInvoice, PurchaseInvoiceStatus, InvoiceAttachment, ExtractedInvoice } from '../../../shared/models/purchase-invoice.model'

type ExtractionState = 'idle' | 'loading' | 'success' | 'error'

@Component({
  selector: 'app-new-purchase-invoice',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './new-purchase-invoice.component.html',
  styleUrl: './new-purchase-invoice.component.scss'
})
export class NewPurchaseInvoiceComponent implements OnInit {

  private http    = inject(HttpClient)
  private router  = inject(Router)
  private route   = inject(ActivatedRoute)
  private service = inject(PurchaseInvoiceService)

  editMode = signal(false)
  private invoiceDbId: string | null = null

  invoiceNumber = signal(this.genInvoiceNumber())
  issueDate     = signal(this.dateOffset(0))
  dueDate       = signal(this.dateOffset(30))
  currency      = signal('TND')
  internalNotes = signal('')
  status        = signal<PurchaseInvoiceStatus>('reçue')
  supplierInvoiceRef = signal('')
  purchaseCategory   = signal('')
  paymentMethod      = signal('')

  allSuppliers      = signal<Supplier[]>([])
  selectedSupplier  = signal<Supplier | null>(null)
  supplierSearch    = signal('')
  supplierModalOpen = signal(false)

  filteredSupplierOptions = computed(() => {
    const q = this.supplierSearch().toLowerCase().trim()
    if (!q) return this.allSuppliers()
    return this.allSuppliers().filter(s => {
      const primary = s.contacts?.find(c => c.isPrimary) ?? s.contacts?.[0]
      return s.companyName.toLowerCase().includes(q) ||
        (primary?.fullName ?? '').toLowerCase().includes(q) ||
        (primary?.email ?? '').toLowerCase().includes(q)
    })
  })

  readonly currencies: Currency[] = CURRENCIES
  configLoading = signal(true)

  private nextId = 1
  lineItems = signal<LineItem[]>([])
  vatRates  = [0, 7, 13, 19]

  readonly paymentMethodOptions = [
    'Virement bancaire',
    'Chèque',
    'Traite',
    'Prélèvement',
    'Espèce / Cash',
  ]

  attachment = signal<InvoiceAttachment | null>(null)
  dragOver   = signal(false)
  fileError  = signal('')

  extractionState  = signal<ExtractionState>('idle')
  extractionError  = signal('')
  extractedCount   = signal(0)
  extractDragOver  = signal(false)

  readonly ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
  readonly MAX_SIZE = 10 * 1024 * 1024

  formSubmitted = signal(false)
  saving        = signal(false)
  saveError     = signal('')

  isFormValid = computed(() =>
    !!this.selectedSupplier() &&
    !!this.issueDate() &&
    !!this.dueDate() &&
    this.lineItems().length > 0 &&
    this.lineItems().every(i => i.description.trim() !== '' && i.qty > 0 && i.priceHT >= 0)
  )

  lineTotal    = (item: LineItem) => item.qty * item.priceHT * (1 - item.discPct / 100)
  totalHT      = computed(() => this.lineItems().reduce((s, i) => s + this.lineTotal(i), 0))
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

  supplierError  = computed(() => this.formSubmitted() && !this.selectedSupplier())
  issueDateError = computed(() => this.formSubmitted() && !this.issueDate())
  dueDateError   = computed(() => this.formSubmitted() && !this.dueDate())

  noItemsError   = computed(() => this.formSubmitted() && this.lineItems().length === 0)
  itemDescError  = (item: LineItem) => this.formSubmitted() && !item.description.trim()
  itemQtyError   = (item: LineItem) => this.formSubmitted() && item.qty <= 0
  itemPriceError = (item: LineItem) => this.formSubmitted() && item.priceHT < 0

  @HostListener('document:keydown.escape')
  onEscape() { this.supplierModalOpen.set(false) }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')
    if (id) { this.editMode.set(true); this.invoiceDbId = id }

    if (this.editMode()) {
      this.http.get<Supplier[]>('/api/suppliers').subscribe({
        next: (suppliers) => {
          this.allSuppliers.set(suppliers)
          this.service.getById(id!).subscribe({
            next: (invoice) => { this.configLoading.set(false); this.patchFromInvoice(invoice, suppliers) },
            error: () => this.router.navigate(['/purchase-invoices'])
          })
        },
        error: () => this.router.navigate(['/purchase-invoices'])
      })
    } else {
      this.http.get<Supplier[]>('/api/suppliers').subscribe({
        next: (suppliers) => { this.allSuppliers.set(suppliers); this.configLoading.set(false) },
        error: () => this.configLoading.set(false)
      })
    }
  }

  private patchFromInvoice(inv: StoredPurchaseInvoice, suppliers: Supplier[]): void {
    this.invoiceNumber.set(inv.invoiceNumber)
    this.issueDate.set(inv.issueDate)
    this.dueDate.set(inv.dueDate)
    this.currency.set(inv.currency)
    this.internalNotes.set(inv.internalNotes ?? '')
    this.attachment.set(inv.attachment ?? null)
    this.status.set(inv.status)
    this.supplierInvoiceRef.set(inv.supplierInvoiceRef ?? '')
    this.purchaseCategory.set(inv.purchaseCategory ?? '')
    this.paymentMethod.set(inv.paymentMethod ?? '')
    const maxId = Math.max(0, ...inv.lineItems.map(i => i.id))
    this.nextId = maxId + 1
    this.lineItems.set(inv.lineItems)
    this.selectedSupplier.set(suppliers.find(s => s.id === inv.supplierId) ?? null)
  }

  private dateOffset(days: number): string {
    const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().split('T')[0]
  }

  private genInvoiceNumber(): string {
    const year = new Date().getFullYear()
    return `ACH-${year}-${String(Math.floor(Math.random() * 9000) + 1000)}`
  }

  openSupplierModal(): void  { this.supplierSearch.set(''); this.supplierModalOpen.set(true) }
  closeSupplierModal(): void { this.supplierModalOpen.set(false) }

  selectSupplier(supplier: Supplier): void {
    this.selectedSupplier.set(supplier)
    this.supplierModalOpen.set(false)
    if (!this.editMode()) {
      if (supplier.financial.currency) this.currency.set(supplier.financial.currency)
      this.purchaseCategory.set(supplier.financial.defaultAccount ?? '')
    }
  }

  clearSupplier(event: MouseEvent): void { event.stopPropagation(); this.selectedSupplier.set(null) }

  getPrimaryContact(supplier: Supplier): SupplierContact | undefined {
    return supplier.contacts?.find(c => c.isPrimary) ?? supplier.contacts?.[0]
  }

  getInitials(name: string): string {
    return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }

  addItem(): void {
    this.lineItems.update(items => [...items, { id: this.nextId++, description: '', qty: 1, priceHT: 0, discPct: 0, vatPct: 19 }])
  }
  removeItem(id: number): void { this.lineItems.update(items => items.filter(i => i.id !== id)) }
  updateItem(id: number, field: keyof LineItem, value: string | number): void {
    this.lineItems.update(items => items.map(i => i.id === id ? { ...i, [field]: value } : i))
  }

  onDragOver(event: DragEvent): void { event.preventDefault(); this.dragOver.set(true) }
  onDragLeave(): void { this.dragOver.set(false) }
  onDrop(event: DragEvent): void {
    event.preventDefault()
    this.dragOver.set(false)
    const file = event.dataTransfer?.files?.[0]
    if (file) this.processFile(file)
  }
  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (file) this.processFile(file)
    ;(event.target as HTMLInputElement).value = ''
  }

  private processFile(file: File): void {
    this.fileError.set('')
    if (!this.ACCEPTED_TYPES.includes(file.type)) {
      this.fileError.set('Format non supporté. Utilisez PDF, JPG, PNG ou WEBP.')
      return
    }
    if (file.size > this.MAX_SIZE) {
      this.fileError.set('Le fichier dépasse la limite de 10 Mo.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => this.attachment.set({ name: file.name, type: file.type, size: file.size, data: reader.result as string })
    reader.readAsDataURL(file)
  }

  removeAttachment(): void { this.attachment.set(null); this.fileError.set('') }

  onExtractDragOver(event: DragEvent): void { event.preventDefault(); this.extractDragOver.set(true) }
  onExtractDragLeave(): void { this.extractDragOver.set(false) }

  onExtractDrop(event: DragEvent): void {
    event.preventDefault()
    this.extractDragOver.set(false)
    const file = event.dataTransfer?.files?.[0]
    if (file) this.processExtraction(file)
  }

  onExtractUpload(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0]
    ;(event.target as HTMLInputElement).value = ''
    if (file) this.processExtraction(file)
  }

  private processExtraction(file: File): void {
    if (!this.ACCEPTED_TYPES.includes(file.type)) {
      this.extractionError.set('Format non supporté. Utilisez PDF, JPG, PNG ou WEBP.')
      this.extractionState.set('error')
      return
    }
    if (file.size > this.MAX_SIZE) {
      this.extractionError.set('Le fichier dépasse la limite de 10 Mo.')
      this.extractionState.set('error')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const data = reader.result as string
      this.attachment.set({ name: file.name, type: file.type, size: file.size, data })
      this.extractionState.set('loading')
      this.extractionError.set('')
      this.service.extract({ name: file.name, type: file.type, data }).subscribe({
        next: (extracted) => {
          this.applyExtractedData(extracted)
          this.extractionState.set('success')
        },
        error: () => {
          this.extractionError.set('L\'analyse a échoué. Vérifiez votre connexion et réessayez.')
          this.extractionState.set('error')
        }
      })
    }
    reader.readAsDataURL(file)
  }

  resetExtraction(): void {
    this.extractionState.set('idle')
    this.extractionError.set('')
    this.extractedCount.set(0)
    this.attachment.set(null)
  }

  private applyExtractedData(extracted: ExtractedInvoice): void {
    let count = 0
    if (extracted.supplierInvoiceRef) { this.supplierInvoiceRef.set(extracted.supplierInvoiceRef); count++ }
    if (extracted.issueDate)          { this.issueDate.set(extracted.issueDate); count++ }
    if (extracted.dueDate)            { this.dueDate.set(extracted.dueDate); count++ }
    if (extracted.currency)           { this.currency.set(extracted.currency); count++ }
    if (extracted.purchaseCategory)   { this.purchaseCategory.set(extracted.purchaseCategory); count++ }
    if (extracted.paymentMethod)      { this.paymentMethod.set(extracted.paymentMethod); count++ }

    if (extracted.lineItems?.length) {
      this.lineItems.set(extracted.lineItems.map(item => ({
        id: this.nextId++,
        description: item.description ?? '',
        qty: item.qty ?? 1,
        priceHT: item.priceHT ?? 0,
        discPct: item.discPct ?? 0,
        vatPct: item.vatPct ?? 19
      })))
      count++
    }

    if (extracted.supplierName) {
      const match = this.fuzzyMatchSupplier(extracted.supplierName)
      if (match) { this.selectedSupplier.set(match); count++ }
    }

    this.extractedCount.set(count)
  }

  private fuzzyMatchSupplier(name: string): Supplier | null {
    if (!name) return null
    const normalize = (s: string) =>
      s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
    const needle = normalize(name)

    const exact = this.allSuppliers().find(s => {
      const hay = normalize(s.companyName)
      return hay === needle || hay.includes(needle) || needle.includes(hay)
    })
    if (exact) return exact

    const best = this.allSuppliers()
      .map(s => ({ supplier: s, score: this.stringSimilarity(needle, normalize(s.companyName)) }))
      .reduce((a, b) => a.score > b.score ? a : b, { supplier: null as any, score: 0 })
    return best.score >= 0.75 ? best.supplier : null
  }

  private stringSimilarity(a: string, b: string): number {
    const longer = a.length >= b.length ? a : b
    const shorter = a.length >= b.length ? b : a
    if (longer.length === 0) return 1.0
    return (longer.length - this.editDistance(longer, shorter)) / longer.length
  }

  private editDistance(a: string, b: string): number {
    const m = a.length, n = b.length
    const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
      Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0)
    )
    for (let i = 1; i <= m; i++)
      for (let j = 1; j <= n; j++)
        dp[i][j] = a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i][j - 1], dp[i - 1][j])
    return dp[m][n]
  }
  isImage(type: string): boolean { return type.startsWith('image/') }
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' o'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko'
    return (bytes / (1024 * 1024)).toFixed(1) + ' Mo'
  }

  formatAmount(value: number): string {
    const symbol = this.currencies.find(c => c.value === this.currency())?.symbol ?? this.currency()
    return value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + symbol
  }

  save(): void {
    this.formSubmitted.set(true)
    if (!this.isFormValid()) return
    this.saving.set(true)
    this.saveError.set('')

    const payload = {
      supplierId:    this.selectedSupplier()!.id,
      supplierName:  this.selectedSupplier()!.companyName,
      invoiceNumber: this.invoiceNumber(),
      issueDate:     this.issueDate(),
      dueDate:       this.dueDate(),
      currency:      this.currency(),
      lineItems:     this.lineItems(),
      internalNotes: this.internalNotes(),
      attachment:    this.attachment(),
      totalHT:       this.totalHT(),
      totalTTC:      this.totalTTC(),
      status:        this.status(),
      supplierInvoiceRef: this.supplierInvoiceRef(),
      purchaseCategory:   this.purchaseCategory() || undefined,
      paymentMethod:      this.paymentMethod() || undefined,
      createdAt:     new Date().toISOString(),
    }

    const req$ = this.editMode()
      ? this.service.update(this.invoiceDbId!, payload)
      : this.service.create(payload)

    req$.subscribe({
      next:  () => { this.saving.set(false); this.router.navigate(['/purchase-invoices']) },
      error: (e) => { this.saveError.set(e?.error?.message ?? 'Une erreur est survenue.'); this.saving.set(false) }
    })
  }
}
