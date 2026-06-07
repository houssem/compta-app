# Dynamic Countries in Register + Currencies in Bank Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded countries in the register form and hardcoded currencies in the bank detail modal with dynamic lists from the API.

**Architecture:** The register page is public (unauthenticated), so `GET /api/settings/countries/master` must be added to `permitAll()` in `SecurityConfig.java`. The register component then loads this endpoint via `CompanyService.getMasterCountries()`. The bank detail modal already has `CompanyService` injected — it just needs `getSupportedCurrencies()` called in `ngOnInit`.

**Tech Stack:** Spring Boot 3 (SecurityConfig), Angular 17 standalone components, signals, `CompanyService`.

---

### Task 1: Make master countries endpoint public + load in register form

**Files:**
- Modify: `comptabilite-backend/src/main/java/com/compta/config/SecurityConfig.java`
- Modify: `comptabilite-frontend/src/app/features/register/register.component.ts`
- Modify: `comptabilite-frontend/src/app/features/register/register.component.html`

**Current state:**

`SecurityConfig.java` — the `permitAll()` block currently allows:
```java
.requestMatchers(
    "/api/auth/register",
    "/api/auth/login",
    "/api/auth/refresh",
    "/h2-console/**",
    "/swagger-ui/**",
    "/swagger-ui.html",
    "/v3/api-docs/**"
).permitAll()
```

`register.component.ts` — relevant lines:
- Line 51–55: `readonly countries = ['Tunisie', 'Algérie', ...]` — static string array
- `country = signal('Tunisie')` — plain signal used as form value

`register.component.html` — line 151: `@for (c of countries; track c)` with `[value]="c"` and `{{ c }}`

Key types:
```ts
// comptabilite-frontend/src/app/shared/models/company-profile.model.ts
interface CountryItem {
  isoCode: string
  countryName: string
  currency: string
}
```

`CompanyService.getMasterCountries()` at `comptabilite-frontend/src/app/features/settings/company.service.ts` calls `GET /api/settings/countries/master` and returns `Observable<CountryItem[]>`.

- [ ] **Step 1: Add `/api/settings/countries/master` to `permitAll()` in `SecurityConfig.java`**

```java
.requestMatchers(
    "/api/auth/register",
    "/api/auth/login",
    "/api/auth/refresh",
    "/api/settings/countries/master",
    "/h2-console/**",
    "/swagger-ui/**",
    "/swagger-ui.html",
    "/v3/api-docs/**"
).permitAll()
```

- [ ] **Step 2: Update imports in `register.component.ts`**

Add imports:
```ts
import { CountryItem } from '../../shared/models/company-profile.model'
import { CompanyService } from '../settings/company.service'
```

- [ ] **Step 3: Inject `CompanyService` and replace the static `countries` field**

Add inject field after the existing ones:
```ts
private http   = inject(HttpClient)
private router = inject(Router)
private auth   = inject(AuthService)
private companySvc = inject(CompanyService)
```

Replace the static field:
```ts
// before
readonly countries = [
  'Tunisie', 'Algérie', 'Maroc', 'Libye', 'France', 'Allemagne',
  'Italie', 'Espagne', 'Royaume-Uni', 'États-Unis', 'Émirats arabes',
  'Arabie Saoudite', 'Autre'
]

// after
countries = signal<CountryItem[]>([])
```

- [ ] **Step 4: Load master countries on component init**

The `RegisterComponent` currently does not implement `OnInit`. Add it:

```ts
// before
export class RegisterComponent {
// after
export class RegisterComponent implements OnInit {
```

Add `OnInit` to the Angular import:
```ts
// before
import { Component, signal, computed, inject } from '@angular/core'
// after
import { Component, signal, computed, inject, OnInit } from '@angular/core'
```

Add `ngOnInit()` method (place it before the `step1Valid` computed):
```ts
ngOnInit(): void {
  this.companySvc.getMasterCountries().subscribe({
    next: (list) => this.countries.set(list),
    error: () => {}
  })
}
```

- [ ] **Step 5: Update the template `@for` loop**

In `register.component.html`, find:
```html
@for (c of countries; track c) {
  <option [value]="c">{{ c }}</option>
}
```

Replace with:
```html
@for (c of countries(); track c.isoCode) {
  <option [value]="c.countryName">{{ c.countryName }}</option>
}
```

Note: `[value]="c.countryName"` keeps the same string format ('Tunisie', 'France', etc.) that the register API expects.

- [ ] **Step 6: Verify the frontend compiles**

```bash
cd /home/houssem/projects/compta/comptabilite-frontend && npx tsc --noEmit
```
Expected: only the 2 pre-existing `company.service.spec.ts` errors.

- [ ] **Step 7: Verify the backend compiles**

```bash
cd /home/houssem/projects/compta/comptabilite-backend && mvn compile -q
```
Expected: BUILD SUCCESS.

- [ ] **Step 8: Commit**

```bash
git add comptabilite-backend/src/main/java/com/compta/config/SecurityConfig.java \
        comptabilite-frontend/src/app/features/register/register.component.ts \
        comptabilite-frontend/src/app/features/register/register.component.html
git commit -m "feat(register): load countries from master list API"
```

---

### Task 2: Load currencies dynamically in bank detail modal

**Files:**
- Modify: `comptabilite-frontend/src/app/features/settings/bank-details/bank-detail-form-modal/bank-detail-form-modal.component.ts`
- Modify: `comptabilite-frontend/src/app/features/settings/bank-details/bank-detail-form-modal/bank-detail-form-modal.component.html`

**Current state:**

`bank-detail-form-modal.component.ts` — relevant lines:
- Line 7: `const CURRENCIES = ['TND', 'USD', 'EUR', 'GBP', 'CHF', 'CAD', 'AED', 'SAR', 'MAD', 'DZD', 'EGP']`
- Line 5: `import { BankDetailItem } from '../../../../shared/models/company-profile.model'`
- Line 31: `private companyService = inject(CompanyService)` — already injected
- Line 36: `readonly currencies = CURRENCIES`
- Line 45: `currency: ['TND', Validators.required]` — form default

`bank-detail-form-modal.component.html` — line 82:
```html
@for (c of currencies; track c) {
  <option [value]="c">{{ c }}</option>
}
```

Key types:
```ts
interface CurrencyItem {
  isoCode: string
  currencyName: string
  symbol?: string
}
interface SupportedCurrenciesResponse {
  defaultCurrency: string
  currencies: CurrencyItem[]
}
```

`CompanyService.getSupportedCurrencies()` returns `Observable<SupportedCurrenciesResponse>`.

- [ ] **Step 1: Update imports in `bank-detail-form-modal.component.ts`**

Add `CurrencyItem` to the existing `company-profile.model` import:
```ts
// before
import { BankDetailItem } from '../../../../shared/models/company-profile.model'

// after
import { BankDetailItem, CurrencyItem } from '../../../../shared/models/company-profile.model'
```

- [ ] **Step 2: Remove the hardcoded constant and replace the field**

Remove line 7 entirely:
```ts
// delete this line:
const CURRENCIES = ['TND', 'USD', 'EUR', 'GBP', 'CHF', 'CAD', 'AED', 'SAR', 'MAD', 'DZD', 'EGP']
```

Replace the field (line 36):
```ts
// before
readonly currencies = CURRENCIES

// after
currencies = signal<CurrencyItem[]>([])
```

- [ ] **Step 3: Load supported currencies in `ngOnInit`**

The existing `ngOnInit` only handles edit-mode pre-fill. Add the currencies call at the top:

```ts
ngOnInit(): void {
  this.companyService.getSupportedCurrencies().subscribe({
    next: ({ defaultCurrency, currencies }) => {
      this.currencies.set(currencies)
      if (this.mode === 'create') {
        this.form.patchValue({ currency: defaultCurrency }, { emitEvent: false })
      }
    },
    error: () => {}
  })

  if (this.mode === 'edit' && this.item) {
    this.form.patchValue({
      accountHolder:  this.item.accountHolder ?? '',
      bankName:       this.item.bankName      ?? '',
      branch:         this.item.branch        ?? '',
      accountNumber:  this.item.accountNumber ?? '',
      iban:           this.item.iban          ?? '',
      swiftBic:       this.item.swiftBic      ?? '',
      currency:       this.item.currency,
      defaultAccount: this.item.defaultAccount
    })
  }
}
```

- [ ] **Step 4: Update the template `@for` loop**

In `bank-detail-form-modal.component.html`, find:
```html
@for (c of currencies; track c) {
  <option [value]="c">{{ c }}</option>
}
```

Replace with:
```html
@for (c of currencies(); track c.isoCode) {
  <option [value]="c.isoCode">{{ c.isoCode }} – {{ c.currencyName }}</option>
}
```

- [ ] **Step 5: Verify the frontend compiles**

```bash
cd /home/houssem/projects/compta/comptabilite-frontend && npx tsc --noEmit
```
Expected: only the 2 pre-existing `company.service.spec.ts` errors.

- [ ] **Step 6: Commit**

```bash
git add comptabilite-frontend/src/app/features/settings/bank-details/bank-detail-form-modal/bank-detail-form-modal.component.ts \
        comptabilite-frontend/src/app/features/settings/bank-details/bank-detail-form-modal/bank-detail-form-modal.component.html
git commit -m "feat(bank-details): load currency dropdown from company settings"
```
