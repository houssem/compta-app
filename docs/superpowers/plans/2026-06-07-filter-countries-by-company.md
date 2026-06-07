# Filter Countries by Company Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static `COUNTRIES` array in the supplier and client create/edit forms with a dynamic list fetched from the company's configured countries (`GET /api/settings/countries`).

**Architecture:** Both `NewSupplierComponent` and `NewClientComponent` inject `CompanyService` and call `getSupportedCountries()` in `ngOnInit`. The result populates a signal that the template iterates. The `COUNTRY_CURRENCY_MAP` lookup is replaced by a direct lookup on the loaded `CountryItem[]` since it already carries the `currency` field.

**Tech Stack:** Angular 17 standalone components, signals, `CompanyService` (already exists), `CountryItem` interface (already exists in `company-profile.model.ts`).

---

### Task 1: Update `NewSupplierComponent` to load countries from API

**Files:**
- Modify: `comptabilite-frontend/src/app/features/suppliers/new-supplier/new-supplier.component.ts`

The current component has:
```ts
readonly countries = COUNTRIES   // static array
```
and uses `COUNTRY_CURRENCY_MAP[country]` in the `valueChanges` subscription.

- [ ] **Step 1: Inject `CompanyService` and replace the static countries field**

Replace the import line and field in `new-supplier.component.ts`:

Remove from imports:
```ts
import { COUNTRIES, CURRENCIES, PAYMENT_TERMS, COUNTRY_CURRENCY_MAP } from '../../../shared/models/client.model'
```

Replace with:
```ts
import { CURRENCIES, PAYMENT_TERMS } from '../../../shared/models/client.model'
import { CompanyService } from '../../settings/company.service'
import { CountryItem } from '../../../shared/models/company-profile.model'
```

Replace the field declaration:
```ts
// before
readonly countries = COUNTRIES

// after
countries = signal<CountryItem[]>([])
```

- [ ] **Step 2: Add `CompanyService` to the constructor**

```ts
constructor(
  private fb: FormBuilder,
  private router: Router,
  private route: ActivatedRoute,
  private supplierService: SupplierService,
  private companyService: CompanyService
) {}
```

- [ ] **Step 3: Load supported countries in `ngOnInit`**

At the top of `ngOnInit()`, after `this.form = this.fb.nonNullable.group({...})` and before the `valueChanges` subscription, add:

```ts
this.companyService.getSupportedCountries().subscribe({
  next: ({ countries }) => this.countries.set(countries),
  error: () => {}   // keep empty list on failure — user can still type
})
```

- [ ] **Step 4: Replace `COUNTRY_CURRENCY_MAP` lookup in the `valueChanges` subscription**

Find this line inside the `country` `valueChanges` subscription:
```ts
const suggestedCurrency = COUNTRY_CURRENCY_MAP[country] ?? 'TND'
```

Replace with:
```ts
const suggestedCurrency = this.countries().find(c => c.countryName === country)?.currency ?? 'TND'
```

- [ ] **Step 5: Update the template `@for` loop**

In `new-supplier.component.html` at line 279, the loop currently is:
```html
@for (c of countries; track c.value) {
  <option [value]="c.value">{{ c.label }}</option>
}
```

Replace with:
```html
@for (c of countries(); track c.isoCode) {
  <option [value]="c.countryName">{{ c.countryName }}</option>
}
```

- [ ] **Step 6: Verify the app compiles**

```bash
cd comptabilite-frontend && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add comptabilite-frontend/src/app/features/suppliers/new-supplier/new-supplier.component.ts \
        comptabilite-frontend/src/app/features/suppliers/new-supplier/new-supplier.component.html
git commit -m "feat(suppliers): load country dropdown from company settings"
```

---

### Task 2: Update `NewClientComponent` to load countries from API

**Files:**
- Modify: `comptabilite-frontend/src/app/features/clients/new-client/new-client.component.ts`
- Modify: `comptabilite-frontend/src/app/features/clients/new-client/new-client.component.html`

- [ ] **Step 1: Update imports in `new-client.component.ts`**

Remove from imports:
```ts
import {
  CreateClientDto, COUNTRIES, CURRENCIES, PAYMENT_TERMS,
  COUNTRY_CURRENCY_MAP, CLIENT_STATUSES
} from '../../../shared/models/client.model'
```

Replace with:
```ts
import {
  CreateClientDto, CURRENCIES, PAYMENT_TERMS, CLIENT_STATUSES
} from '../../../shared/models/client.model'
import { CompanyService } from '../../settings/company.service'
import { CountryItem } from '../../../shared/models/company-profile.model'
```

- [ ] **Step 2: Replace the static `countries` field**

```ts
// before
countries = COUNTRIES

// after
countries = signal<CountryItem[]>([])
```

- [ ] **Step 3: Add `CompanyService` to the constructor**

```ts
constructor(
  private fb: FormBuilder,
  private router: Router,
  private route: ActivatedRoute,
  private clientService: ClientService,
  private companyService: CompanyService
) {}
```

- [ ] **Step 4: Load supported countries in `ngOnInit`**

At the top of `ngOnInit()`, after `this.form = this.fb.nonNullable.group({...})` and before the `valueChanges` subscription, add:

```ts
this.companyService.getSupportedCountries().subscribe({
  next: ({ countries }) => this.countries.set(countries),
  error: () => {}
})
```

- [ ] **Step 5: Replace `COUNTRY_CURRENCY_MAP` lookup in the `valueChanges` subscription**

Find:
```ts
const suggestedCurrency = COUNTRY_CURRENCY_MAP[country] ?? 'TND'
```

Replace with:
```ts
const suggestedCurrency = this.countries().find(c => c.countryName === country)?.currency ?? 'TND'
```

- [ ] **Step 6: Update the template `@for` loop**

In `new-client.component.html` at line 300, replace:
```html
@for (c of countries; track c.value) {
  <option [value]="c.value">{{ c.label }}</option>
}
```

With:
```html
@for (c of countries(); track c.isoCode) {
  <option [value]="c.countryName">{{ c.countryName }}</option>
}
```

- [ ] **Step 7: Verify the app compiles**

```bash
cd comptabilite-frontend && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add comptabilite-frontend/src/app/features/clients/new-client/new-client.component.ts \
        comptabilite-frontend/src/app/features/clients/new-client/new-client.component.html
git commit -m "feat(clients): load country dropdown from company settings"
```

---

### Task 3: Manual smoke test

- [ ] **Step 1: Start the backend and frontend**

```bash
# terminal 1
cd comptabilite-backend && mvn spring-boot:run

# terminal 2
cd comptabilite-frontend && npm start
```

- [ ] **Step 2: Configure company countries in settings**

Navigate to `http://localhost:4200/settings` → Countries tab. Enable a subset (e.g. TN + FR only). Save.

- [ ] **Step 3: Verify supplier form**

Navigate to `http://localhost:4200/supplier/create`. Open the Country dropdown. Confirm only TN and FR appear.

- [ ] **Step 4: Verify client form**

Navigate to `http://localhost:4200/client/create`. Open the Country dropdown. Confirm only TN and FR appear.

- [ ] **Step 5: Verify currency auto-fill still works**

In the supplier form, select France. Confirm the Currency field auto-fills to EUR.
