# Design Spec — Backend Spring Boot : Authentification v1

**Date:** 2026-05-24
**Statut:** Approuvé

---

## Stack technique

| Composant | Choix |
|---|---|
| Framework | Spring Boot 3.x |
| Sécurité | Spring Security + JWT (jjwt) |
| ORM | Spring Data JPA + Hibernate |
| BDD dev | H2 in-memory |
| BDD prod | MySQL ou PostgreSQL (profil Spring) |
| Migration BDD | Flyway |
| Docs API | SpringDoc OpenAPI (Swagger UI) |
| Tests | JUnit 5 + Mockito |

---

## Architecture globale (monolithe modulaire)

Structure prévue pour l'ensemble de l'application — seul le module `auth` est implémenté en v1 :

```
comptabilite-backend/
└── src/main/java/com/compta/
    ├── config/
    │   ├── SecurityConfig.java
    │   └── JwtConfig.java
    ├── common/
    │   ├── BaseEntity.java
    │   └── exception/GlobalExceptionHandler.java
    ├── auth/
    │   ├── controller/AuthController.java
    │   ├── service/AuthService.java
    │   ├── dto/
    │   │   ├── RegisterRequest.java
    │   │   ├── LoginRequest.java
    │   │   └── AuthResponse.java
    │   └── entity/RefreshToken.java
    ├── company/
    │   ├── entity/Company.java
    │   └── entity/CompanyBankDetails.java
    └── user/
        ├── entity/User.java
        └── repository/UserRepository.java
```

**Profils Spring :**

| Profil | BDD | Activation |
|---|---|---|
| `dev` (défaut) | H2 in-memory | `spring.profiles.active=dev` |
| `prod` | MySQL ou PostgreSQL | variables d'environnement |

---

## Multi-tenant

- Stratégie : `company_id` sur chaque entité (toutes les tables partagées).
- `BaseEntity` abstraite portant `id`, `companyId`, `createdAt`, `updatedAt`.
- `TenantContext` (ThreadLocal) alimenté par le filtre JWT — injecte automatiquement `companyId` sur toutes les requêtes.
- Double vérification sur les entités individuelles : `WHERE id = ? AND company_id = ?` → 404 si non trouvé.

---

## Authentification JWT

### Flux Registration

```
POST /api/auth/register  (multipart/form-data)
    │
    ├── Crée Company (+ CompanyBankDetails)
    ├── Crée User (role = ADMIN, password hashé BCrypt)
    ├── Génère accessToken (15 min) + refreshToken (7 jours)
    └── Retourne AuthResponse { accessToken, refreshToken, user }
```

### Flux Login

```
POST /api/auth/login
    │
    ├── Vérifie email + BCrypt.matches(password, hash)
    ├── Génère accessToken (15 min) + refreshToken (7 jours, stocké en base)
    └── Retourne AuthResponse { accessToken, refreshToken, user }
```

### Flux Refresh

```
POST /api/auth/refresh
    Body: { refreshToken }
    │
    ├── Vérifie token en base (non révoqué, non expiré)
    ├── Génère nouveau accessToken
    └── Retourne { accessToken }
```

### Flux Logout

```
POST /api/auth/logout
    Header: Authorization: Bearer <accessToken>
    │
    └── Révoque le refreshToken en base (revoked = true)
```

### Contenu du JWT (claims)

```json
{
  "sub": "user-uuid",
  "companyId": "company-uuid",
  "role": "ADMIN",
  "exp": 1234567890
}
```

### Contrôle des rôles

| Rôle | Permissions |
|---|---|
| ADMIN | CRUD complet + paramètres société + gestion utilisateurs |
| USER | Créer / lire / modifier (pas de suppression ni paramètres) |
| VIEWER | Lecture seule |

---

## Endpoints v1

| Méthode | Endpoint | Auth |
|---|---|---|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/refresh` | Public (refreshToken) |
| POST | `/api/auth/logout` | Authentifié |

---

## Schéma BDD (Flyway : V1__create_auth_tables.sql)

```sql
-- Société (tenant)
CREATE TABLE companies (
    id               UUID PRIMARY KEY,
    -- Identité légale
    name             VARCHAR(255) NOT NULL,
    siret            VARCHAR(14),
    vat_number       VARCHAR(50),
    sector           VARCHAR(100),
    -- Adresse
    street_number    VARCHAR(20),
    street_name      VARCHAR(255),
    complement       VARCHAR(255),
    district         VARCHAR(100),
    city             VARCHAR(100),
    postal_code      VARCHAR(20),
    country          VARCHAR(100) DEFAULT 'France',
    -- Contact
    email            VARCHAR(255) UNIQUE NOT NULL,
    phone            VARCHAR(50),
    -- Logo
    logo_path        VARCHAR(500),
    -- Timestamps
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Coordonnées bancaires
CREATE TABLE company_bank_details (
    id               UUID PRIMARY KEY,
    company_id       UUID NOT NULL REFERENCES companies(id),
    account_holder   VARCHAR(255) NOT NULL,
    bank_name        VARCHAR(255) NOT NULL,
    iban             VARCHAR(34) NOT NULL,
    swift_bic        VARCHAR(11),
    is_default       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Utilisateurs
CREATE TABLE users (
    id            UUID PRIMARY KEY,
    company_id    UUID NOT NULL REFERENCES companies(id),
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name    VARCHAR(100) NOT NULL,
    last_name     VARCHAR(100) NOT NULL,
    role          VARCHAR(20) NOT NULL DEFAULT 'ADMIN',
    active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Refresh tokens
CREATE TABLE refresh_tokens (
    id         UUID PRIMARY KEY,
    user_id    UUID NOT NULL REFERENCES users(id),
    token      VARCHAR(512) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_users_company   ON users(company_id);
CREATE INDEX idx_users_email     ON users(email);
CREATE INDEX idx_refresh_token   ON refresh_tokens(token);
CREATE INDEX idx_refresh_user    ON refresh_tokens(user_id);
CREATE INDEX idx_bank_company    ON company_bank_details(company_id);
```

---

## DTO Registration (multipart/form-data)

```
firstName       String  obligatoire
lastName        String  obligatoire
email           String  obligatoire
password        String  obligatoire (min 8 chars)
companyName     String  obligatoire (raison sociale)
siret           String  optionnel
vatNumber       String  optionnel
sector          String  optionnel
streetNumber    String  optionnel
streetName      String  optionnel
complement      String  optionnel
district        String  optionnel
city            String  optionnel
postalCode      String  optionnel
country         String  optionnel (défaut: France)
phone           String  optionnel
logo            File    optionnel (image)
accountHolder   String  optionnel
bankName        String  optionnel
iban            String  optionnel
swiftBic        String  optionnel
```

---

## Hors périmètre v1

- Envoi d'emails (confirmation inscription, relances)
- Gestion des modules comptables (clients, factures, comptabilité, trésorerie, paie, TVA)
- Gestion multi-utilisateurs par société (invitation)
- Tests e2e
