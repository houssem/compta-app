# Purchase Invoices — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the "Factures d'achat" feature: a list page at `/purchase-invoices` and a create/edit form at `/purchase-invoice/create` and `/purchase-invoice/edit/:id`.

**Architecture:** Angular 17 standalone components using signals for state, same design as `/invoices` but with `pinv-` CSS prefix. Service calls `/api/purchase-invoices`. Supplier selector reuses the supplier API already used elsewhere.

**Tech Stack:** Angular 17 standalone, Angular signals, HttpClient, FormsModule, CommonModule, PrimeIcons/Material Symbols.

**Spec:** `docs/superpowers/specs/2026-05-23-purchase-invoices-design.md`

---

## File Map

| Action  | File                                                                                      | Responsibility                          |
|---------|-------------------------------------------------------------------------------------------|-----------------------------------------|
| CREATE  | `src/app/shared/models/purchase-invoice.model.ts`                                        | Data types and status enum              |
| CREATE  | `src/app/features/purchase-invoices/purchase-invoice.service.ts`                         | API calls to `/api/purchase-invoices`   |
| CREATE  | `src/app/features/purchase-invoices/purchase-invoices.component.ts`                      | List page logic (signals, actions)      |
| CREATE  | `src/app/features/purchase-invoices/purchase-invoices.component.html`                    | List page template                      |
| CREATE  | `src/app/features/purchase-invoices/purchase-invoices.component.scss`                    | List page styles (`pinv-` prefix)       |
| CREATE  | `src/app/features/purchase-invoices/new-purchase-invoice/new-purchase-invoice.component.ts`   | Form page logic                    |
| CREATE  | `src/app/features/purchase-invoices/new-purchase-invoice/new-purchase-invoice.component.html` | Form page template                 |
| CREATE  | `src/app/features/purchase-invoices/new-purchase-invoice/new-purchase-invoice.component.scss` | Form page styles (reuse `ni-` classes) |
| MODIFY  | `src/app/app.routes.ts`                                                                   | Add 3 lazy-loaded routes                |
| MODIFY  | `src/app/core/layout/main-layout.component.html`                                         | Fix `/bills` → `/purchase-invoices` link |

---

## Task 1: Data Model

**Files:**
- Create: `src/app/shared/models/purchase-invoice.model.ts`

- [ ] **Step 1: Create the model file**

```typescript
// src/app/shared/models/purchase-invoice.model.ts
export type PurchaseInvoiceStatus = 'reçue' | 'validée' | 'payée' | 'en retard'

export interface LineItem {
  id: number
  description: string
  qty: number
  priceHT: number
  discPct: number
  vatPct: number
}

export interface ApiPurchaseInvoice {
  id: number | string
  supplierName: string
  invoiceNumber: string
  issueDate: string
  dueDate: string
  currency: string
  totalTTC: number
  status: PurchaseInvoiceStatus
  createdAt: string
}

export interface StoredPurchaseInvoice {
  id: number | string
  supplierId: string
  supplierName: string
  invoiceNumber: string
  issueDate: string
  dueDate: string
  currency: string
  lineItems: LineItem[]
  internalNotes: string
  status: PurchaseInvoiceStatus
}

export interface CreatePurchaseInvoicePayload {
  supplierId: string
  supplierName: string
  invoiceNumber: string
  issueDate: string
  dueDate: string
  currency: string
  lineItems: LineItem[]
  internalNotes: string
  totalHT: number
  totalTTC: number
  status: PurchaseInvoiceStatus
  createdAt: string
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/shared/models/purchase-invoice.model.ts
git commit -m "feat: add purchase invoice model"
```

---

## Task 2: Service

**Files:**
- Create: `src/app/features/purchase-invoices/purchase-invoice.service.ts`

- [ ] **Step 1: Create the service**

```typescript
// src/app/features/purchase-invoices/purchase-invoice.service.ts
import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { ApiPurchaseInvoice, StoredPurchaseInvoice, CreatePurchaseInvoicePayload } from '../../shared/models/purchase-invoice.model'

@Injectable({ providedIn: 'root' })
export class PurchaseInvoiceService {
  private http = inject(HttpClient)

  getAll(): Observable<ApiPurchaseInvoice[]> {
    return this.http.get<ApiPurchaseInvoice[]>('/api/purchase-invoices')
  }

  getById(id: string): Observable<StoredPurchaseInvoice> {
    return this.http.get<StoredPurchaseInvoice>(`/api/purchase-invoices/${id}`)
  }

  create(payload: CreatePurchaseInvoicePayload): Observable<StoredPurchaseInvoice> {
    return this.http.post<StoredPurchaseInvoice>('/api/purchase-invoices', payload)
  }

  update(id: string, payload: CreatePurchaseInvoicePayload): Observable<StoredPurchaseInvoice> {
    return this.http.put<StoredPurchaseInvoice>(`/api/purchase-invoices/${id}`, payload)
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/api/purchase-invoices/${id}`)
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/features/purchase-invoices/purchase-invoice.service.ts
git commit -m "feat: add purchase invoice service"
```

---

## Task 3: List Page

**Files:**
- Create: `src/app/features/purchase-invoices/purchase-invoices.component.ts`
- Create: `src/app/features/purchase-invoices/purchase-invoices.component.html`
- Create: `src/app/features/purchase-invoices/purchase-invoices.component.scss`

### Step 1 — TypeScript

- [ ] **Create `purchase-invoices.component.ts`**

```typescript
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
```

### Step 2 — HTML

- [ ] **Create `purchase-invoices.component.html`**

```html
<div class="pinv-page">

  <!-- PAGE HEADER -->
  <div class="pinv-header">
    <div class="pinv-header__info">
      <h1 class="pinv-header__title">Factures d'achat</h1>
      <p class="pinv-header__sub">Gérez vos factures fournisseurs</p>
    </div>
    <div class="pinv-header__actions">
      <a routerLink="/purchase-invoice/create" class="pinv-btn pinv-btn--primary">
        <span class="material-symbols-outlined">add</span>
        Nouvelle facture
      </a>
      <button type="button" class="pinv-btn pinv-btn--outline">
        <span class="material-symbols-outlined">upload</span>
        Importer facture
      </button>
    </div>
  </div>

  <!-- TABLE CARD -->
  <div class="pinv-card">
    <div class="pinv-table-header">
      <h2 class="pinv-table-title">Liste des factures d'achat</h2>
      <div class="pinv-table-controls">
        <div class="pinv-search-wrapper">
          <span class="material-symbols-outlined pinv-search-icon">search</span>
          <input
            class="pinv-search"
            type="text"
            placeholder="Rechercher par fournisseur ou code…"
            [ngModel]="searchQuery()"
            (ngModelChange)="onSearchChange($event)"
          />
        </div>
        <select
          class="pinv-filter-select"
          [ngModel]="statusFilter()"
          (ngModelChange)="onStatusChange($event)"
        >
          @for (opt of statusOptions; track opt.value) {
            <option [value]="opt.value">{{ opt.label }}</option>
          }
        </select>
        <button type="button" class="pinv-btn-ghost">
          <span class="material-symbols-outlined">download</span>
          Exporter
        </button>
      </div>
    </div>

    <div class="pinv-table-wrapper">
      <table class="pinv-table">
        <thead>
          <tr>
            <th class="pinv-th">Fournisseur</th>
            <th class="pinv-th">Code facture</th>
            <th class="pinv-th">Date facture</th>
            <th class="pinv-th pinv-th--right">Montant TTC</th>
            <th class="pinv-th">Statut</th>
            <th class="pinv-th pinv-th--center">Actions</th>
          </tr>
        </thead>
        <tbody>
          @if (loading()) {
            @for (_ of [1,2,3]; track $index) {
              <tr class="pinv-tr">
                <td class="pinv-td"><span class="pinv-skel pinv-skel--wide"></span></td>
                <td class="pinv-td"><span class="pinv-skel"></span></td>
                <td class="pinv-td"><span class="pinv-skel"></span></td>
                <td class="pinv-td"><span class="pinv-skel pinv-skel--short"></span></td>
                <td class="pinv-td"><span class="pinv-skel pinv-skel--badge"></span></td>
                <td class="pinv-td"></td>
              </tr>
            }
          } @else if (error()) {
            <tr>
              <td colspan="6" class="pinv-td pinv-state">
                <span class="material-symbols-outlined pinv-state__icon pinv-state__icon--error">error</span>
                <p class="pinv-state__msg">{{ error() }}</p>
              </td>
            </tr>
          } @else if (pagedInvoices().length === 0) {
            <tr>
              <td colspan="6" class="pinv-td pinv-state">
                <span class="material-symbols-outlined pinv-state__icon">receipt_long</span>
                <p class="pinv-state__msg">Aucune facture d'achat trouvée.</p>
              </td>
            </tr>
          } @else {
            @for (inv of pagedInvoices(); track inv.dbId) {
              <tr class="pinv-tr">
                <td class="pinv-td">
                  <div class="pinv-supplier">
                    <span class="pinv-avatar" [style.background]="inv.avatarColor">{{ inv.initial }}</span>
                    <span class="pinv-supplier__name">{{ inv.supplier }}</span>
                  </div>
                </td>
                <td class="pinv-td pinv-td--code">{{ inv.id }}</td>
                <td class="pinv-td pinv-td--date">{{ inv.dateFacture }}</td>
                <td class="pinv-td pinv-td--amount">{{ formatAmount(inv.montantTTC, inv.currency) }}</td>
                <td class="pinv-td">
                  <span [class]="'pinv-badge pinv-badge--' + badgeClassMap[inv.statut]">{{ inv.statut }}</span>
                </td>
                <td class="pinv-td pinv-td--center">
                  <div class="pinv-action-wrap">
                    <button
                      type="button"
                      class="pinv-row-action"
                      [class.pinv-row-action--active]="openMenuId() === inv.dbId"
                      (click)="toggleMenu(inv.dbId, $event)"
                      title="Actions"
                    >
                      <span class="material-symbols-outlined">more_vert</span>
                    </button>
                  </div>
                </td>
              </tr>
            }
          }
        </tbody>
      </table>
    </div>

    <!-- PAGINATION -->
    <div class="pinv-pagination" [style.visibility]="(!loading() && !error() && filteredInvoices().length > 0) ? 'visible' : 'hidden'">
      <span class="pinv-pagination__info">
        {{ (currentPage()-1)*pageSize+1 }}–{{ pageEnd() }} sur {{ filteredInvoices().length }}
      </span>
      <div class="pinv-pagination__controls">
        <button type="button" class="pinv-page-btn" [disabled]="currentPage() === 1" (click)="goToPage(currentPage() - 1)">
          <span class="material-symbols-outlined">chevron_left</span>
        </button>
        @for (p of pages(); track p) {
          <button
            type="button"
            class="pinv-page-btn"
            [class.pinv-page-btn--active]="p === currentPage()"
            (click)="goToPage(p)"
          >{{ p }}</button>
        }
        <button type="button" class="pinv-page-btn" [disabled]="currentPage() === totalPages()" (click)="goToPage(currentPage() + 1)">
          <span class="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
    </div>
  </div>

  <!-- FLOATING CONTEXT MENU -->
  @if (openMenuId() !== null && menuAnchorRect() !== null) {
    @if (confirmDeleteId() === openMenuId()) {
      <div class="pinv-menu" style="position:fixed"
           [style.top.px]="menuAnchorRect()!.top"
           [style.right.px]="menuAnchorRect()!.right"
           (click)="$event.stopPropagation()">
        <div class="pinv-menu__confirm">
          <p class="pinv-menu__confirm-text">Supprimer cette facture&nbsp;?</p>
          <div class="pinv-menu__confirm-actions">
            <button class="pinv-menu__confirm-cancel" (click)="cancelDelete($event)">Annuler</button>
            <button class="pinv-menu__confirm-ok" (click)="deleteInvoice(openMenuId()!, $event)">Supprimer</button>
          </div>
        </div>
      </div>
    } @else {
      <div class="pinv-menu" style="position:fixed"
           [style.top.px]="menuAnchorRect()!.top"
           [style.right.px]="menuAnchorRect()!.right"
           (click)="$event.stopPropagation()">
        <button class="pinv-menu__item" (click)="editInvoice(openMenuId()!)">
          <span class="material-symbols-outlined">edit</span>
          Modifier
        </button>
        <div class="pinv-menu__sep"></div>
        <button class="pinv-menu__item pinv-menu__item--danger" (click)="confirmDelete(openMenuId()!, $event)">
          <span class="material-symbols-outlined">delete</span>
          Supprimer
        </button>
      </div>
    }
  }

</div>
```

### Step 3 — SCSS

- [ ] **Create `purchase-invoices.component.scss`**

```scss
:host {
  display: block;
  background: var(--color-background);
  min-height: 100%;
}

.pinv-page {
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px 32px 48px;
  display: flex;
  flex-direction: column;
  gap: 20px;

  @media (max-width: 768px) { padding: 16px 16px 48px; }
}

/* Header */
.pinv-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.pinv-header__title {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-on-surface);
  line-height: 32px;
}
.pinv-header__sub {
  font-size: 14px;
  color: var(--color-on-surface-variant);
  margin-top: 2px;
}
.pinv-header__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  flex-shrink: 0;
}

/* Buttons */
.pinv-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 16px;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  text-decoration: none;
  transition: filter 0.15s, background 0.15s, border-color 0.15s;
  .material-symbols-outlined { font-size: 18px; }

  &--primary {
    background: var(--color-primary);
    color: var(--color-on-primary);
    border: none;
    &:hover { filter: brightness(1.15); }
  }
  &--outline {
    background: transparent;
    color: var(--color-primary);
    border: 1.5px solid var(--color-primary);
    &:hover { background: var(--color-surface-container-low); }
  }
}

.pinv-btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 36px;
  padding: 0 12px;
  background: transparent;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  color: var(--color-on-surface-variant);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  &:hover { background: var(--color-surface-container-low); border-color: var(--color-outline-variant); }
  .material-symbols-outlined { font-size: 16px; }
}

/* Card */
.pinv-card {
  background: var(--color-surface-container-lowest);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
}

/* Table header / controls */
.pinv-table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border-subtle);
  flex-wrap: wrap;
}
.pinv-table-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-on-surface);
  white-space: nowrap;
}
.pinv-table-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.pinv-search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
.pinv-search-icon {
  position: absolute;
  left: 8px;
  font-size: 16px;
  color: var(--color-on-surface-variant);
  pointer-events: none;
}
.pinv-search {
  height: 36px;
  padding: 0 12px 0 30px;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  background: var(--color-surface-container-lowest);
  font-size: 13px;
  font-family: inherit;
  color: var(--color-on-surface);
  width: 220px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  &:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(0,30,64,0.1); }
  &::placeholder { color: var(--color-on-surface-variant); opacity: 0.7; }
}
.pinv-filter-select {
  height: 36px;
  padding: 0 28px 0 10px;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  background: var(--color-surface-container-lowest);
  font-size: 13px;
  font-family: inherit;
  color: var(--color-on-surface-variant);
  cursor: pointer;
  outline: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='%2343474f'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 6px center;
  background-size: 18px;
  &:focus { border-color: var(--color-primary); }
}

/* Table */
.pinv-table-wrapper { overflow-x: auto; }
.pinv-table { width: 100%; border-collapse: collapse; }
.pinv-th {
  padding: 0 16px;
  height: 40px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-on-surface-variant);
  background: var(--color-surface-muted);
  text-align: left;
  white-space: nowrap;
  border-bottom: 1px solid var(--color-border-subtle);
  &--right  { text-align: right; }
  &--center { text-align: center; }
}
.pinv-tr {
  border-bottom: 1px solid var(--color-border-subtle);
  transition: background 0.12s;
  &:last-child { border-bottom: none; }
  &:hover { background: var(--color-surface-container-low); }
}
.pinv-td {
  padding: 0 16px;
  height: 52px;
  font-size: 13px;
  color: var(--color-on-surface);
  vertical-align: middle;
  &--code   { color: var(--color-on-surface-variant); font-size: 12px; }
  &--date   { color: var(--color-on-surface-variant); white-space: nowrap; }
  &--amount {
    text-align: right;
    font-weight: 600;
    font-variant-numeric: tabular-nums lining-nums;
    white-space: nowrap;
  }
  &--center { text-align: center; }
}

/* Supplier cell */
.pinv-supplier {
  display: flex;
  align-items: center;
  gap: 10px;
}
.pinv-avatar {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}
.pinv-supplier__name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-on-surface);
}

/* Status badges */
.pinv-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 2px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;

  &--recue     { background: rgba(59, 130, 246, 0.12); color: #2563EB; }
  &--validee   { background: rgba(99, 102, 241, 0.12); color: #4F46E5; }
  &--payee     { background: rgba(16, 185, 129, 0.12); color: #059669; }
  &--en-retard { background: rgba(239, 68, 68, 0.12);  color: #DC2626; }
}

/* Row action + menu */
.pinv-action-wrap { position: relative; display: inline-flex; justify-content: center; }
.pinv-row-action {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--color-on-surface-variant);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  transition: color 0.12s, background 0.12s;
  &:hover, &--active { color: var(--color-primary); background: var(--color-surface-container-low); }
  .material-symbols-outlined { font-size: 20px; }
}

.pinv-menu {
  min-width: 180px;
  background: var(--color-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06);
  z-index: 1000;
  overflow: hidden;
  animation: pinv-menu-in 0.14s ease;
}
@keyframes pinv-menu-in {
  from { opacity: 0; transform: translateY(-6px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.pinv-menu__item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 9px 14px;
  background: transparent;
  border: none;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-on-surface);
  cursor: pointer;
  text-align: left;
  transition: background 0.1s;
  .material-symbols-outlined { font-size: 17px; color: var(--color-on-surface-variant); }
  &:hover { background: var(--color-surface-container-low); }
  &--danger { color: #ef4444; .material-symbols-outlined { color: #ef4444; } &:hover { background: rgba(239,68,68,0.06); } }
}
.pinv-menu__sep { height: 1px; background: var(--color-border-subtle); margin: 4px 0; }
.pinv-menu__confirm { padding: 14px 14px 12px; display: flex; flex-direction: column; gap: 12px; }
.pinv-menu__confirm-text { font-size: 12px; color: var(--color-on-surface); font-weight: 500; line-height: 1.4; }
.pinv-menu__confirm-actions { display: flex; gap: 6px; justify-content: flex-end; }
.pinv-menu__confirm-cancel, .pinv-menu__confirm-ok {
  padding: 5px 12px;
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: opacity 0.12s;
  &:hover { opacity: 0.82; }
}
.pinv-menu__confirm-cancel { background: var(--color-surface-container-low); color: var(--color-on-surface); }
.pinv-menu__confirm-ok { background: #ef4444; color: #fff; }

/* Pagination */
.pinv-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-top: 1px solid var(--color-border-subtle);
  gap: 12px;
  flex-wrap: wrap;
}
.pinv-pagination__info { font-size: 12px; color: var(--color-on-surface-variant); }
.pinv-pagination__controls { display: flex; align-items: center; gap: 4px; }
.pinv-page-btn {
  min-width: 32px;
  height: 32px;
  padding: 0 6px;
  background: transparent;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  color: var(--color-on-surface-variant);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.12s, border-color 0.12s, color 0.12s;
  .material-symbols-outlined { font-size: 18px; }
  &:hover:not(:disabled):not(.pinv-page-btn--active) { background: var(--color-surface-container-low); border-color: var(--color-outline-variant); }
  &--active { background: var(--color-primary); border-color: var(--color-primary); color: var(--color-on-primary); cursor: default; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
}

/* Skeleton */
@keyframes pinv-shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position:  400px 0; }
}
%pinv-skel-base {
  display: inline-block;
  border-radius: 4px;
  background: linear-gradient(90deg, var(--color-surface-container) 25%, var(--color-surface-container-high) 50%, var(--color-surface-container) 75%);
  background-size: 400px 100%;
  animation: pinv-shimmer 1.4s ease infinite;
}
.pinv-skel         { @extend %pinv-skel-base; width: 120px; height: 12px; }
.pinv-skel--wide   { @extend %pinv-skel-base; width: 160px; height: 12px; }
.pinv-skel--short  { @extend %pinv-skel-base; width: 80px;  height: 12px; }
.pinv-skel--badge  { @extend %pinv-skel-base; width: 64px;  height: 20px; border-radius: 4px; }

/* Empty / error state */
.pinv-state {
  text-align: center;
  padding: 52px 24px !important;
  height: auto !important;
}
.pinv-state__icon {
  font-size: 34px !important;
  color: var(--color-on-surface-variant);
  opacity: 0.35;
  display: block;
  margin-bottom: 10px;
  &--error { color: #ef4444; opacity: 0.7; }
}
.pinv-state__msg { font-size: 14px; color: var(--color-on-surface-variant); }
```

- [ ] **Step 4: Commit**

```bash
git add src/app/features/purchase-invoices/purchase-invoices.component.ts \
        src/app/features/purchase-invoices/purchase-invoices.component.html \
        src/app/features/purchase-invoices/purchase-invoices.component.scss
git commit -m "feat: add purchase invoices list page"
```

---

## Task 4: Form Page (Create / Edit)

**Files:**
- Create: `src/app/features/purchase-invoices/new-purchase-invoice/new-purchase-invoice.component.ts`
- Create: `src/app/features/purchase-invoices/new-purchase-invoice/new-purchase-invoice.component.html`
- Create: `src/app/features/purchase-invoices/new-purchase-invoice/new-purchase-invoice.component.scss`

### Step 1 — Copy base styles

- [ ] **Copy the form SCSS from new-invoice (identical structure, same `ni-` CSS class names)**

```bash
cp src/app/features/invoices/new-invoice/new-invoice.component.scss \
   src/app/features/purchase-invoices/new-purchase-invoice/new-purchase-invoice.component.scss
```

### Step 2 — TypeScript

- [ ] **Create `new-purchase-invoice.component.ts`**

```typescript
import { Component, computed, signal, OnInit, inject, HostListener } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink, Router, ActivatedRoute } from '@angular/router'
import { CommonModule } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { forkJoin } from 'rxjs'
import { Currency } from '../../../shared/models/client.model'
import { Supplier } from '../../../shared/models/supplier.model'
import { PurchaseInvoiceService } from '../purchase-invoice.service'
import { LineItem, StoredPurchaseInvoice, PurchaseInvoiceStatus } from '../../../shared/models/purchase-invoice.model'

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

  allSuppliers      = signal<Supplier[]>([])
  selectedSupplier  = signal<Supplier | null>(null)
  supplierSearch    = signal('')
  supplierModalOpen = signal(false)

  filteredSupplierOptions = computed(() => {
    const q = this.supplierSearch().toLowerCase().trim()
    if (!q) return this.allSuppliers()
    return this.allSuppliers().filter(s =>
      s.companyName.toLowerCase().includes(q) ||
      s.contact.fullName.toLowerCase().includes(q) ||
      s.contact.email.toLowerCase().includes(q)
    )
  })

  currencies    = signal<Currency[]>([])
  configLoading = signal(true)

  private nextId = 1
  lineItems = signal<LineItem[]>([])
  vatRates  = [0, 7, 13, 19]

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

    const config$ = forkJoin({
      currencies: this.http.get<Currency[]>('/api/currencies'),
      suppliers:  this.http.get<Supplier[]>('/api/suppliers'),
    })

    if (this.editMode()) {
      forkJoin({ config: config$, invoice: this.service.getById(id!) }).subscribe({
        next: ({ config: { currencies, suppliers }, invoice }) => {
          this.currencies.set(currencies)
          this.allSuppliers.set(suppliers)
          this.configLoading.set(false)
          this.patchFromInvoice(invoice, suppliers)
        },
        error: () => this.router.navigate(['/purchase-invoices'])
      })
    } else {
      config$.subscribe({
        next: ({ currencies, suppliers }) => {
          this.currencies.set(currencies)
          this.allSuppliers.set(suppliers)
          this.configLoading.set(false)
        },
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
    this.status.set(inv.status)
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
    if (!this.editMode() && supplier.financial.currency) this.currency.set(supplier.financial.currency)
  }

  clearSupplier(event: MouseEvent): void { event.stopPropagation(); this.selectedSupplier.set(null) }

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

  formatAmount(value: number): string {
    const symbol = this.currencies().find(c => c.value === this.currency())?.symbol ?? this.currency()
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
      totalHT:       this.totalHT(),
      totalTTC:      this.totalTTC(),
      status:        this.status(),
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
```

### Step 3 — HTML

- [ ] **Create `new-purchase-invoice.component.html`**

```html
<div class="ni-page">

  <!-- STICKY TOPBAR -->
  <header class="ni-topbar">
    <nav class="ni-breadcrumb">
      <a routerLink="/purchase-invoices" class="ni-breadcrumb__link">Factures d'achat</a>
      <span class="material-symbols-outlined ni-breadcrumb__sep">chevron_right</span>
      <span class="ni-breadcrumb__current">{{ editMode() ? 'Modifier la facture' : 'Nouvelle facture d\'achat' }}</span>
    </nav>
    <div class="ni-topbar__actions">
      @if (saveError()) {
        <span class="ni-topbar__error">
          <span class="material-symbols-outlined">error</span>{{ saveError() }}
        </span>
      }
      <button type="button" class="ni-btn ni-btn--ghost" routerLink="/purchase-invoices" [disabled]="saving()">Annuler</button>
      <button type="button" class="ni-btn ni-btn--primary" (click)="save()" [disabled]="saving()">
        @if (saving()) {
          <span class="material-symbols-outlined ni-spin">progress_activity</span> Enregistrement…
        } @else {
          <span class="material-symbols-outlined">save</span>
          {{ editMode() ? 'Mettre à jour' : 'Enregistrer' }}
        }
      </button>
    </div>
  </header>

  <!-- PAGE HERO -->
  <div class="ni-hero">
    <h1 class="ni-hero__title">{{ editMode() ? 'Modifier la facture d\'achat' : 'Nouvelle facture d\'achat' }}</h1>
    <p class="ni-hero__sub">{{ editMode() ? 'Modifiez les informations de la facture ci-dessous.' : 'Renseignez les informations ci-dessous pour enregistrer une facture fournisseur.' }}</p>
  </div>

  <!-- TWO-COLUMN BODY -->
  <div class="ni-body">

    <div class="ni-form-col">

      <!-- 01 — Informations générales -->
      <section class="ni-section ni-anim-1">
        <div class="ni-section__head">
          <span class="ni-section__num">01</span>
          <div class="ni-section__icon-wrap"><span class="material-symbols-outlined">receipt_long</span></div>
          <div class="ni-section__meta">
            <h2 class="ni-section__title">Informations générales</h2>
            <p class="ni-section__desc">Identification et paramètres de la facture</p>
          </div>
        </div>
        <div class="ni-section__body">
          <div class="ni-grid ni-grid--4">

            <!-- Fournisseur -->
            <div class="ni-field ni-field--span2">
              <label class="ni-label">Fournisseur <span class="ni-required">*</span></label>
              <button
                type="button"
                class="ni-cs-trigger"
                [class.ni-cs-trigger--error]="supplierError()"
                (click)="openSupplierModal()"
              >
                @if (selectedSupplier(); as sup) {
                  <div class="ni-cs-trigger__avatar">{{ getInitials(sup.companyName) }}</div>
                  <div class="ni-cs-trigger__info">
                    <span class="ni-cs-trigger__name">{{ sup.companyName }}</span>
                    <span class="ni-cs-trigger__sub">{{ sup.contact.fullName }} · {{ sup.contact.email }}</span>
                  </div>
                  <span class="material-symbols-outlined ni-cs-trigger__edit">edit</span>
                  <span class="ni-cs-trigger__sep"></span>
                  <button type="button" class="ni-cs-trigger__clear" (click)="clearSupplier($event)">
                    <span class="material-symbols-outlined">close</span>
                  </button>
                } @else {
                  <span class="material-symbols-outlined ni-cs-trigger__icon">precision_manufacturing</span>
                  <span class="ni-cs-trigger__placeholder">Sélectionner un fournisseur…</span>
                  <span class="material-symbols-outlined ni-cs-trigger__arrow">arrow_forward</span>
                }
              </button>
              @if (supplierError()) {
                <p class="ni-field-error"><span class="material-symbols-outlined">error</span> Veuillez sélectionner un fournisseur.</p>
              }
            </div>

            <!-- Numéro de facture -->
            <div class="ni-field ni-field--span2">
              <label class="ni-label">Numéro de facture</label>
              <input class="ni-input ni-input--readonly" type="text" readonly [value]="invoiceNumber()" />
            </div>

            <!-- Date de facture -->
            <div class="ni-field">
              <label class="ni-label">Date de facture <span class="ni-required">*</span></label>
              <input class="ni-input" [class.ni-input--error]="issueDateError()" type="date" [ngModel]="issueDate()" (ngModelChange)="issueDate.set($event)" />
              @if (issueDateError()) {
                <p class="ni-field-error"><span class="material-symbols-outlined">error</span> La date est requise.</p>
              }
            </div>

            <!-- Date d'échéance -->
            <div class="ni-field">
              <label class="ni-label">Date d'échéance <span class="ni-required">*</span></label>
              <input class="ni-input" [class.ni-input--error]="dueDateError()" type="date" [ngModel]="dueDate()" (ngModelChange)="dueDate.set($event)" />
              @if (dueDateError()) {
                <p class="ni-field-error"><span class="material-symbols-outlined">error</span> L'échéance est requise.</p>
              }
            </div>

            <!-- Devise -->
            <div class="ni-field ni-field--span2">
              <label class="ni-label">Devise</label>
              <select class="ni-select" [ngModel]="currency()" (ngModelChange)="currency.set($event)">
                @if (configLoading()) {
                  <option value="">Chargement…</option>
                } @else {
                  @for (c of currencies(); track c.value) {
                    <option [value]="c.value">{{ c.label }}</option>
                  }
                }
              </select>
            </div>

          </div>
        </div>
      </section>

      <!-- 02 — Lignes de facture -->
      <section class="ni-section ni-anim-2" [class.ni-section--error]="noItemsError()">
        <div class="ni-section__head">
          <span class="ni-section__num">02</span>
          <div class="ni-section__icon-wrap"><span class="material-symbols-outlined">list_alt</span></div>
          <div class="ni-section__meta">
            <h2 class="ni-section__title">Lignes de facture <span class="ni-required">*</span></h2>
            <p class="ni-section__desc">Produits et services achetés</p>
          </div>
          @if (lineItems().length > 0) {
            <button type="button" class="ni-btn-add" (click)="addItem()">
              <span class="material-symbols-outlined">add_circle</span> Ajouter une ligne
            </button>
          }
        </div>

        @if (lineItems().length === 0) {
          <div class="ni-items-empty" [class.ni-items-empty--error]="noItemsError()">
            <div class="ni-items-empty__icon-wrap"><span class="material-symbols-outlined">receipt_long</span></div>
            <p class="ni-items-empty__title">Aucune ligne de facturation</p>
            <p class="ni-items-empty__sub">Ajoutez les produits ou services achetés.</p>
            @if (noItemsError()) {
              <p class="ni-field-error ni-field-error--center"><span class="material-symbols-outlined">error</span> Au moins une ligne est requise.</p>
            }
            <button type="button" class="ni-btn ni-btn--outline" (click)="addItem()">
              <span class="material-symbols-outlined">add</span> Ajouter une ligne
            </button>
          </div>
        } @else {
          <div class="ni-section__body ni-section__body--flush">
            <div class="ni-table-wrapper">
              <table class="ni-table">
                <thead>
                  <tr>
                    <th class="ni-th ni-th--drag"></th>
                    <th class="ni-th">Description <span class="ni-required">*</span></th>
                    <th class="ni-th ni-th--num">Qté</th>
                    <th class="ni-th ni-th--num">Prix HT</th>
                    <th class="ni-th ni-th--num">Remise %</th>
                    <th class="ni-th ni-th--num">TVA %</th>
                    <th class="ni-th ni-th--num">Total HT</th>
                    <th class="ni-th ni-th--action"></th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of lineItems(); track item.id) {
                    <tr class="ni-tr">
                      <td class="ni-td ni-td--drag"><span class="material-symbols-outlined ni-drag-handle">drag_indicator</span></td>
                      <td class="ni-td">
                        <input class="ni-cell-input" [class.ni-cell-input--error]="itemDescError(item)" type="text" placeholder="Description…" [ngModel]="item.description" (ngModelChange)="updateItem(item.id, 'description', $event)" />
                      </td>
                      <td class="ni-td ni-td--num">
                        <input class="ni-cell-input ni-cell-input--num" [class.ni-cell-input--error]="itemQtyError(item)" type="number" min="1" [ngModel]="item.qty" (ngModelChange)="updateItem(item.id, 'qty', +$event)" />
                      </td>
                      <td class="ni-td ni-td--num">
                        <input class="ni-cell-input ni-cell-input--num" [class.ni-cell-input--error]="itemPriceError(item)" type="number" min="0" step="0.01" [ngModel]="item.priceHT" (ngModelChange)="updateItem(item.id, 'priceHT', +$event)" />
                      </td>
                      <td class="ni-td ni-td--num">
                        <input class="ni-cell-input ni-cell-input--num" type="number" min="0" max="100" [ngModel]="item.discPct" (ngModelChange)="updateItem(item.id, 'discPct', +$event)" />
                      </td>
                      <td class="ni-td ni-td--num">
                        <select class="ni-cell-select" [ngModel]="item.vatPct" (ngModelChange)="updateItem(item.id, 'vatPct', +$event)">
                          @for (rate of vatRates; track rate) { <option [value]="rate">{{ rate }}%</option> }
                        </select>
                      </td>
                      <td class="ni-td ni-td--num ni-td--total">{{ formatAmount(lineTotal(item)) }}</td>
                      <td class="ni-td ni-td--action">
                        <button type="button" class="ni-btn-remove" (click)="removeItem(item.id)">
                          <span class="material-symbols-outlined">delete</span>
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      </section>

      <!-- 03 — Notes internes -->
      <section class="ni-section ni-anim-3">
        <div class="ni-section__head">
          <span class="ni-section__num">03</span>
          <div class="ni-section__icon-wrap"><span class="material-symbols-outlined">notes</span></div>
          <div class="ni-section__meta">
            <h2 class="ni-section__title">Notes internes</h2>
            <p class="ni-section__desc">Informations complémentaires (non visibles sur la facture)</p>
          </div>
        </div>
        <div class="ni-section__body">
          <div class="ni-field">
            <textarea class="ni-textarea" placeholder="Ajouter une note interne…" rows="4" [ngModel]="internalNotes()" (ngModelChange)="internalNotes.set($event)"></textarea>
          </div>
        </div>
      </section>

    </div><!-- /ni-form-col -->

    <!-- SUMMARY SIDEBAR -->
    <aside class="ni-summary ni-anim-4">
      <div class="ni-summary__head">
        <div class="ni-section__icon-wrap"><span class="material-symbols-outlined">calculate</span></div>
        <h2 class="ni-summary__title">Récapitulatif</h2>
      </div>

      <div class="ni-summary__totals">
        <div class="ni-summary__row">
          <span class="ni-summary__label">Total HT</span>
          <span class="ni-summary__value">{{ formatAmount(totalHT()) }}</span>
        </div>
        <div class="ni-summary__vat-block">
          <p class="ni-summary__vat-label">TVA</p>
          @for (vat of vatBreakdown(); track vat.rate) {
            <div class="ni-summary__row ni-summary__row--sub">
              <span class="ni-summary__label">TVA {{ vat.rate }}%</span>
              <span class="ni-summary__value">{{ formatAmount(vat.amount) }}</span>
            </div>
          }
          @if (vatBreakdown().length === 0) { <p class="ni-summary__vat-none">—</p> }
        </div>
        <div class="ni-summary__ttc-bar"></div>
        <div class="ni-summary__ttc-row">
          <span class="ni-summary__ttc-label">Total<br><small>TTC</small></span>
          <span class="ni-summary__ttc-amount">{{ formatAmount(totalTTC()) }}</span>
        </div>
      </div>

      @if (saveError()) {
        <p class="ni-summary__error"><span class="material-symbols-outlined">error</span> {{ saveError() }}</p>
      }

      <div class="ni-summary__actions">
        <button type="button" class="ni-btn ni-btn--primary ni-btn--full" (click)="save()" [disabled]="saving()">
          @if (saving()) {
            <span class="material-symbols-outlined ni-spin">progress_activity</span> Enregistrement…
          } @else {
            <span class="material-symbols-outlined">save</span>
            {{ editMode() ? 'Mettre à jour' : 'Enregistrer la facture' }}
          }
        </button>
        <button type="button" class="ni-btn ni-btn--ghost ni-btn--full" routerLink="/purchase-invoices" [disabled]="saving()">
          Annuler
        </button>
      </div>
    </aside>

  </div><!-- /ni-body -->

  <!-- SUPPLIER SELECTION MODAL -->
  @if (supplierModalOpen()) {
    <div class="ni-modal-backdrop" (click)="closeSupplierModal()">
      <div class="ni-modal" (click)="$event.stopPropagation()">

        <div class="ni-modal__header">
          <div class="ni-modal__header-left">
            <div class="ni-modal__icon-wrap"><span class="material-symbols-outlined">precision_manufacturing</span></div>
            <div>
              <h2 class="ni-modal__title">Sélectionner un fournisseur</h2>
              <p class="ni-modal__sub">{{ allSuppliers().length }} fournisseur{{ allSuppliers().length > 1 ? 's' : '' }} disponible{{ allSuppliers().length > 1 ? 's' : '' }}</p>
            </div>
          </div>
          <button type="button" class="ni-modal__close" (click)="closeSupplierModal()">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="ni-modal__search">
          <span class="material-symbols-outlined ni-modal__search-icon">search</span>
          <input class="ni-modal__search-input" type="text" placeholder="Rechercher par nom, contact ou email…" [ngModel]="supplierSearch()" (ngModelChange)="supplierSearch.set($event)" />
          @if (supplierSearch()) {
            <button type="button" class="ni-modal__search-clear" (click)="supplierSearch.set('')">
              <span class="material-symbols-outlined">close</span>
            </button>
          }
        </div>

        <div class="ni-modal__body">
          @if (filteredSupplierOptions().length === 0) {
            <div class="ni-modal__empty">
              <span class="material-symbols-outlined">precision_manufacturing</span>
              <p>Aucun fournisseur ne correspond à votre recherche.</p>
            </div>
          } @else {
            <ul class="ni-modal__list">
              @for (sup of filteredSupplierOptions(); track sup.id) {
                <li
                  class="ni-modal__item"
                  [class.ni-modal__item--selected]="selectedSupplier()?.id === sup.id"
                  (click)="selectSupplier(sup)"
                >
                  <div class="ni-modal__item-avatar">{{ getInitials(sup.companyName) }}</div>
                  <div class="ni-modal__item-body">
                    <div class="ni-modal__item-top">
                      <span class="ni-modal__item-name">{{ sup.companyName }}</span>
                      <span class="ni-modal__item-currency">{{ sup.financial.currency }}</span>
                    </div>
                    <div class="ni-modal__item-bottom">
                      <span class="material-symbols-outlined">person</span>
                      <span>{{ sup.contact.fullName }}</span>
                      <span class="ni-modal__item-dot">·</span>
                      <span class="material-symbols-outlined">mail</span>
                      <span>{{ sup.contact.email }}</span>
                      @if (sup.address.city) {
                        <span class="ni-modal__item-dot">·</span>
                        <span class="material-symbols-outlined">location_on</span>
                        <span>{{ sup.address.city }}</span>
                      }
                    </div>
                  </div>
                  @if (selectedSupplier()?.id === sup.id) {
                    <span class="material-symbols-outlined ni-modal__item-check">check_circle</span>
                  } @else {
                    <span class="material-symbols-outlined ni-modal__item-arrow">chevron_right</span>
                  }
                </li>
              }
            </ul>
          }
        </div>

        <div class="ni-modal__footer">
          <a routerLink="/supplier/create" class="ni-modal__footer-link">
            <span class="material-symbols-outlined">add_business</span>
            Créer un nouveau fournisseur
          </a>
          <button type="button" class="ni-btn ni-btn--ghost" (click)="closeSupplierModal()">Fermer</button>
        </div>

      </div>
    </div>
  }

</div>
```

- [ ] **Step 4: Commit**

```bash
git add src/app/features/purchase-invoices/new-purchase-invoice/
git commit -m "feat: add new purchase invoice form page"
```

---

## Task 5: Routing & Sidebar

**Files:**
- Modify: `src/app/app.routes.ts`
- Modify: `src/app/core/layout/main-layout.component.html`

### Step 1 — Routes

- [ ] **Add 3 routes to `src/app/app.routes.ts`**

Inside the `MainLayoutComponent` children array, after the existing `supplier/edit/:id` route, add:

```typescript
{
  path: 'purchase-invoices',
  loadComponent: () =>
    import('./features/purchase-invoices/purchase-invoices.component').then(m => m.PurchaseInvoicesComponent)
},
{
  path: 'purchase-invoice/create',
  loadComponent: () =>
    import('./features/purchase-invoices/new-purchase-invoice/new-purchase-invoice.component').then(m => m.NewPurchaseInvoiceComponent)
},
{
  path: 'purchase-invoice/edit/:id',
  loadComponent: () =>
    import('./features/purchase-invoices/new-purchase-invoice/new-purchase-invoice.component').then(m => m.NewPurchaseInvoiceComponent)
},
```

### Step 2 — Sidebar link

- [ ] **In `src/app/core/layout/main-layout.component.html`, change `routerLink="/bills"` to `routerLink="/purchase-invoices"`**

Find this line:
```html
<a routerLink="/bills" routerLinkActive="layout-nav__link--active" class="layout-nav__link">
```
Replace with:
```html
<a routerLink="/purchase-invoices" routerLinkActive="layout-nav__link--active" class="layout-nav__link">
```

The `NAV.BILLS` translation key already maps to "Factures d'achat" in `src/assets/i18n/fr.json` — no translation change needed.

- [ ] **Step 3: Commit**

```bash
git add src/app/app.routes.ts src/app/core/layout/main-layout.component.html
git commit -m "feat: wire purchase invoices routes and sidebar link"
```

---

## Verification

After all tasks, run the dev server and verify:

```bash
npm start
```

Check:
1. Sidebar "Factures d'achat" link navigates to `/purchase-invoices`
2. List page renders with header + table + skeleton while loading
3. "Nouvelle facture" button navigates to `/purchase-invoice/create`
4. Form shows supplier modal, line items, totals
5. Save redirects back to `/purchase-invoices`
6. Edit route (`/purchase-invoice/edit/:id`) pre-populates the form
7. Delete with confirmation removes the row
8. Search and status filter work correctly
