# Filter Currencies in Invoice Forms Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static `CURRENCIES` array in the sales invoice and purchase invoice create/edit forms with a dynamic list fetched from the company's configured currencies (`GET /api/settings/currencies`).

**Architecture:** Both `NewInvoiceComponent` and `NewPurchaseInvoiceComponent` use `inject()` for dependencies (not constructor injection). Add `private companyService = inject(CompanyService)` to each. Call `getSupportedCurrencies()` at the top of `ngOnInit`, populate a `signal<CurrencyItem[]>([])`, and in create mode set the `currency` signal (not a form control — it's a plain signal) to `defaultCurrency`. The symbol lookup helper also needs updating from `c.value` to `c.isoCode`.

**Tech Stack:** Angular 17 standalone components, signals, `CompanyService` (already exists in `comptabilite-frontend/src/app/features/settings/company.service.ts`), `CurrencyItem` interface (`comptabilite-frontend/src/app/shared/models/company-profile.model.ts`).

---

### Task 1: Update `NewInvoiceComponent` to load currencies from API

**Files:**
- Modify: `comptabilite-frontend/src/app/features/invoices/new-invoice/new-invoice.component.ts`
- Modify: `comptabilite-frontend/src/app/features/invoices/new-invoice/new-invoice.component.html`

**Current state of relevant lines:**
- Line 7: `import { Currency, Client, CURRENCIES } from '../../../shared/models/client.model'` — remove `Currency` and `CURRENCIES`, keep `Client`
- Lines 44–46: `inject()` fields for `http`, `router`, `route` — add `companyService` here
- Line 56: `currency = signal('TND')` — this is the selected currency (plain signal, not form control)
- Line 78: `readonly currencies: Currency[] = CURRENCIES` — replace with signal
- Line 139: start of `ngOnInit` — add `getSupportedCurrencies()` call at the top
- Line 223: `const symbol = this.currencies.find(c => c.value === this.currency())?.symbol ?? this.currency()` — update lookup
- Template line 159: `@for (c of currencies; track c.value)` with `c.value` / `c.label`

- [ ] **Step 1: Update imports**

In `new-invoice.component.ts`:

Remove `Currency` and `CURRENCIES` from `client.model` import, keep `Client`:
```ts
// before
import { Currency, Client, CURRENCIES } from '../../../shared/models/client.model'

// after
import { Client } from '../../../shared/models/client.model'
```

Add `CurrencyItem` and `CompanyService` imports:
```ts
import { CurrencyItem } from '../../../shared/models/company-profile.model'
import { CompanyService } from '../../settings/company.service'
```

- [ ] **Step 2: Inject `CompanyService` and replace the static `currencies` field**

Add the `companyService` inject field immediately after the existing inject fields (around line 44):
```ts
private http          = inject(HttpClient)
private router        = inject(Router)
private route         = inject(ActivatedRoute)
private companyService = inject(CompanyService)
```

Replace the `currencies` field (line 78):
```ts
// before
readonly currencies: Currency[] = CURRENCIES

// after
currencies = signal<CurrencyItem[]>([])
```

- [ ] **Step 3: Load supported currencies in `ngOnInit`**

At the very top of `ngOnInit()` (before the `id` check), add:
```ts
this.companyService.getSupportedCurrencies().subscribe({
  next: ({ defaultCurrency, currencies }) => {
    this.currencies.set(currencies)
    if (!this.editMode()) {
      this.currency.set(defaultCurrency)
    }
  },
  error: () => {}
})
```

- [ ] **Step 4: Update the symbol lookup helper**

Find (around line 223):
```ts
const symbol = this.currencies.find(c => c.value === this.currency())?.symbol ?? this.currency()
```

Replace with:
```ts
const symbol = this.currencies().find(c => c.isoCode === this.currency())?.symbol ?? this.currency()
```

- [ ] **Step 5: Update the template `@for` loop**

In `new-invoice.component.html`, find:
```html
@for (c of currencies; track c.value) {
  <option [value]="c.value">{{ c.label }}</option>
}
```

Replace with:
```html
@for (c of currencies(); track c.isoCode) {
  <option [value]="c.isoCode">{{ c.isoCode }} – {{ c.currencyName }}</option>
}
```

- [ ] **Step 6: Verify the app compiles**

```bash
cd /home/houssem/projects/compta/comptabilite-frontend && npx tsc --noEmit
```
Expected: only the 2 pre-existing `company.service.spec.ts` errors, no new errors.

- [ ] **Step 7: Commit**

```bash
git add comptabilite-frontend/src/app/features/invoices/new-invoice/new-invoice.component.ts \
        comptabilite-frontend/src/app/features/invoices/new-invoice/new-invoice.component.html
git commit -m "feat(invoices): load currency dropdown from company settings"
```

---

### Task 2: Update `NewPurchaseInvoiceComponent` to load currencies from API

**Files:**
- Modify: `comptabilite-frontend/src/app/features/purchase-invoices/new-purchase-invoice/new-purchase-invoice.component.ts`
- Modify: `comptabilite-frontend/src/app/features/purchase-invoices/new-purchase-invoice/new-purchase-invoice.component.html`

**Current state of relevant lines:**
- Line 6: `import { Currency, CURRENCIES } from '../../../shared/models/client.model'` — remove both
- Lines 22–25: `inject()` fields for `http`, `router`, `route`, `service` — add `companyService` here
- Line 33: `currency = signal('TND')` — plain signal for selected currency
- Line 56: `readonly currencies: Currency[] = CURRENCIES` — replace with signal
- Line 123: start of `ngOnInit`
- Line 340: `const symbol = this.currencies.find(c => c.value === this.currency())?.symbol ?? this.currency()`
- Template line 243: `@for (c of currencies; track c.value)`

- [ ] **Step 1: Update imports**

Remove `Currency` and `CURRENCIES` from `client.model` import entirely (nothing else is imported from it in this component):
```ts
// before
import { Currency, CURRENCIES } from '../../../shared/models/client.model'

// after — delete this line entirely
```

Add `CurrencyItem` and `CompanyService` imports:
```ts
import { CurrencyItem } from '../../../shared/models/company-profile.model'
import { CompanyService } from '../../settings/company.service'
```

- [ ] **Step 2: Inject `CompanyService` and replace the static `currencies` field**

Add `companyService` inject field after the existing inject fields (around line 25):
```ts
private http          = inject(HttpClient)
private router        = inject(Router)
private route         = inject(ActivatedRoute)
private service       = inject(PurchaseInvoiceService)
private companyService = inject(CompanyService)
```

Replace the `currencies` field (line 56):
```ts
// before
readonly currencies: Currency[] = CURRENCIES

// after
currencies = signal<CurrencyItem[]>([])
```

- [ ] **Step 3: Load supported currencies in `ngOnInit`**

At the very top of `ngOnInit()` (before the `id` check at line 124), add:
```ts
this.companyService.getSupportedCurrencies().subscribe({
  next: ({ defaultCurrency, currencies }) => {
    this.currencies.set(currencies)
    if (!this.editMode()) {
      this.currency.set(defaultCurrency)
    }
  },
  error: () => {}
})
```

- [ ] **Step 4: Update the symbol lookup helper**

Find (around line 340):
```ts
const symbol = this.currencies.find(c => c.value === this.currency())?.symbol ?? this.currency()
```

Replace with:
```ts
const symbol = this.currencies().find(c => c.isoCode === this.currency())?.symbol ?? this.currency()
```

- [ ] **Step 5: Update the template `@for` loop**

In `new-purchase-invoice.component.html`, find:
```html
@for (c of currencies; track c.value) {
  <option [value]="c.value">{{ c.label }}</option>
}
```

Replace with:
```html
@for (c of currencies(); track c.isoCode) {
  <option [value]="c.isoCode">{{ c.isoCode }} – {{ c.currencyName }}</option>
}
```

- [ ] **Step 6: Verify the app compiles**

```bash
cd /home/houssem/projects/compta/comptabilite-frontend && npx tsc --noEmit
```
Expected: only the 2 pre-existing `company.service.spec.ts` errors, no new errors.

- [ ] **Step 7: Commit**

```bash
git add comptabilite-frontend/src/app/features/purchase-invoices/new-purchase-invoice/new-purchase-invoice.component.ts \
        comptabilite-frontend/src/app/features/purchase-invoices/new-purchase-invoice/new-purchase-invoice.component.html
git commit -m "feat(purchase-invoices): load currency dropdown from company settings"
```
