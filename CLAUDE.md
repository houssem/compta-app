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

**Terminal 1 — Backend** (Spring Boot on :8080):
```bash
cd comptabilite-backend
mvn spring-boot:run
```

**Terminal 2 — Mock API** (json-server on :3000, used as frontend API target):
```bash
cd comptabilite-frontend
npm run mock
```

**Terminal 3 — Frontend** (Angular dev server on :4200, proxies `/api` → :3000):
```bash
cd comptabilite-frontend
npm start
```

Dev login credentials: `admin@facturation.dev / password123`

Swagger UI: http://localhost:8080/swagger-ui.html
H2 console: http://localhost:8080/h2-console (JDBC URL: `jdbc:h2:file:./data/comptadb`)

## Architecture Overview

This is a multi-tenant accounting/invoicing SaaS (French: *comptabilité*). The backend enforces tenant isolation via `company_id` on every entity; the JWT carries `companyId` + `userId` + `role` so all queries can be filtered without extra lookups.

**Backend** (`comptabilite-backend/CLAUDE.md`) — Spring Boot 3.3.0, Java 17, Maven:
- Domain-driven package layout: `auth`, `company`, `user`, `common`, `config`
- JWT: stateless access token (15 min) + revocable DB-backed refresh token (7 days)
- Schema managed by Flyway only — never use `ddl-auto: create/update`; migrations in `src/main/resources/db/migration/V{N}__desc.sql`
- Dev profile: H2 in-memory; prod profile: MySQL/PostgreSQL via `SPRING_DATASOURCE_*` env vars
- `buildAuthResponse()` revokes all existing refresh tokens before issuing new ones — integration tests must use tokens from the **latest** auth call

**Frontend** (`comptabilite-frontend/CLAUDE.md`) — Angular 17, TypeScript strict, no lint script:
- Standalone components only (no NgModules anywhere), lazy-loaded features via `loadComponent`
- State: local signals + `computed()` — no NgRx
- Each entity has three interfaces: `ApiX` (list), `StoredX` (detail), `CreateXPayload` (write)
- UI: PrimeNG 17 + PrimeFlex grid, Lara Dark Blue theme, ECharts for dashboard charts
- i18n: `@ngx-translate`, English/French, defaults to French
- `authGuard` reads JWT `exp` claim from localStorage; expired/missing tokens redirect to `/login`
