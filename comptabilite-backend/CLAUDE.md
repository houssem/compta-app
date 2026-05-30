# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Build
mvn clean package -DskipTests

# Run (dev profile, H2 in-memory)
mvn spring-boot:run

# Run all tests
mvn test

# Run a single test class
mvn test -Dtest=AuthServiceTest

# Run a single test method
mvn test -Dtest=AuthServiceTest#shouldLoginSuccessfully

# Run only integration tests
mvn test -Dtest=AuthControllerIntegrationTest

# Swagger UI (while running)
open http://localhost:8080/swagger-ui.html

# H2 console (dev only)
open http://localhost:8080/h2-console  # JDBC URL: jdbc:h2:file:./data/comptadb
```

## Architecture

**Monolith modulaire** — packages organized by domain feature, not technical layer.

```
com.compta/
├── auth/          # controller, service, dto, jwt, entity, repository
├── company/       # entity (Company, CompanyBankDetails), repository
├── user/          # entity (User, Role enum), repository
├── common/        # BaseEntity, ApiException, GlobalExceptionHandler
└── config/        # SecurityConfig, OpenApiConfig
```

**Multi-tenant strategy:** every entity carries `company_id`. JWT embeds `companyId` + `userId` + `role`. `JwtAuthFilter` populates `SecurityContext` with these three values on every authenticated request. Future modules must filter all queries by `companyId` extracted from the security context.

**JWT flow:**
- Access token: 15 min, stateless
- Refresh token: 7 days, stored in `refresh_tokens` table, revocable
- `buildAuthResponse()` revokes all existing refresh tokens for the user before issuing a new one — this means integration tests must capture tokens from the **latest** auth call, not an earlier one

**Security rules:**
- `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh` — public
- `/api/auth/logout` — requires Bearer token (intentionally excluded from permit-all)
- All other endpoints require authentication

**Database profiles:**
- `dev` (default): H2 in-memory, SQL logging enabled, Flyway manages schema
- `prod`: datasource via `SPRING_DATASOURCE_URL/USERNAME/PASSWORD` env vars

Schema is managed exclusively by Flyway — never use `ddl-auto: create` or `update`. New migrations go in `src/main/resources/db/migration/` as `V{N}__description.sql`.

## Key Decisions & Gotchas

- **Java 17** (not 21 — system constraint). Records are available (Java 16+).
- **Lombok boolean naming**: use `boolean defaultAccount` not `boolean isDefault` — Lombok strips "is" prefix and breaks JavaBeans convention.
- **UUID PKs**: stored as `VARCHAR(36)` in SQL (cross-DB: H2, MySQL, PostgreSQL). Java side uses `@UuidGenerator` from Hibernate 6.
- **`@Modifying` queries** in repositories need `@Transactional` on the method.
- **`JwtAuthFilter`**: single `extractAllClaims()` parse per request; on invalid token returns 401 directly via `response.sendError()`.
- **Integration tests**: use `httpclient5` dependency + `HttpComponentsClientHttpRequestFactory` so `TestRestTemplate` can read 401 response bodies.
- **Logo upload**: MIME type validated (png/jpeg/webp/gif only), filename sanitized, path traversal checked.
- **Attachment storage**: `AttachmentDto` is serialized to JSON via `ObjectMapper` and stored as a single `TEXT` column (`attachment_data` on `purchase_invoices`). The `data` field contains the full base64 data URL. Planned migration to filesystem for production (single server).
- **`supplierInvoiceRef` is not unique**: uniqueness check was intentionally removed — multiple invoices can share the same supplier ref.
