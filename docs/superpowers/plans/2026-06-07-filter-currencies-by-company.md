# Filter Currencies by Company Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static `CURRENCIES` array in the supplier and client create/edit forms with a dynamic list fetched from the company's configured currencies (`GET /api/settings/currencies`).

**Architecture:** Both `NewSupplierComponent` and `NewClientComponent` already have `CompanyService` injected (added in the countries task). Each component calls `getSupportedCurrencies()` in `ngOnInit` alongside the existing `getSupportedCountries()` call. The result populates a `signal<CurrencyItem[]>([])`. In create mode the `defaultCurrency` from the response pre-fills the form field. The template `@for` is updated to iterate the signal and build the display label from `isoCode + ' – ' + currencyName`.

**Tech Stack:** Angular 17 standalone components, signals, `CompanyService` (already injected), `CurrencyItem` interface (already exists in `company-profile.model.ts`).

---

### Task 1: Update `NewSupplierComponent` to load currencies from API

**Files:**
- Modify: `comptabilite-frontend/src/app/features/suppliers/new-supplier/new-supplier.component.ts`
- Modify: `comptabilite-frontend/src/app/features/suppliers/new-supplier/new-supplier.component.html`

**Current state of the relevant lines (after the countries task):**
- Line 8: `import { CURRENCIES, PAYMENT_TERMS } from '../../../shared/models/client.model'`
- Line 9: `import { CompanyService } from '../../settings/company.service'`
- Line 10: `import { CountryItem } from '../../../shared/models/company-profile.model'`
- Line 35: `countries = signal<CountryItem[]>([])`
- Line 37: `readonly currencies = CURRENCIES`
- Around line 96: `this.companyService.getSupportedCountries().subscribe({...})`
- Template line 354: `@for (c of currencies; track c.value) {`
- Template line 355: `<option [value]="c.value">{{ c.label }}</option>`

- [ ] **Step 1: Update imports**

In `new-supplier.component.ts`, make two changes:

1. Remove `CURRENCIES` from the `client.model` import (keep `PAYMENT_TERMS`):
```ts
// before
import { CURRENCIES, PAYMENT_TERMS } from '../../../shared/models/client.model'

// after
import { PAYMENT_TERMS } from '../../../shared/models/client.model'
```

2. Add `CurrencyItem` to the existing `company-profile.model` import:
```ts
// before
import { CountryItem } from '../../../shared/models/company-profile.model'

// after
import { CountryItem, CurrencyItem } from '../../../shared/models/company-profile.model'
```

- [ ] **Step 2: Replace the static `currencies` field**

```ts
// before
readonly currencies        = CURRENCIES

// after
currencies = signal<CurrencyItem[]>([])
```

- [ ] **Step 3: Load supported currencies in `ngOnInit`**

Immediately after the existing `getSupportedCountries()` subscription (around line 96), add:

```ts
this.companyService.getSupportedCurrencies().subscribe({
  next: ({ defaultCurrency, currencies }) => {
    this.currencies.set(currencies)
    if (!this.editMode()) {
      this.form.patchValue({ currency: defaultCurrency }, { emitEvent: false })
    }
  },
  error: () => {}
})
```

- [ ] **Step 4: Update the template `@for` loop**

In `new-supplier.component.html` at line 354, replace:
```html
@for (c of currencies; track c.value) {
  <option [value]="c.value">{{ c.label }}</option>
}
```

With:
```html
@for (c of currencies(); track c.isoCode) {
  <option [value]="c.isoCode">{{ c.isoCode }} – {{ c.currencyName }}</option>
}
```

- [ ] **Step 5: Verify the app compiles**

```bash
cd /home/houssem/projects/compta/comptabilite-frontend && npx tsc --noEmit
```
Expected: only the 2 pre-existing `company.service.spec.ts` errors, no new errors.

- [ ] **Step 6: Commit**

```bash
git add comptabilite-frontend/src/app/features/suppliers/new-supplier/new-supplier.component.ts \
        comptabilite-frontend/src/app/features/suppliers/new-supplier/new-supplier.component.html
git commit -m "feat(suppliers): load currency dropdown from company settings"
```

---

### Task 2: Update `NewClientComponent` to load currencies from API

**Files:**
- Modify: `comptabilite-frontend/src/app/features/clients/new-client/new-client.component.ts`
- Modify: `comptabilite-frontend/src/app/features/clients/new-client/new-client.component.html`

**Current state of the relevant lines (after the countries task):**
- Line 10: `import { CreateClientDto, CURRENCIES, PAYMENT_TERMS, CLIENT_STATUSES } from '../../../shared/models/client.model'`
- Line 12: `import { CompanyService } from '../../settings/company.service'`
- Line 13: `import { CountryItem } from '../../../shared/models/company-profile.model'`
- Line 57: `currencies = CURRENCIES`
- Around line 110: `this.companyService.getSupportedCountries().subscribe({...})`
- Template line 395: `@for (c of currencies; track c.value) {`
- Template line 396: `<option [value]="c.value">{{ c.label }}</option>`

- [ ] **Step 1: Update imports**

In `new-client.component.ts`, make two changes:

1. Remove `CURRENCIES` from the `client.model` import (keep the rest):
```ts
// before
import {
  CreateClientDto, CURRENCIES, PAYMENT_TERMS, CLIENT_STATUSES
} from '../../../shared/models/client.model'

// after
import {
  CreateClientDto, PAYMENT_TERMS, CLIENT_STATUSES
} from '../../../shared/models/client.model'
```

2. Add `CurrencyItem` to the existing `company-profile.model` import:
```ts
// before
import { CountryItem } from '../../../shared/models/company-profile.model'

// after
import { CountryItem, CurrencyItem } from '../../../shared/models/company-profile.model'
```

- [ ] **Step 2: Replace the static `currencies` field**

```ts
// before
currencies          = CURRENCIES

// after
currencies = signal<CurrencyItem[]>([])
```

- [ ] **Step 3: Load supported currencies in `ngOnInit`**

Immediately after the existing `getSupportedCountries()` subscription (around line 110), add:

```ts
this.companyService.getSupportedCurrencies().subscribe({
  next: ({ defaultCurrency, currencies }) => {
    this.currencies.set(currencies)
    if (!this.editMode()) {
      this.form.patchValue({ currency: defaultCurrency }, { emitEvent: false })
    }
  },
  error: () => {}
})
```

- [ ] **Step 4: Update the template `@for` loop**

In `new-client.component.html` at line 395, replace:
```html
@for (c of currencies; track c.value) {
  <option [value]="c.value">{{ c.label }}</option>
}
```

With:
```html
@for (c of currencies(); track c.isoCode) {
  <option [value]="c.isoCode">{{ c.isoCode }} – {{ c.currencyName }}</option>
}
```

- [ ] **Step 5: Verify the app compiles**

```bash
cd /home/houssem/projects/compta/comptabilite-frontend && npx tsc --noEmit
```
Expected: only the 2 pre-existing `company.service.spec.ts` errors, no new errors.

- [ ] **Step 6: Commit**

```bash
git add comptabilite-frontend/src/app/features/clients/new-client/new-client.component.ts \
        comptabilite-frontend/src/app/features/clients/new-client/new-client.component.html
git commit -m "feat(clients): load currency dropdown from company settings"
```
