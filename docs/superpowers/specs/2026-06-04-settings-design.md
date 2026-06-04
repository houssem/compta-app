# Settings Page Design

**Date:** 2026-06-04
**Status:** Approved
**Scope:** Profil Entreprise + Gestion de l'équipe — **Frontend only** (backend endpoints to be implemented separately)

---

## Overview

A new `/settings` route added to the existing Angular app under `MainLayoutComponent`. Uses a sidebar-nav layout (Option B) with child routes, matching the app's dark sidebar aesthetic. Two sections in scope: **Profil Entreprise** and **Gestion de l'équipe**.

---

## Architecture

### Routing

```
/settings                     → redirect to /settings/profile
/settings/profile             → CompanyProfileComponent
/settings/team                → TeamManagementComponent
```

Both are children of a new `SettingsComponent` shell (sidebar + `<router-outlet>`). Lazy-loaded as a feature module.

### Frontend structure

```
src/app/features/settings/
├── settings.component.ts          # Shell: sidebar nav + router-outlet
├── settings.routes.ts             # Child routes
├── company-profile/
│   └── company-profile.component.ts
└── team-management/
    ├── team-management.component.ts
    └── user-form-modal.component.ts  # Shared create/edit modal
```

New services (in `src/app/core/services/`):
- `CompanyService` — GET/PUT company profile + logo
- `UserAdminService` — GET list, POST, PUT, DELETE team members

New models (in `src/app/shared/models/`):
- `company-profile.model.ts` — `CompanyProfile`, `UpdateCompanyRequest`
- `team-member.model.ts` — `TeamMember`, `CreateUserRequest`, `UpdateUserRequest`

### Backend structure

Two new controller/service pairs, no new DB migrations needed (tables already exist via V1).

```
com.compta.company/
├── controller/CompanyController.java
├── service/CompanyService.java
└── dto/
    ├── CompanyResponse.java
    └── CompanyUpdateRequest.java

com.compta.user/
├── controller/UserController.java
├── service/UserService.java
└── dto/
    ├── UserResponse.java
    ├── UserCreateRequest.java
    └── UserUpdateRequest.java
```

---

## Section 1: Profil Entreprise (`/settings/profile`)

### Layout
Scrollable page with four cards stacked vertically, single "Enregistrer les modifications" button at the bottom.

### Cards
| Card | Fields |
|---|---|
| Logo | File upload (PNG/JPEG/WebP, max 2 MB). Shows current logo thumbnail. |
| Informations générales | `name`*, `vatNumber` (N° TVA / Matricule fiscal) |
| Adresse | `streetNumber`, `streetName`, `complement`, `district`, `city`*, `postalCode`, `country` |

`*` = required

### Backend endpoints
```
GET  /api/companies/me          → CompanyResponse (name, vatNumber, address, logoPath)
PUT  /api/companies/me          → multipart/form-data
     - part "data": CompanyUpdateRequest (JSON)
     - part "logo": MultipartFile (optional)
```

`CompanyController` extracts `companyId` from `auth.getDetails()` (existing pattern). `CompanyService` updates the `Company` entity (name, vatNumber, address fields, logo). Logo handling reuses the existing `saveLogo()` logic from `AuthService`. Bank details are out of scope for this section.

### Frontend behaviour
- On load: calls `GET /api/companies/me`, pre-fills the form.
- Logo change: file input triggers immediate preview (no upload until save).
- Save: `PUT /api/companies/me` with `multipart/form-data`. Shows success toast on 200.
- Cancel: resets form to last loaded state.

---

## Section 2: Gestion de l'équipe (`/settings/team`)

### Layout
Page title + "Nouvel utilisateur" button (top-right). Search input. Table card.

### Table columns
| Column | Notes |
|---|---|
| Membre | Avatar (initials, color-coded) + full name + email |
| Rôle | Badge: Admin (blue) / Utilisateur (green) / Lecteur (amber) |
| Statut | Dot + label: Actif / Inactif |
| Membre depuis | `createdAt` formatted as "MMM YYYY" |
| Actions | Edit icon + Delete icon |

### User form modal (create + edit)
Fields: `firstName`*, `lastName`*, `email`*, `password`* (create only), `role`* (select: ADMIN/USER/VIEWER), `active` toggle (edit only).

### Backend endpoints
```
GET    /api/users                → List<UserResponse>   (filtered by companyId from JWT)
POST   /api/users                → UserResponse         (creates user in same company)
PUT    /api/users/{id}           → UserResponse         (updates name/email/role/active)
DELETE /api/users/{id}           → 204                  (hard delete; cannot delete self)
```

`UserController` extracts `companyId` from JWT. All queries filter by `company_id` — no cross-tenant access possible. `POST` hashes the password via `BCryptPasswordEncoder`.

### Guards
- Cannot delete own account (backend returns 400, frontend hides delete button for current user).
- Only ADMIN role can access `/settings` (frontend guard + backend 403).

### Frontend behaviour
- "Nouvel utilisateur" → opens `UserFormModalComponent` in create mode.
- Edit icon → opens modal in edit mode (pre-filled, no password field).
- Delete icon → inline confirm (replaces row with "Confirmer / Annuler" before calling DELETE).
- Search: client-side filter on name + email.

---

## Data Flow

```
Frontend                          Backend
--------                          -------
CompanyService
  GET /api/companies/me    ──►   CompanyController.getMyCompany()
                                   └─ CompanyService.getByCompanyId(companyId)
                                        └─ Company + CompanyBankDetails

  PUT /api/companies/me    ──►   CompanyController.updateMyCompany()
                                   └─ CompanyService.update(companyId, req, logo)

UserAdminService
  GET /api/users           ──►   UserController.listUsers()
                                   └─ UserService.findAllByCompany(companyId)

  POST /api/users          ──►   UserController.createUser()
                                   └─ UserService.create(companyId, req)

  PUT /api/users/{id}      ──►   UserController.updateUser()
                                   └─ UserService.update(id, companyId, req)

  DELETE /api/users/{id}   ──►   UserController.deleteUser()
                                   └─ UserService.delete(id, companyId)
```

---

## Error Handling

| Scenario | Backend | Frontend |
|---|---|---|
| Email already taken (create user) | 409 Conflict | Toast "Cet email est déjà utilisé" |
| Delete own account | 400 Bad Request | Button hidden for current user |
| Logo too large / wrong type | 400 Bad Request | Validated client-side before upload |
| Unauthorized (non-admin) | 403 Forbidden | `authGuard` redirects to `/dashboard-vente` |
| Company not found | 404 (shouldn't happen) | Toast "Erreur inattendue" |

---

## Out of Scope

- Password change for current user (future)
- Email change (requires re-verification, future)
- Bank details (out of scope, planned for a future Facturation settings section)
- Multi-bank accounts
- Role-based field restrictions within the form
