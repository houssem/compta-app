# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Dev server at http://localhost:4200 (proxies /api → localhost:3000)
npm run mock       # json-server mock API on localhost:3000 (run alongside npm start)
npm run build      # Production build → dist/facturation/
npm run watch      # Watch build
npm test           # Karma + Jasmine test suite
npm test -- --include='**/foo.spec.ts'  # Run a single spec file
```

No lint script is configured; TypeScript strict mode enforces type safety.

## Adding a New Feature

1. Create `src/app/features/<name>/<name>.component.ts` with `standalone: true`
2. Add a child route in `app.routes.ts` under `MainLayoutComponent` using `loadComponent`
3. Define `ApiX`, `StoredX`, `CreateXPayload` interfaces in `shared/models/<name>.model.ts`
4. Add mock data to `mock/db.json` and route mapping to `mock/routes.json`

## Architecture

Angular 17 standalone components — no NgModules anywhere. All components use `standalone: true` with explicit `imports[]`.

### Routing

All authenticated routes are children of `MainLayoutComponent` and protected by `authGuard`.

```
/                          → HomeComponent                  (public)
/login                     → LoginComponent                 (public)
/register                  → RegisterComponent              (public)
/dashboard-vente           → DashboardVenteComponent        (auth)
/invoices                  → InvoicesComponent              (auth)
/invoice/create            → NewInvoiceComponent            (auth)
/invoice/edit/:id          → NewInvoiceComponent            (auth, edit mode)
/customers                 → ClientsComponent               (auth)
/client/create             → NewClientComponent             (auth)
/client/edit/:id           → NewClientComponent             (auth, edit mode)
/suppliers                 → SuppliersComponent             (auth)
/supplier/create           → NewSupplierComponent           (auth)
/supplier/edit/:id         → NewSupplierComponent           (auth, edit mode)
/purchase-invoices         → PurchaseInvoicesComponent      (auth)
/purchase-invoice/create   → NewPurchaseInvoiceComponent    (auth)
/purchase-invoice/edit/:id → NewPurchaseInvoiceComponent    (auth, edit mode)
```

`authGuard` decodes the JWT from localStorage and checks the `exp` claim. Expired or missing tokens redirect to `/login`. Create and edit routes share the same component — they detect mode via `ActivatedRoute` param `:id`.

### Core

- `core/auth/auth.service.ts` — JWT login/logout, `currentUser` signal, `isAuthenticated()` checks token expiry via `jwt-decode`
- `core/auth/jwt.interceptor.ts` — Auto-injects `Authorization: Bearer` header on all HTTP requests
- `core/i18n/language.service.ts` — i18n via `@ngx-translate`. Supports `'en' | 'fr'`, defaults to `'fr'`. Persists to localStorage. `currentLang` signal.
- `core/layout/main-layout.component.*` — Sidebar + topbar shell for authenticated pages

### Features

Each feature lives under `features/<name>/` and is lazy-loaded via `loadComponent`.

- **dashboard-vente** — KPI cards + 3 ECharts charts (revenue, status donut, comparison bar)
- **invoices** — Sales invoice list + create/edit form (`NewInvoiceComponent`)
- **clients** — Customer list + create/edit form (`NewClientComponent`)
- **suppliers** — Supplier list + create/edit form (`NewSupplierComponent`)
- **purchase-invoices** — Purchase invoice list + create/edit form (`NewPurchaseInvoiceComponent`)

### State Management

No NgRx. Lightweight pattern:
- **Global auth state** — `AuthService.currentUser` signal, persisted to localStorage
- **Component state** — local signals + `computed()`
- **Server state** — fetched in `ngOnInit`, stored in component signals

### Data Model Pattern

Each entity uses three interfaces:
- **`ApiX`** — minimal shape returned by list endpoints (e.g. `ApiInvoice`, `ApiPurchaseInvoice`)
- **`StoredX`** — full shape returned by `GET /api/x/:id` (includes line items, notes, etc.)
- **`CreateXPayload`** — POST/PUT body sent to create or update

`LineItem` is used by both invoices and purchase-invoices (defined separately in each model file).

### Models

- `shared/models/kpi.model.ts` — `User`, `KpiSummary`, `DashboardSummary`
- `shared/models/invoice.model.ts` — `ApiInvoice`, `StoredInvoice`, `CreateInvoicePayload`, `LineItem`, `InvoiceStatus`
- `shared/models/purchase-invoice.model.ts` — `ApiPurchaseInvoice`, `StoredPurchaseInvoice`, `CreatePurchaseInvoicePayload`, `LineItem`, `PurchaseInvoiceStatus`, `InvoiceAttachment`
- `shared/models/client.model.ts` — `Client`, `CreateClientDto`, `Country`, `Currency`, `PaymentTerm`
- `shared/models/supplier.model.ts` — `Supplier`, `CreateSupplierDto`, `SUPPLIER_CATEGORIES`

### Charts

`ngx-echarts` wraps Apache ECharts. Chart components (`revenue-chart`, `status-donut`, `comparison-bar`) receive `@Input()` data from the parent dashboard and own their ECharts `EChartsOption` config.

### UI Stack

PrimeNG 17 components + PrimeFlex grid + PrimeIcons. Theme: Lara Dark Blue (configured in `angular.json` styles array). Custom design tokens in `src/styles.scss` (navy primary, status colors for paid/pending/overdue/sent/draft, Inter font).

### Mock Backend

`npm run mock` starts `json-server` on port 3000 using `mock/db.json` as the database. `mock/routes.json` strips the `/api/` prefix (`/api/*` → `/$1`). `mock/middleware.js` auto-generates `id`, `reference`, and `createdAt` on POST to `/clients`.

API endpoints:
- `POST /api/auth/login` → JWT
- `GET /api/dashboard/summary` → `DashboardSummary`
- `GET|POST /api/invoices`, `GET|PUT|DELETE /api/invoices/:id`
- `GET|POST /api/purchase-invoices`, `GET|PUT|DELETE /api/purchase-invoices/:id`
- `GET|POST /api/clients`, `GET|PUT|DELETE /api/clients/:id`
- `GET|POST /api/suppliers`, `GET|PUT|DELETE /api/suppliers/:id`
- `GET /api/languages`
