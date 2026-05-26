# Suppliers Screen — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Créer l'écran Fournisseurs complet (liste + formulaire create/edit) en clonant le module Clients avec les adaptations spécifiques aux fournisseurs.

**Architecture:** Clone du module `features/clients/` vers `features/suppliers/` avec préfixe CSS `sp-` pour la liste et `ns-` pour le formulaire. Le modèle Supplier ajoute un champ `category` et des champs `openBalance`/`lastInvoiceDate`. Les types partagés `Country`, `Currency`, `PaymentTerm` sont importés depuis `client.model.ts`.

**Tech Stack:** Angular 17 standalone components, signals, ReactiveFormsModule, @ngx-translate/core, HttpClient, SCSS avec variables CSS custom properties.

---

## Fichiers créés / modifiés

| Action | Fichier |
|--------|---------|
| Create | `src/app/shared/models/supplier.model.ts` |
| Create | `src/app/features/suppliers/supplier.service.ts` |
| Create | `src/app/features/suppliers/suppliers.component.ts` |
| Create | `src/app/features/suppliers/suppliers.component.html` |
| Create | `src/app/features/suppliers/suppliers.component.scss` |
| Create | `src/app/features/suppliers/new-supplier/new-supplier.component.ts` |
| Create | `src/app/features/suppliers/new-supplier/new-supplier.component.html` |
| Create | `src/app/features/suppliers/new-supplier/new-supplier.component.scss` |
| Modify | `src/app/app.routes.ts` |
| Modify | `src/assets/i18n/fr.json` |
| Modify | `src/assets/i18n/en.json` |

---

## Task 1 : Modèle Supplier

**Files:**
- Create: `src/app/shared/models/supplier.model.ts`

- [ ] **Step 1 : Créer le fichier modèle**

```typescript
// src/app/shared/models/supplier.model.ts

export interface SupplierContact {
  fullName: string
  email: string
  phone: string
}

export interface SupplierAddress {
  street: string
  city: string
  postalCode: string
  country: string
}

export interface SupplierFinancial {
  taxId: string
  currency: string
  paymentTerms: string
}

export interface CreateSupplierDto {
  companyName: string
  website: string
  category: string
  contact: SupplierContact
  address: SupplierAddress
  financial: SupplierFinancial
}

export interface Supplier extends CreateSupplierDto {
  id: string
  reference: string
  openBalance: number
  lastInvoiceDate: string
  createdAt: string
}

export const SUPPLIER_CATEGORIES = [
  'Informatique',
  'Transport',
  'Fournitures',
  'Services professionnels',
  'Télécommunications',
  'Autre',
] as const
```

- [ ] **Step 2 : Vérifier la compilation**

```bash
npx tsc --noEmit
```

Expected : aucune erreur.

---

## Task 2 : SupplierService

**Files:**
- Create: `src/app/features/suppliers/supplier.service.ts`

- [ ] **Step 1 : Créer le service**

```typescript
// src/app/features/suppliers/supplier.service.ts
import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { Supplier, CreateSupplierDto } from '../../shared/models/supplier.model'
import { Country, Currency, PaymentTerm } from '../../shared/models/client.model'

@Injectable({ providedIn: 'root' })
export class SupplierService {
  constructor(private http: HttpClient) {}

  getCountries(): Observable<Country[]> {
    return this.http.get<Country[]>('/api/countries')
  }

  getCurrencies(): Observable<Currency[]> {
    return this.http.get<Currency[]>('/api/currencies')
  }

  getPaymentTerms(): Observable<PaymentTerm[]> {
    return this.http.get<PaymentTerm[]>('/api/paymentTerms')
  }

  getAll(): Observable<Supplier[]> {
    return this.http.get<Supplier[]>('/api/suppliers')
  }

  getById(id: string): Observable<Supplier> {
    return this.http.get<Supplier>(`/api/suppliers/${id}`)
  }

  create(dto: CreateSupplierDto): Observable<Supplier> {
    return this.http.post<Supplier>('/api/suppliers', dto)
  }

  update(id: string, dto: CreateSupplierDto): Observable<Supplier> {
    return this.http.put<Supplier>(`/api/suppliers/${id}`, dto)
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/api/suppliers/${id}`)
  }
}
```

- [ ] **Step 2 : Vérifier la compilation**

```bash
npx tsc --noEmit
```

Expected : aucune erreur.

---

## Task 3 : SuppliersComponent — TypeScript

**Files:**
- Create: `src/app/features/suppliers/suppliers.component.ts`

- [ ] **Step 1 : Créer le composant**

```typescript
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

  openBalanceTotal = computed(() =>
    this.allSuppliers().reduce((sum, s) => sum + s.openBalance, 0)
  )

  overdueTotal = computed(() => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
    return this.allSuppliers()
      .filter(s => s.openBalance > 0 && new Date(s.lastInvoiceDate).getTime() < cutoff)
      .reduce((sum, s) => sum + s.openBalance, 0)
  })

  nouveaux30j = computed(() => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
    return this.allSuppliers().filter(s => new Date(s.createdAt).getTime() >= cutoff).length
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
        s.openBalance > 0 && new Date(s.lastInvoiceDate).getTime() < cutoff
      )
    }
    if (tab === 'high-priority') {
      return suppliers.filter(s => s.openBalance > 5000)
    }
    return suppliers
  })

  filteredSuppliers = computed(() => {
    const q = this.searchQuery().toLowerCase()
    if (!q) return this.tabFilteredSuppliers()
    return this.tabFilteredSuppliers().filter(s =>
      s.companyName.toLowerCase().includes(q) ||
      s.contact.fullName.toLowerCase().includes(q) ||
      s.contact.email.toLowerCase().includes(q) ||
      s.address.city.toLowerCase().includes(q)
    )
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
    return value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TND'
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  }
}
```

- [ ] **Step 2 : Vérifier la compilation**

```bash
npx tsc --noEmit
```

Expected : aucune erreur.

---

## Task 4 : SuppliersComponent — Template HTML

**Files:**
- Create: `src/app/features/suppliers/suppliers.component.html`

- [ ] **Step 1 : Créer le template**

```html
<div class="sp-page">

  <!-- PAGE HEADER -->
  <div class="sp-header">
    <div class="sp-header__info">
      <h1 class="sp-header__title">{{ 'SUPPLIERS.TITLE' | translate }}</h1>
      <p class="sp-header__sub">{{ 'SUPPLIERS.SUBTITLE' | translate }}</p>
    </div>
    <div class="sp-header__actions">
      <div class="sp-search-wrapper">
        <span class="material-symbols-outlined sp-search-icon">search</span>
        <input
          class="sp-search"
          type="text"
          [placeholder]="'SUPPLIERS.SEARCH_PLACEHOLDER' | translate"
          [ngModel]="searchQuery()"
          (ngModelChange)="onSearchChange($event)"
        />
      </div>
      <a routerLink="/supplier/create" class="sp-btn sp-btn--primary">
        <span class="material-symbols-outlined">add_business</span>
        {{ 'SUPPLIERS.NEW_SUPPLIER' | translate }}
      </a>
    </div>
  </div>

  <!-- KPI STRIP — 4 cartes -->
  <div class="sp-kpi-strip">
    <div class="sp-kpi sp-kpi--green">
      <p class="sp-kpi__label">{{ 'SUPPLIERS.KPI_TOTAL' | translate }}</p>
      <p class="sp-kpi__value">
        @if (loading()) { <span class="sp-kpi__skeleton"></span> }
        @else {
          {{ totalSuppliers().toLocaleString('fr-FR') }}
          <span class="sp-kpi__trend material-symbols-outlined">trending_up</span>
        }
      </p>
    </div>
    <div class="sp-kpi sp-kpi--amber">
      <p class="sp-kpi__label">{{ 'SUPPLIERS.KPI_BALANCE' | translate }}</p>
      <p class="sp-kpi__value">
        @if (loading()) { <span class="sp-kpi__skeleton"></span> }
        @else { {{ formatAmount(openBalanceTotal()) }} }
      </p>
    </div>
    <div class="sp-kpi sp-kpi--red">
      <p class="sp-kpi__label">{{ 'SUPPLIERS.KPI_OVERDUE' | translate }}</p>
      <p class="sp-kpi__value sp-kpi__value--danger">
        @if (loading()) { <span class="sp-kpi__skeleton"></span> }
        @else { {{ formatAmount(overdueTotal()) }} }
      </p>
    </div>
    <div class="sp-kpi sp-kpi--blue">
      <p class="sp-kpi__label">{{ 'SUPPLIERS.KPI_NEW' | translate }}</p>
      <p class="sp-kpi__value">
        {{ nouveaux30j() }}
        <span class="sp-kpi__trend material-symbols-outlined">trending_up</span>
      </p>
    </div>
  </div>

  <!-- CARD : filter tabs + table + pagination -->
  <div class="sp-card">

    <!-- Filter tabs -->
    <div class="sp-filter-bar">
      <div class="sp-filter-bar__tabs">
        <button type="button" class="sp-tab" [class.sp-tab--active]="activeTab() === 'all'"
          (click)="setTab('all')">
          {{ 'SUPPLIERS.TAB_ALL' | translate }}
        </button>
        <button type="button" class="sp-tab" [class.sp-tab--active]="activeTab() === 'overdue'"
          (click)="setTab('overdue')">
          {{ 'SUPPLIERS.TAB_OVERDUE' | translate }}
        </button>
        <button type="button" class="sp-tab" [class.sp-tab--active]="activeTab() === 'high-priority'"
          (click)="setTab('high-priority')">
          {{ 'SUPPLIERS.TAB_HIGH_PRIORITY' | translate }}
        </button>
      </div>
    </div>

    <!-- TABLE -->
    <div class="sp-table-wrapper">
      <table class="sp-table">
        <thead>
          <tr>
            <th class="sp-th">{{ 'SUPPLIERS.COL_NAME' | translate }}</th>
            <th class="sp-th">{{ 'SUPPLIERS.COL_CATEGORY' | translate }}</th>
            <th class="sp-th sp-th--right">{{ 'SUPPLIERS.COL_BALANCE' | translate }}</th>
            <th class="sp-th">{{ 'SUPPLIERS.COL_CURRENCY' | translate }}</th>
            <th class="sp-th">{{ 'SUPPLIERS.COL_LAST_INVOICE' | translate }}</th>
            <th class="sp-th sp-th--center">{{ 'SUPPLIERS.COL_ACTIONS' | translate }}</th>
          </tr>
        </thead>
        <tbody>

          @if (loading()) {
            @for (_ of [1,2,3,4]; track $index) {
              <tr class="sp-tr sp-tr--skeleton">
                <td class="sp-td"><span class="sp-skeleton sp-skeleton--wide"></span></td>
                <td class="sp-td"><span class="sp-skeleton sp-skeleton--short"></span></td>
                <td class="sp-td"><span class="sp-skeleton sp-skeleton--short"></span></td>
                <td class="sp-td"><span class="sp-skeleton sp-skeleton--short"></span></td>
                <td class="sp-td"><span class="sp-skeleton sp-skeleton--short"></span></td>
                <td class="sp-td"></td>
              </tr>
            }
          } @else if (error()) {
            <tr>
              <td colspan="6" class="sp-td sp-state">
                <span class="material-symbols-outlined sp-state__icon sp-state__icon--error">error</span>
                <p class="sp-state__msg">{{ error() }}</p>
              </td>
            </tr>
          } @else if (pagedSuppliers().length === 0) {
            <tr>
              <td colspan="6" class="sp-td sp-state">
                <span class="material-symbols-outlined sp-state__icon">inventory_2</span>
                <p class="sp-state__msg">{{ 'SUPPLIERS.EMPTY' | translate }}</p>
              </td>
            </tr>
          } @else {
            @for (supplier of pagedSuppliers(); track supplier.id) {
              <tr class="sp-tr">

                <td class="sp-td">
                  <div class="sp-company">
                    <div class="sp-avatar">{{ initials(supplier.companyName) }}</div>
                    <div>
                      <p class="sp-company__name">{{ supplier.companyName }}</p>
                      <p class="sp-company__ref">{{ supplier.reference }}</p>
                    </div>
                  </div>
                </td>

                <td class="sp-td">
                  <span class="sp-badge sp-badge--category">{{ supplier.category }}</span>
                </td>

                <td class="sp-td sp-td--amount">{{ formatAmount(supplier.openBalance) }}</td>

                <td class="sp-td sp-td--muted">{{ supplier.financial.currency }}</td>

                <td class="sp-td sp-td--muted sp-td--date">{{ formatDate(supplier.lastInvoiceDate) }}</td>

                <td class="sp-td sp-td--center">
                  <div class="sp-action-wrap">
                    <button type="button" class="sp-row-action"
                      (click)="toggleMenu(supplier.id, $event)">
                      <span class="material-symbols-outlined">more_horiz</span>
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
    @if (!loading() && !error() && filteredSuppliers().length > 0) {
      <div class="sp-pagination">
        <span class="sp-pagination__info">
          {{ 'SUPPLIERS.PAGE_INFO' | translate: { start: pageStart(), end: pageEnd(), total: filteredSuppliers().length } }}
        </span>
        <div class="sp-pagination__controls">
          <button type="button" class="sp-page-btn"
            [disabled]="currentPage() === 1"
            (click)="goToPage(currentPage() - 1)">
            <span class="material-symbols-outlined">chevron_left</span>
          </button>

          @for (p of visiblePages(); track $index) {
            @if (p === '...') {
              <span class="sp-page-ellipsis">…</span>
            } @else {
              <button type="button" class="sp-page-btn"
                [class.sp-page-btn--active]="p === currentPage()"
                (click)="goToPage(+p)">{{ p }}</button>
            }
          }

          <button type="button" class="sp-page-btn"
            [disabled]="currentPage() === totalPages()"
            (click)="goToPage(currentPage() + 1)">
            <span class="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>
    }

  </div>

  <!-- Floating action menu — position:fixed pour échapper au overflow -->
  @if (openMenuId() !== null && menuAnchorRect() !== null) {
    @if (confirmDeleteId() === openMenuId()) {
      <div class="sp-menu" style="position:fixed"
           [style.top.px]="menuAnchorRect()!.top"
           [style.right.px]="menuAnchorRect()!.right"
           (click)="$event.stopPropagation()">
        <p class="sp-menu__confirm-text">
          <span class="material-symbols-outlined">warning</span>
          Supprimer ce fournisseur ?
        </p>
        <div class="sp-menu__confirm-btns">
          <button class="sp-menu__cancel-btn" (click)="confirmDeleteId.set(null)">Annuler</button>
          <button class="sp-menu__delete-btn" (click)="deleteSupplier(openMenuId()!, $event)">Supprimer</button>
        </div>
      </div>
    } @else {
      <div class="sp-menu" style="position:fixed"
           [style.top.px]="menuAnchorRect()!.top"
           [style.right.px]="menuAnchorRect()!.right"
           (click)="$event.stopPropagation()">
        <button class="sp-menu__item" (click)="editSupplier(openMenuId()!)">
          <span class="material-symbols-outlined">edit</span>
          Modifier
        </button>
        <div class="sp-menu__sep"></div>
        <button class="sp-menu__item sp-menu__item--danger"
          (click)="confirmDelete(openMenuId()!, $event)">
          <span class="material-symbols-outlined">delete</span>
          Supprimer
        </button>
      </div>
    }
  }

</div>
```

---

## Task 5 : SuppliersComponent — Styles SCSS

**Files:**
- Create: `src/app/features/suppliers/suppliers.component.scss`

- [ ] **Step 1 : Créer le fichier de styles**

```scss
/* =====================================================
   SUPPLIERS PAGE
   ===================================================== */

:host {
  display: block;
  background: var(--color-background);
  min-height: 100%;
}

.sp-page {
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px 32px 48px;
  display: flex;
  flex-direction: column;
  gap: 20px;

  @media (max-width: 768px) {
    padding: 16px 16px 48px;
  }
}

/* =====================================================
   PAGE HEADER
   ===================================================== */
.sp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.sp-header__title {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-on-surface);
  line-height: 32px;
}

.sp-header__sub {
  font-size: 14px;
  color: var(--color-on-surface-variant);
  margin-top: 2px;
}

.sp-header__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

/* Search */
.sp-search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
.sp-search-icon {
  position: absolute;
  left: 10px;
  font-size: 18px;
  color: var(--color-on-surface-variant);
  pointer-events: none;
}
.sp-search {
  height: 40px;
  padding: 0 14px 0 36px;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  background: var(--color-surface-container-lowest);
  font-size: 14px;
  font-family: inherit;
  color: var(--color-on-surface);
  width: 240px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;

  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(0, 30, 64, 0.1);
  }
  &::placeholder { color: var(--color-on-surface-variant); opacity: 0.7; }

  @media (max-width: 480px) { width: 100%; }
}

/* Buttons */
.sp-btn {
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
  border: none;
  transition: filter 0.15s;

  .material-symbols-outlined { font-size: 18px; }

  &--primary {
    background: var(--color-primary);
    color: var(--color-on-primary);
    &:hover { filter: brightness(1.15); }
  }
}

/* =====================================================
   KPI STRIP — 4 colonnes
   ===================================================== */
.sp-kpi-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  background: var(--color-surface-container-lowest);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
}

.sp-kpi {
  padding: 20px 24px;
  position: relative;
  border-right: 1px solid var(--color-border-subtle);

  &:last-child { border-right: none; }

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
  }

  &--green::before  { background: var(--color-status-paid); }
  &--amber::before  { background: var(--color-status-pending); }
  &--red::before    { background: var(--color-status-overdue); }
  &--blue::before   { background: var(--color-status-sent); }

  @media (max-width: 900px) {
    border-right: none;
    border-bottom: 1px solid var(--color-border-subtle);
    &:last-child { border-bottom: none; }
  }
}

.sp-kpi__label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-on-surface-variant);
  margin-bottom: 10px;
}

.sp-kpi__value {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-on-surface);
  line-height: 1;
  font-variant-numeric: tabular-nums lining-nums;
  letter-spacing: -0.02em;
  display: flex;
  align-items: center;
  gap: 10px;

  &--danger { color: var(--color-status-overdue); }
}

.sp-kpi__trend {
  font-size: 22px !important;
  color: var(--color-status-paid);
}

.sp-kpi__skeleton {
  display: inline-block;
  width: 60px;
  height: 28px;
  border-radius: 6px;
  background: linear-gradient(90deg, var(--color-surface-container) 25%, var(--color-surface-container-high) 50%, var(--color-surface-container) 75%);
  background-size: 400px 100%;
  animation: shimmer 1.4s ease infinite;
}

/* =====================================================
   FILTER BAR
   ===================================================== */
.sp-filter-bar {
  padding: 0 16px;
  border-bottom: 1px solid var(--color-border-subtle);
  background: var(--color-surface-muted);
}

.sp-filter-bar__tabs {
  display: flex;
  gap: 0;
}

.sp-tab {
  height: 44px;
  padding: 0 16px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-family: inherit;
  color: var(--color-on-surface-variant);
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
  margin-bottom: -1px;

  &:hover { color: var(--color-on-surface); }

  &--active {
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
  }
}

/* =====================================================
   CARD
   ===================================================== */
.sp-card {
  background: var(--color-surface-container-lowest);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

/* =====================================================
   TABLE
   ===================================================== */
.sp-table-wrapper {
  overflow-x: auto;
}

.sp-table {
  width: 100%;
  border-collapse: collapse;
}

.sp-th {
  padding: 0 16px;
  height: 40px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-on-surface-variant);
  background: var(--color-surface-muted);
  border-bottom: 1px solid var(--color-border-subtle);
  text-align: left;
  white-space: nowrap;

  &--right  { text-align: right; }
  &--center { text-align: center; }
}

.sp-tr {
  border-bottom: 1px solid var(--color-border-subtle);
  transition: background 0.12s;

  &:last-child { border-bottom: none; }
  &:hover { background: var(--color-surface-container-low); }
}

.sp-td {
  padding: 0 16px;
  height: 48px;
  font-size: 13px;
  color: var(--color-on-surface);
  vertical-align: middle;

  &--muted  { color: var(--color-on-surface-variant); }
  &--center { text-align: center; }
  &--amount {
    text-align: right;
    font-weight: 600;
    font-variant-numeric: tabular-nums lining-nums;
    white-space: nowrap;
  }
  &--date { white-space: nowrap; font-size: 12px; }
}

/* Company cell */
.sp-company {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sp-avatar {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--color-primary);
  color: var(--color-on-primary);
  font-size: 11px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  letter-spacing: 0.02em;
}

.sp-company__name {
  font-weight: 600;
  color: var(--color-on-surface);
  font-size: 13px;
  line-height: 1.3;
}

.sp-company__ref {
  font-size: 11px;
  color: var(--color-on-surface-variant);
  opacity: 0.7;
}

/* Empty / error state */
.sp-state {
  text-align: center;
  padding: 56px 24px !important;
  height: auto !important;
}

.sp-state__icon {
  font-size: 36px !important;
  color: var(--color-on-surface-variant);
  opacity: 0.4;
  display: block;
  margin-bottom: 10px;

  &--error { color: #ef4444; opacity: 0.7; }
}

.sp-state__msg {
  font-size: 14px;
  color: var(--color-on-surface-variant);
}

/* Skeleton loader */
@keyframes shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}

%skeleton-base {
  display: inline-block;
  height: 12px;
  border-radius: 4px;
  background: linear-gradient(90deg, var(--color-surface-container) 25%, var(--color-surface-container-high) 50%, var(--color-surface-container) 75%);
  background-size: 400px 100%;
  animation: shimmer 1.4s ease infinite;
}

.sp-skeleton        { @extend %skeleton-base; width: 120px; }
.sp-skeleton--wide  { @extend %skeleton-base; width: 160px; }
.sp-skeleton--short { @extend %skeleton-base; width: 80px; }

/* Badges */
.sp-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 2px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  white-space: nowrap;

  &--category {
    background: rgba(81, 95, 116, 0.12);
    color: var(--color-secondary);
    text-transform: uppercase;
  }
}

/* Row action */
.sp-row-action {
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

  &:hover {
    color: var(--color-primary);
    background: var(--color-surface-container-low);
  }
  .material-symbols-outlined { font-size: 20px; }
}

/* =====================================================
   ACTION DROPDOWN MENU
   ===================================================== */
.sp-action-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.sp-menu {
  z-index: 1000;
  background: var(--color-surface-container-lowest);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.06);
  min-width: 160px;
  padding: 4px;
  animation: menu-in 0.12s ease;

  @keyframes menu-in {
    from { opacity: 0; transform: translateY(-4px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
}

.sp-menu__item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 10px;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  color: var(--color-on-surface);
  cursor: pointer;
  transition: background 0.1s, color 0.1s;
  text-align: left;

  .material-symbols-outlined { font-size: 17px; }

  &:hover { background: var(--color-surface-container-low); }

  &--danger {
    color: #dc2626;
    &:hover { background: rgba(239, 68, 68, 0.08); }
  }
}

.sp-menu__sep {
  height: 1px;
  background: var(--color-border-subtle);
  margin: 3px 4px;
}

.sp-menu__confirm-text {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px 6px;
  font-size: 12px;
  font-weight: 600;
  color: #dc2626;

  .material-symbols-outlined { font-size: 16px; }
}

.sp-menu__confirm-btns {
  display: flex;
  gap: 6px;
  padding: 0 4px 4px;
}

.sp-menu__cancel-btn,
.sp-menu__delete-btn {
  flex: 1;
  height: 28px;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  border: none;
  transition: filter 0.12s;

  &:hover { filter: brightness(1.1); }
}

.sp-menu__cancel-btn {
  background: var(--color-surface-container);
  color: var(--color-on-surface-variant);
}

.sp-menu__delete-btn {
  background: #dc2626;
  color: #fff;
}

/* =====================================================
   PAGINATION
   ===================================================== */
.sp-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-top: 1px solid var(--color-border-subtle);
  gap: 12px;
  flex-wrap: wrap;
}

.sp-pagination__info {
  font-size: 12px;
  color: var(--color-on-surface-variant);
}

.sp-pagination__controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.sp-page-ellipsis {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: var(--color-on-surface-variant);
}

.sp-page-btn {
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

  &:hover:not(:disabled):not(.sp-page-btn--active) {
    background: var(--color-surface-container-low);
    border-color: var(--color-outline-variant);
    color: var(--color-on-surface);
  }

  &--active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-on-primary);
    cursor: default;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}
```

---

## Task 6 : NewSupplierComponent — TypeScript

**Files:**
- Create: `src/app/features/suppliers/new-supplier/new-supplier.component.ts`

- [ ] **Step 1 : Créer le composant**

```typescript
// src/app/features/suppliers/new-supplier/new-supplier.component.ts
import { Component, signal, OnInit } from '@angular/core'
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms'
import { RouterLink, Router, ActivatedRoute } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'
import { forkJoin } from 'rxjs'
import { SupplierService } from '../supplier.service'
import { CreateSupplierDto, SUPPLIER_CATEGORIES } from '../../../shared/models/supplier.model'
import { Country, Currency, PaymentTerm } from '../../../shared/models/client.model'

function optionalUrl(control: AbstractControl): ValidationErrors | null {
  const v = (control.value ?? '').trim()
  if (!v) return null
  return /^https?:\/\/.+\..+/.test(v) ? null : { invalidUrl: true }
}

function optionalPhone(control: AbstractControl): ValidationErrors | null {
  const v = (control.value ?? '').trim()
  if (!v) return null
  return /^[+\d][\d\s\-(). ]{5,}$/.test(v) ? null : { invalidPhone: true }
}

@Component({
  selector: 'app-new-supplier',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslateModule],
  templateUrl: './new-supplier.component.html',
  styleUrl: './new-supplier.component.scss'
})
export class NewSupplierComponent implements OnInit {

  form!: FormGroup
  readonly categories = SUPPLIER_CATEGORIES

  editMode      = signal(false)
  loading       = signal(false)
  configLoading = signal(true)
  formSubmitted = signal(false)
  errorMsg      = signal('')

  countries           = signal<Country[]>([])
  currencies          = signal<Currency[]>([])
  paymentTermsOptions = signal<PaymentTerm[]>([])

  get f() { return this.form.controls }

  private supplierId: string | null = null

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private supplierService: SupplierService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.nonNullable.group({
      companyName: ['', Validators.required],
      website:     ['', optionalUrl],
      category:    ['', Validators.required],
      fullName:    ['', Validators.required],
      email:       ['', [Validators.required, Validators.email]],
      phone:       ['', optionalPhone],
      street:      ['', Validators.required],
      city:        ['', Validators.required],
      postalCode:  ['', Validators.required],
      country:     [{ value: 'Tunisie', disabled: true }],
      taxId:       [''],
      currency:    [{ value: 'TND', disabled: true }],
      paymentTerms:[{ value: 'Net 30', disabled: true }],
    })

    this.supplierId = this.route.snapshot.paramMap.get('id')
    if (this.supplierId) {
      this.editMode.set(true)
      this.supplierService.getById(this.supplierId).subscribe({
        next: (supplier) => this.form.patchValue({
          companyName:  supplier.companyName,
          website:      supplier.website,
          category:     supplier.category,
          fullName:     supplier.contact.fullName,
          email:        supplier.contact.email,
          phone:        supplier.contact.phone,
          street:       supplier.address.street,
          city:         supplier.address.city,
          postalCode:   supplier.address.postalCode,
          country:      supplier.address.country,
          taxId:        supplier.financial.taxId,
          currency:     supplier.financial.currency,
          paymentTerms: supplier.financial.paymentTerms,
        }),
        error: () => this.router.navigate(['/suppliers'])
      })
    }

    forkJoin({
      countries:    this.supplierService.getCountries(),
      currencies:   this.supplierService.getCurrencies(),
      paymentTerms: this.supplierService.getPaymentTerms()
    }).subscribe({
      next: ({ countries, currencies, paymentTerms }) => {
        this.countries.set(countries)
        this.currencies.set(currencies)
        this.paymentTermsOptions.set(paymentTerms)
        this.form.get('country')?.enable()
        this.form.get('currency')?.enable()
        this.form.get('paymentTerms')?.enable()
        this.configLoading.set(false)
      },
      error: () => {
        this.form.get('country')?.enable()
        this.form.get('currency')?.enable()
        this.form.get('paymentTerms')?.enable()
        this.configLoading.set(false)
      }
    })
  }

  save(): void {
    this.form.markAllAsTouched()
    this.formSubmitted.set(true)
    if (this.form.invalid) return

    this.loading.set(true)
    this.errorMsg.set('')

    const v = this.form.getRawValue()
    const dto: CreateSupplierDto = {
      companyName: v.companyName,
      website:     v.website,
      category:    v.category,
      contact: {
        fullName: v.fullName,
        email:    v.email,
        phone:    v.phone
      },
      address: {
        street:     v.street,
        city:       v.city,
        postalCode: v.postalCode,
        country:    v.country
      },
      financial: {
        taxId:        v.taxId,
        currency:     v.currency,
        paymentTerms: v.paymentTerms
      }
    }

    const request$ = this.editMode()
      ? this.supplierService.update(this.supplierId!, dto)
      : this.supplierService.create(dto)

    request$.subscribe({
      next: () => { this.loading.set(false); this.router.navigate(['/suppliers']) },
      error: (e) => {
        this.errorMsg.set(e?.error?.message ?? 'Une erreur est survenue. Veuillez réessayer.')
        this.loading.set(false)
      }
    })
  }

  cancel(): void {
    this.router.navigate(['/suppliers'])
  }
}
```

- [ ] **Step 2 : Vérifier la compilation**

```bash
npx tsc --noEmit
```

Expected : aucune erreur.

---

## Task 7 : NewSupplierComponent — Template HTML

**Files:**
- Create: `src/app/features/suppliers/new-supplier/new-supplier.component.html`

- [ ] **Step 1 : Créer le template**

```html
<div class="ns-page" [formGroup]="form">

  <!-- STICKY TOPBAR -->
  <header class="ns-topbar">
    <nav class="ns-breadcrumb">
      <a routerLink="/suppliers" class="ns-breadcrumb__link">{{ 'NEW_SUPPLIER.BREADCRUMB' | translate }}</a>
      <span class="material-symbols-outlined ns-breadcrumb__sep">chevron_right</span>
      <span class="ns-breadcrumb__current">{{ 'NEW_SUPPLIER.BREADCRUMB_CURRENT' | translate }}</span>
    </nav>
    <div class="ns-topbar__actions">
      @if (errorMsg()) {
        <span class="ns-error-inline">
          <span class="material-symbols-outlined">error</span>
          {{ errorMsg() }}
        </span>
      }
      <button type="button" class="ns-btn ns-btn--ghost" (click)="cancel()" [disabled]="loading()">
        {{ 'NEW_SUPPLIER.CANCEL' | translate }}
      </button>
      <button type="button" class="ns-btn ns-btn--primary" (click)="save()" [disabled]="loading()">
        @if (loading()) {
          <span class="material-symbols-outlined ns-spin">progress_activity</span>
        } @else {
          <span class="material-symbols-outlined">save</span>
        }
        {{ loading() ? ('NEW_SUPPLIER.SAVING' | translate) : ('NEW_SUPPLIER.SAVE' | translate) }}
      </button>
    </div>
  </header>

  <!-- PAGE HERO -->
  <div class="ns-hero">
    <h1 class="ns-hero__title">
      {{ (editMode() ? 'NEW_SUPPLIER.EDIT_TITLE' : 'NEW_SUPPLIER.TITLE') | translate }}
    </h1>
    <p class="ns-hero__sub">
      {{ (editMode() ? 'NEW_SUPPLIER.EDIT_SUB' : 'NEW_SUPPLIER.CREATE_SUB') | translate }}
    </p>
  </div>

  <!-- FORM SECTIONS -->
  <div class="ns-form">

    <!-- 01 — Informations générales -->
    <section class="ns-section ns-anim-1">
      <div class="ns-section__head">
        <span class="ns-section__num">01</span>
        <div class="ns-section__icon-wrap">
          <span class="material-symbols-outlined">store</span>
        </div>
        <div class="ns-section__meta">
          <h2 class="ns-section__title">{{ 'NEW_SUPPLIER.SECTION_GENERAL' | translate }}</h2>
          <p class="ns-section__desc">Identité légale, présence en ligne et catégorie</p>
        </div>
      </div>
      <div class="ns-section__body">
        <div class="ns-grid ns-grid--2">

          <div class="ns-field">
            <label class="ns-label" for="companyName">
              {{ 'NEW_SUPPLIER.COMPANY_NAME' | translate }}
              <span class="ns-required">*</span>
            </label>
            <input id="companyName" class="ns-input" type="text"
              [class.ns-input--error]="f['companyName'].invalid && f['companyName'].touched"
              [placeholder]="'NEW_SUPPLIER.COMPANY_PLACEHOLDER' | translate"
              formControlName="companyName" />
            @if (f['companyName'].invalid && f['companyName'].touched) {
              <p class="ns-field-error">
                <span class="material-symbols-outlined">error</span>
                Le nom de la société est requis.
              </p>
            }
          </div>

          <div class="ns-field">
            <label class="ns-label" for="website">{{ 'NEW_SUPPLIER.WEBSITE' | translate }}</label>
            <div class="ns-input-icon-wrap">
              <span class="material-symbols-outlined ns-input-icon">language</span>
              <input id="website" class="ns-input ns-input--icon" type="url"
                placeholder="https://www.fournisseur.com"
                [class.ns-input--error]="f['website'].invalid && f['website'].touched"
                formControlName="website" />
            </div>
            @if (f['website'].hasError('invalidUrl') && f['website'].touched) {
              <p class="ns-field-error">
                <span class="material-symbols-outlined">error</span>
                L'URL doit commencer par https:// ou http://
              </p>
            }
          </div>

          <div class="ns-field">
            <label class="ns-label" for="category">
              {{ 'NEW_SUPPLIER.CATEGORY' | translate }}
              <span class="ns-required">*</span>
            </label>
            <select id="category" class="ns-select"
              [class.ns-input--error]="f['category'].invalid && f['category'].touched"
              formControlName="category">
              <option value="">{{ 'NEW_SUPPLIER.CATEGORY_PLACEHOLDER' | translate }}</option>
              @for (cat of categories; track cat) {
                <option [value]="cat">{{ cat }}</option>
              }
            </select>
            @if (f['category'].invalid && f['category'].touched) {
              <p class="ns-field-error">
                <span class="material-symbols-outlined">error</span>
                La catégorie est requise.
              </p>
            }
          </div>

        </div>
      </div>
    </section>

    <!-- 02 — Contact principal -->
    <section class="ns-section ns-anim-2">
      <div class="ns-section__head">
        <span class="ns-section__num">02</span>
        <div class="ns-section__icon-wrap">
          <span class="material-symbols-outlined">person</span>
        </div>
        <div class="ns-section__meta">
          <h2 class="ns-section__title">{{ 'NEW_SUPPLIER.SECTION_CONTACT' | translate }}</h2>
          <p class="ns-section__desc">Interlocuteur principal pour les commandes et factures</p>
        </div>
      </div>
      <div class="ns-section__body">
        <div class="ns-grid ns-grid--3">

          <div class="ns-field">
            <label class="ns-label" for="fullName">
              {{ 'NEW_SUPPLIER.FULL_NAME' | translate }}
              <span class="ns-required">*</span>
            </label>
            <input id="fullName" class="ns-input" type="text" placeholder="Ahmed Ben Salem"
              [class.ns-input--error]="f['fullName'].invalid && f['fullName'].touched"
              formControlName="fullName" />
            @if (f['fullName'].invalid && f['fullName'].touched) {
              <p class="ns-field-error">
                <span class="material-symbols-outlined">error</span>
                Le nom complet est requis.
              </p>
            }
          </div>

          <div class="ns-field">
            <label class="ns-label" for="email">
              {{ 'NEW_SUPPLIER.EMAIL' | translate }}
              <span class="ns-required">*</span>
            </label>
            <input id="email" class="ns-input" type="email" placeholder="contact@fournisseur.com"
              [class.ns-input--error]="f['email'].invalid && f['email'].touched"
              formControlName="email" />
            @if (f['email'].touched) {
              @if (f['email'].hasError('required')) {
                <p class="ns-field-error">
                  <span class="material-symbols-outlined">error</span>
                  L'adresse e-mail est requise.
                </p>
              } @else if (f['email'].hasError('email')) {
                <p class="ns-field-error">
                  <span class="material-symbols-outlined">error</span>
                  L'adresse e-mail n'est pas valide.
                </p>
              }
            }
          </div>

          <div class="ns-field">
            <label class="ns-label" for="phone">{{ 'NEW_SUPPLIER.PHONE' | translate }}</label>
            <input id="phone" class="ns-input" type="tel" placeholder="+216 71 000 000"
              [class.ns-input--error]="f['phone'].invalid && f['phone'].touched"
              formControlName="phone" />
            @if (f['phone'].hasError('invalidPhone') && f['phone'].touched) {
              <p class="ns-field-error">
                <span class="material-symbols-outlined">error</span>
                Le numéro de téléphone est invalide.
              </p>
            }
          </div>

        </div>
      </div>
    </section>

    <!-- 03 — Adresse -->
    <section class="ns-section ns-anim-3">
      <div class="ns-section__head">
        <span class="ns-section__num">03</span>
        <div class="ns-section__icon-wrap">
          <span class="material-symbols-outlined">location_on</span>
        </div>
        <div class="ns-section__meta">
          <h2 class="ns-section__title">{{ 'NEW_SUPPLIER.SECTION_ADDRESS' | translate }}</h2>
          <p class="ns-section__desc">Adresse du siège ou de l'entrepôt principal</p>
        </div>
      </div>
      <div class="ns-section__body">
        <div class="ns-grid ns-grid--1">

          <div class="ns-field">
            <label class="ns-label" for="street">
              {{ 'NEW_SUPPLIER.STREET' | translate }}
              <span class="ns-required">*</span>
            </label>
            <textarea id="street" class="ns-textarea" rows="2"
              placeholder="Rue de l'Industrie, Zone Industrielle"
              [class.ns-textarea--error]="f['street'].invalid && f['street'].touched"
              formControlName="street"></textarea>
            @if (f['street'].invalid && f['street'].touched) {
              <p class="ns-field-error">
                <span class="material-symbols-outlined">error</span>
                L'adresse est requise.
              </p>
            }
          </div>

          <div class="ns-grid ns-grid--3">

            <div class="ns-field">
              <label class="ns-label" for="city">
                {{ 'NEW_SUPPLIER.CITY' | translate }}
                <span class="ns-required">*</span>
              </label>
              <input id="city" class="ns-input" type="text" placeholder="Tunis"
                [class.ns-input--error]="f['city'].invalid && f['city'].touched"
                formControlName="city" />
              @if (f['city'].invalid && f['city'].touched) {
                <p class="ns-field-error">
                  <span class="material-symbols-outlined">error</span>
                  La ville est requise.
                </p>
              }
            </div>

            <div class="ns-field">
              <label class="ns-label" for="postalCode">
                {{ 'NEW_SUPPLIER.POSTAL_CODE' | translate }}
                <span class="ns-required">*</span>
              </label>
              <input id="postalCode" class="ns-input" type="text" placeholder="1000"
                [class.ns-input--error]="f['postalCode'].invalid && f['postalCode'].touched"
                formControlName="postalCode" />
              @if (f['postalCode'].invalid && f['postalCode'].touched) {
                <p class="ns-field-error">
                  <span class="material-symbols-outlined">error</span>
                  Le code postal est requis.
                </p>
              }
            </div>

            <div class="ns-field">
              <label class="ns-label" for="country">{{ 'NEW_SUPPLIER.COUNTRY' | translate }}</label>
              <select id="country" class="ns-select" formControlName="country">
                @if (configLoading()) {
                  <option value="">Chargement…</option>
                } @else {
                  @for (c of countries(); track c.value) {
                    <option [value]="c.value">{{ c.label }}</option>
                  }
                }
              </select>
            </div>

          </div>
        </div>
      </div>
    </section>

    <!-- 04 — Détails financiers -->
    <section class="ns-section ns-anim-4">
      <div class="ns-section__head">
        <span class="ns-section__num">04</span>
        <div class="ns-section__icon-wrap">
          <span class="material-symbols-outlined">account_balance</span>
        </div>
        <div class="ns-section__meta">
          <h2 class="ns-section__title">{{ 'NEW_SUPPLIER.SECTION_FINANCIAL' | translate }}</h2>
          <p class="ns-section__desc">Paramètres de paiement et identifiants fiscaux</p>
        </div>
      </div>
      <div class="ns-section__body">
        <div class="ns-grid ns-grid--3">

          <div class="ns-field">
            <label class="ns-label" for="taxId">{{ 'NEW_SUPPLIER.TAX_ID' | translate }}</label>
            <input id="taxId" class="ns-input" type="text" placeholder="TN 12 345 678 901"
              formControlName="taxId" />
          </div>

          <div class="ns-field">
            <label class="ns-label" for="currency">{{ 'NEW_SUPPLIER.CURRENCY' | translate }}</label>
            <select id="currency" class="ns-select" formControlName="currency">
              @if (configLoading()) {
                <option value="">Chargement…</option>
              } @else {
                @for (c of currencies(); track c.value) {
                  <option [value]="c.value">{{ c.label }}</option>
                }
              }
            </select>
          </div>

          <div class="ns-field">
            <label class="ns-label" for="paymentTerms">{{ 'NEW_SUPPLIER.PAYMENT_TERMS' | translate }}</label>
            <select id="paymentTerms" class="ns-select" formControlName="paymentTerms">
              @if (configLoading()) {
                <option value="">Chargement…</option>
              } @else {
                @for (t of paymentTermsOptions(); track t.value) {
                  <option [value]="t.value">{{ t.label }}</option>
                }
              }
            </select>
          </div>

        </div>
      </div>
    </section>

  </div><!-- /ns-form -->

  <!-- FOOTER ACTIONS -->
  <footer class="ns-footer ns-anim-5">
    @if (formSubmitted() && form.invalid) {
      <p class="ns-footer__error">
        <span class="material-symbols-outlined">error</span>
        Veuillez corriger les erreurs avant d'enregistrer.
      </p>
    } @else if (errorMsg()) {
      <p class="ns-footer__error">
        <span class="material-symbols-outlined">error</span>
        {{ errorMsg() }}
      </p>
    }
    <div class="ns-footer__btns">
      <button type="button" class="ns-btn ns-btn--ghost ns-btn--lg" (click)="cancel()" [disabled]="loading()">
        {{ 'NEW_SUPPLIER.CANCEL' | translate }}
      </button>
      <button type="button" class="ns-btn ns-btn--primary ns-btn--lg" (click)="save()" [disabled]="loading()">
        @if (loading()) {
          <span class="material-symbols-outlined ns-spin">progress_activity</span>
        } @else {
          <span class="material-symbols-outlined">save</span>
        }
        {{ loading() ? ('NEW_SUPPLIER.SAVING' | translate) : ('NEW_SUPPLIER.SAVE' | translate) }}
      </button>
    </div>
  </footer>

</div>
```

---

## Task 8 : NewSupplierComponent — Styles SCSS

**Files:**
- Create: `src/app/features/suppliers/new-supplier/new-supplier.component.scss`

- [ ] **Step 1 : Créer le fichier de styles**

```scss
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');

:host {
  display: block;
  background: var(--color-background);
  min-height: 100%;
}

.ns-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 32px 80px;

  @media (max-width: 640px) {
    padding: 0 16px 64px;
  }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

.ns-anim-1 { animation: slideUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) 0.04s both; }
.ns-anim-2 { animation: slideUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) 0.12s both; }
.ns-anim-3 { animation: slideUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) 0.20s both; }
.ns-anim-4 { animation: slideUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) 0.28s both; }
.ns-anim-5 { animation: slideUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) 0.36s both; }

.ns-topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding: 12px 0;
  margin-bottom: 40px;
  background: rgba(249, 249, 254, 0.88);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--color-border-subtle);
  animation: slideUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.ns-breadcrumb {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}

.ns-breadcrumb__link {
  color: var(--color-on-surface-variant);
  text-decoration: none;
  transition: color 0.15s;
  &:hover { color: var(--color-primary); }
}

.ns-breadcrumb__sep {
  font-size: 16px;
  color: var(--color-on-surface-variant);
  opacity: 0.4;
}

.ns-breadcrumb__current {
  color: var(--color-on-surface);
  font-weight: 500;
}

.ns-topbar__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ns-error-inline {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #ef4444;
  font-size: 13px;
  font-weight: 500;

  .material-symbols-outlined { font-size: 15px; }
}

.ns-hero {
  margin-bottom: 40px;
  animation: slideUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) 0s both;
}

.ns-hero__title {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: var(--color-on-surface);
  line-height: 1.2;
  margin-bottom: 6px;
}

.ns-hero__sub {
  font-size: 13.5px;
  color: var(--color-on-surface-variant);
  line-height: 1.6;
}

.ns-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ns-section {
  background: var(--color-surface-container-lowest);
  border: 1px solid var(--color-border-subtle);
  border-radius: 12px;
  overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:hover {
    border-color: rgba(0, 30, 64, 0.18);
    box-shadow: 0 2px 16px rgba(0, 30, 64, 0.06);
  }
}

.ns-section__head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 22px;
  background: var(--color-surface-container-low);
  border-bottom: 1px solid var(--color-border-subtle);
}

.ns-section__num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 7px;
  background: var(--color-primary);
  color: var(--color-on-primary);
  font-family: 'Syne', sans-serif;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.ns-section__icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: rgba(0, 30, 64, 0.07);

  .material-symbols-outlined {
    font-size: 17px;
    color: var(--color-primary);
  }
}

.ns-section__meta { flex: 1; min-width: 0; }

.ns-section__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-on-surface);
  line-height: 1.3;
}

.ns-section__desc {
  font-size: 12px;
  color: var(--color-on-surface-variant);
  margin-top: 1px;
  line-height: 1.4;
}

.ns-section__body { padding: 24px 22px; }

.ns-grid {
  display: grid;
  gap: 20px;

  &--1 { grid-template-columns: 1fr; }
  &--2 { grid-template-columns: 1fr 1fr; }
  &--3 { grid-template-columns: repeat(3, 1fr); }

  @media (max-width: 680px) {
    &--2, &--3 { grid-template-columns: 1fr; }
  }
}

.ns-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ns-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--color-on-surface-variant);
}

%field-base {
  height: 42px;
  width: 100%;
  border: 1.5px solid var(--color-border-subtle);
  border-radius: 8px;
  background: #fff;
  font-size: 14px;
  font-family: inherit;
  color: var(--color-on-surface);
  padding: 0 12px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;

  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(0, 30, 64, 0.09);
  }

  &::placeholder {
    color: var(--color-on-surface-variant);
    opacity: 0.45;
  }
}

.ns-input {
  @extend %field-base;
  &--icon { padding-left: 36px; }
}

.ns-input-icon-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.ns-input-icon {
  position: absolute;
  left: 10px;
  font-size: 16px;
  color: var(--color-on-surface-variant);
  opacity: 0.55;
  pointer-events: none;
}

.ns-select {
  @extend %field-base;
  appearance: none;
  cursor: pointer;
  padding-right: 36px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='%2343474f'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 18px;
  background-color: #fff;
}

.ns-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1.5px solid var(--color-border-subtle);
  border-radius: 8px;
  background: #fff;
  font-size: 14px;
  font-family: inherit;
  color: var(--color-on-surface);
  resize: vertical;
  outline: none;
  line-height: 1.55;
  transition: border-color 0.15s, box-shadow 0.15s;

  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(0, 30, 64, 0.09);
  }

  &::placeholder {
    color: var(--color-on-surface-variant);
    opacity: 0.45;
  }
}

.ns-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 38px;
  padding: 0 16px;
  border-radius: 8px;
  font-size: 13.5px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;

  .material-symbols-outlined { font-size: 17px; }

  &--primary {
    background: var(--color-primary);
    color: var(--color-on-primary);
    border: none;

    &:hover:not(:disabled) {
      background: #002d5c;
      box-shadow: 0 4px 14px rgba(0, 30, 64, 0.28);
    }

    &:active:not(:disabled) { transform: scale(0.98); }
  }

  &--ghost {
    background: transparent;
    color: var(--color-on-surface-variant);
    border: 1.5px solid var(--color-border-subtle);

    &:hover:not(:disabled) {
      background: var(--color-surface-container-low);
      color: var(--color-on-surface);
      border-color: var(--color-outline-variant);
    }
  }

  &--lg { height: 44px; padding: 0 22px; font-size: 14px; }

  &:disabled { opacity: 0.45; cursor: not-allowed; }
}

.ns-footer {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--color-border-subtle);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.ns-footer__btns {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ns-footer__error {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #ef4444;
  font-size: 13px;
  font-weight: 500;
  margin-right: auto;

  .material-symbols-outlined { font-size: 16px; }
}

.ns-required { color: #ef4444; margin-left: 2px; }

.ns-input--error {
  border-color: #ef4444 !important;
  &:focus {
    border-color: #ef4444 !important;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
  }
}

.ns-textarea--error {
  border-color: #ef4444 !important;
  &:focus {
    border-color: #ef4444 !important;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
  }
}

.ns-field-error {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  color: #ef4444;
  margin-top: -2px;
  animation: slideUp 0.2s ease both;

  .material-symbols-outlined { font-size: 14px; flex-shrink: 0; }
}

.ns-spin { animation: spin 0.9s linear infinite; }

@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
```

---

## Task 9 : Routes

**Files:**
- Modify: `src/app/app.routes.ts`

- [ ] **Step 1 : Ajouter les 3 routes dans le bloc `MainLayoutComponent` children**

Dans `src/app/app.routes.ts`, après la route `invoice/edit/:id`, ajouter :

```typescript
      {
        path: 'suppliers',
        loadComponent: () =>
          import('./features/suppliers/suppliers.component').then(m => m.SuppliersComponent)
      },
      {
        path: 'supplier/create',
        loadComponent: () =>
          import('./features/suppliers/new-supplier/new-supplier.component').then(m => m.NewSupplierComponent)
      },
      {
        path: 'supplier/edit/:id',
        loadComponent: () =>
          import('./features/suppliers/new-supplier/new-supplier.component').then(m => m.NewSupplierComponent)
      },
```

- [ ] **Step 2 : Vérifier la compilation**

```bash
npx tsc --noEmit
```

Expected : aucune erreur.

---

## Task 10 : Traductions i18n

**Files:**
- Modify: `src/assets/i18n/fr.json`
- Modify: `src/assets/i18n/en.json`

- [ ] **Step 1 : Ajouter les clés françaises dans `fr.json`**

Ajouter les deux blocs suivants à la racine du JSON (après `"CLIENTS"` et `"NEW_CLIENT"`) :

```json
"SUPPLIERS": {
  "TITLE": "Fournisseurs",
  "SUBTITLE": "Gérez votre base de fournisseurs et suivez vos achats.",
  "SEARCH_PLACEHOLDER": "Rechercher un fournisseur...",
  "NEW_SUPPLIER": "Nouveau Fournisseur",
  "KPI_TOTAL": "Fournisseurs actifs",
  "KPI_BALANCE": "Solde ouvert total",
  "KPI_OVERDUE": "Montant en retard",
  "KPI_NEW": "Nouveaux (30j)",
  "TAB_ALL": "Tous",
  "TAB_OVERDUE": "En retard",
  "TAB_HIGH_PRIORITY": "Priorité haute",
  "COL_NAME": "Fournisseur",
  "COL_CATEGORY": "Catégorie",
  "COL_BALANCE": "Solde ouvert",
  "COL_CURRENCY": "Devise",
  "COL_LAST_INVOICE": "Dernière facture",
  "COL_ACTIONS": "Actions",
  "EMPTY": "Aucun fournisseur trouvé.",
  "PAGE_INFO": "Affichage de {{start}} à {{end}} sur {{total}} fournisseurs"
},
"NEW_SUPPLIER": {
  "BREADCRUMB": "Fournisseurs",
  "BREADCRUMB_CURRENT": "Nouveau Fournisseur",
  "CANCEL": "Annuler",
  "SAVE": "Enregistrer",
  "SAVING": "Enregistrement...",
  "TITLE": "Nouveau Profil Fournisseur",
  "EDIT_TITLE": "Modifier le Fournisseur",
  "CREATE_SUB": "Remplissez les informations ci-dessous pour ajouter un nouveau fournisseur.",
  "EDIT_SUB": "Modifiez les informations du fournisseur puis enregistrez.",
  "SECTION_GENERAL": "Informations générales",
  "COMPANY_NAME": "Raison sociale",
  "COMPANY_PLACEHOLDER": "Société Industrielle SA",
  "WEBSITE": "Site web",
  "CATEGORY": "Catégorie",
  "CATEGORY_PLACEHOLDER": "Sélectionner une catégorie",
  "SECTION_CONTACT": "Contact principal",
  "FULL_NAME": "Nom complet",
  "EMAIL": "Adresse e-mail",
  "PHONE": "Numéro de téléphone",
  "SECTION_ADDRESS": "Adresse",
  "STREET": "Rue",
  "CITY": "Ville",
  "POSTAL_CODE": "Code postal",
  "COUNTRY": "Pays",
  "SECTION_FINANCIAL": "Détails financiers",
  "TAX_ID": "N° TVA / MF",
  "CURRENCY": "Devise",
  "PAYMENT_TERMS": "Conditions de paiement"
}
```

- [ ] **Step 2 : Ajouter les clés anglaises dans `en.json`**

```json
"SUPPLIERS": {
  "TITLE": "Suppliers",
  "SUBTITLE": "Manage your supplier base and track your purchases.",
  "SEARCH_PLACEHOLDER": "Search a supplier...",
  "NEW_SUPPLIER": "New Supplier",
  "KPI_TOTAL": "Active suppliers",
  "KPI_BALANCE": "Total open balance",
  "KPI_OVERDUE": "Overdue amount",
  "KPI_NEW": "New this month (30d)",
  "TAB_ALL": "All",
  "TAB_OVERDUE": "Overdue",
  "TAB_HIGH_PRIORITY": "High Priority",
  "COL_NAME": "Supplier",
  "COL_CATEGORY": "Category",
  "COL_BALANCE": "Open Balance",
  "COL_CURRENCY": "Currency",
  "COL_LAST_INVOICE": "Last Invoice",
  "COL_ACTIONS": "Actions",
  "EMPTY": "No suppliers found.",
  "PAGE_INFO": "Showing {{start}} to {{end}} of {{total}} suppliers"
},
"NEW_SUPPLIER": {
  "BREADCRUMB": "Suppliers",
  "BREADCRUMB_CURRENT": "New Supplier",
  "CANCEL": "Cancel",
  "SAVE": "Save Supplier",
  "SAVING": "Saving...",
  "TITLE": "New Supplier Profile",
  "EDIT_TITLE": "Edit Supplier",
  "CREATE_SUB": "Fill in the information below to add a new supplier.",
  "EDIT_SUB": "Update the supplier information and save your changes.",
  "SECTION_GENERAL": "General Information",
  "COMPANY_NAME": "Company Name",
  "COMPANY_PLACEHOLDER": "Industrial Corp SA",
  "WEBSITE": "Website",
  "CATEGORY": "Category",
  "CATEGORY_PLACEHOLDER": "Select a category",
  "SECTION_CONTACT": "Primary Contact",
  "FULL_NAME": "Full Name",
  "EMAIL": "Email Address",
  "PHONE": "Phone Number",
  "SECTION_ADDRESS": "Address",
  "STREET": "Street",
  "CITY": "City",
  "POSTAL_CODE": "Postal Code",
  "COUNTRY": "Country",
  "SECTION_FINANCIAL": "Financial Details",
  "TAX_ID": "Tax ID / VAT Number",
  "CURRENCY": "Currency",
  "PAYMENT_TERMS": "Payment Terms"
}
```

- [ ] **Step 3 : Démarrer le serveur et vérifier visuellement**

```bash
npm start
```

Naviguer vers `http://localhost:4200/suppliers` et vérifier :
- La page charge sans erreur console
- Les 4 KPI cards s'affichent avec les bonnes couleurs de barre latérale
- Les onglets Tous / En retard / Priorité haute fonctionnent
- La recherche filtre bien les résultats
- Le bouton "Nouveau Fournisseur" navigue vers `/supplier/create`
- Le formulaire create affiche les 4 sections avec le champ Catégorie
- La validation requise s'affiche correctement au submit
- Le formulaire navigue vers `/suppliers` après save/cancel
