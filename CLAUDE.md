# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Prerequisites

- Java 17 (not 21 — system constraint)
- Node.js 18+ / npm 9+
- Maven 3.8+

## Repository Layout

```
compta/
├── comptabilite-backend/    # Spring Boot 3 REST API (Java 17, Maven)
├── comptabilite-frontend/   # Angular 17 SPA (TypeScript, npm)
└── facturation_doc/         # Word documents (design specs)
```

Each sub-project has its own `CLAUDE.md` with full commands, key decisions, and gotchas. Read those when working within a sub-project.

## Running the Full Stack

**Backend** (Spring Boot on :8080):
```bash
cd comptabilite-backend
mvn spring-boot:run
```

**Frontend** (Angular dev server on :4200, proxies `/api` → :8080):
```bash
cd comptabilite-frontend
npm start
```

The frontend `proxy.conf.json` points directly to `:8080` (Spring Boot). The `npm run mock` json-server is a standalone fixture for offline UI work only — it is **not** in the normal dev path.

Dev login: use an account registered via `/register`. H2 is wiped on each fresh start.

Swagger UI: http://localhost:8080/swagger-ui.html
H2 console: http://localhost:8080/h2-console (JDBC URL: `jdbc:h2:file:./data/comptadb`)

## Architecture Overview

Multi-tenant accounting/invoicing SaaS (French: *comptabilité*). Every entity carries `company_id`; the JWT embeds `companyId + userId + role` so all queries filter by tenant without extra lookups. `JwtAuthFilter` populates the `Authentication` with `companyId` as `details` (a `UUID`) — controllers extract it via `auth.getDetails()`.

### Backend package layout (`com.compta`)

| Package | Contents |
|---|---|
| `auth` | Login/register/refresh, JWT filter, refresh-token entity |
| `company` | Company + CompanyBankDetails entities |
| `client` / `supplier` | Client and Supplier entities + CRUD |
| `invoice` | SalesInvoice, SalesInvoiceLine, InvoiceSequence + CRUD |
| `purchaseinvoice` | PurchaseInvoice, PurchaseInvoiceLine + CRUD |
| `common` | BaseEntity, ApiException, GlobalExceptionHandler |
| `config` | SecurityConfig, OpenApiConfig |

Schema is managed **exclusively by Flyway** — migrations in `src/main/resources/db/migration/V{N}__desc.sql`. Never set `ddl-auto: create/update`.

### Frontend feature layout (`src/app/features`)

| Feature | Route |
|---|---|
| `login` / `register` | `/login`, `/register` |
| `dashboard-vente` | `/dashboard-vente` |
| `invoices` | `/invoices`, `/invoice/create`, `/invoice/edit/:id` |
| `purchase-invoices` | `/purchase-invoices`, `/purchase-invoice/create/:id` |
| `clients` / `suppliers` | `/customers`, `/suppliers` + create/edit |

All authenticated routes are children of `MainLayoutComponent` guarded by `authGuard`. Create and edit routes share the same component — mode is detected via `ActivatedRoute` param `:id`.

## Cross-Cutting Gotchas

### Lazy-loading and transactions
Service methods that access `@OneToMany` collections must be annotated `@Transactional(readOnly = true)` — without a transaction the Hibernate session closes before `SalesInvoiceResponse::from` can iterate `invoice.getLines()`, causing `LazyInitializationException` (→ 500).

### H2 reserved keywords in migrations
`YEAR`, `MONTH`, `VALUE` are reserved in H2. Use prefixed column names (e.g. `seq_year`, `seq_month`) and add `NON_KEYWORDS=VALUE` to the JDBC URL when needed (already in `application-dev.yml`).

### Flyway repair after a failed migration
If a migration fails mid-run, the next startup fails with "Detected failed migration". Fix:
```bash
cd comptabilite-backend
mvn flyway:repair \
  -Dflyway.url="jdbc:h2:file:./data/comptadb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE;NON_KEYWORDS=VALUE" \
  -Dflyway.user=sa -Dflyway.password=
```
Then restart the app. The `./data/comptadb` path is **relative to the working directory**, so always run this from inside `comptabilite-backend/`.

### GlobalExceptionHandler swallows stack traces
The catch-all `Exception` handler returns a generic 500 with no logging. To diagnose unknown 500s, temporarily add `log.error("Unexpected error", ex)` to `handleUnexpected()` and recheck the log.

### JWT details cast
`companyId` is stored as `auth.getDetails()` (a `UUID`). Any controller that needs the tenant must cast: `(UUID) auth.getDetails()`. This will `ClassCastException` at runtime if the filter is misconfigured — not at startup.

### `buildAuthResponse()` revokes all refresh tokens
Integration tests that call login more than once must use the token from the **latest** auth response.
