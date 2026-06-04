# Settings Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/settings` page with two sections — Profil Entreprise (logo, company name, VAT number, address) and Gestion de l'équipe (list/create/edit/delete team members) — wired to backend API endpoints defined in the spec.

**Architecture:** Angular 17 standalone components with child routes under `/settings`. A `SettingsComponent` shell renders the sidebar nav + `<router-outlet>`. `CompanyProfileComponent` and `TeamManagementComponent` are lazy-loaded child routes. A `UserFormModalComponent` is embedded inside `TeamManagementComponent` for create/edit.

**Tech Stack:** Angular 17, TypeScript, RxJS, Reactive Forms (`FormBuilder`), Angular Signals, `@ngx-translate/core`, CSS custom properties + BEM

---

## File Map

**Create:**
```
src/app/shared/models/company-profile.model.ts
src/app/shared/models/team-member.model.ts
src/app/features/settings/company.service.ts
src/app/features/settings/company.service.spec.ts
src/app/features/settings/user-admin.service.ts
src/app/features/settings/user-admin.service.spec.ts
src/app/features/settings/settings.component.ts
src/app/features/settings/settings.component.html
src/app/features/settings/settings.component.scss
src/app/features/settings/settings.routes.ts
src/app/features/settings/company-profile/company-profile.component.ts
src/app/features/settings/company-profile/company-profile.component.html
src/app/features/settings/company-profile/company-profile.component.scss
src/app/features/settings/team-management/team-management.component.ts
src/app/features/settings/team-management/team-management.component.html
src/app/features/settings/team-management/team-management.component.scss
src/app/features/settings/team-management/user-form-modal/user-form-modal.component.ts
src/app/features/settings/team-management/user-form-modal/user-form-modal.component.html
src/app/features/settings/team-management/user-form-modal/user-form-modal.component.scss
```

**Modify:**
```
src/app/app.routes.ts                               (add /settings child route)
src/app/core/layout/header.component.html           (wire settings button routerLink)
src/assets/i18n/fr.json                             (add SETTINGS namespace)
src/assets/i18n/en.json                             (add SETTINGS namespace)
```

---

## Task 1: Models

**Files:**
- Create: `src/app/shared/models/company-profile.model.ts`
- Create: `src/app/shared/models/team-member.model.ts`

- [ ] **Step 1: Create company-profile model**

```typescript
// src/app/shared/models/company-profile.model.ts

export interface CompanyProfile {
  id: string
  name: string
  vatNumber: string | null
  streetNumber: string | null
  streetName: string | null
  complement: string | null
  district: string | null
  city: string | null
  postalCode: string | null
  country: string | null
  logoPath: string | null
}

export interface UpdateCompanyRequest {
  name: string
  vatNumber: string
  streetNumber: string
  streetName: string
  complement: string
  district: string
  city: string
  postalCode: string
  country: string
}
```

- [ ] **Step 2: Create team-member model**

```typescript
// src/app/shared/models/team-member.model.ts

export type UserRole = 'ADMIN' | 'USER' | 'VIEWER'

export interface TeamMember {
  id: string
  firstName: string
  lastName: string
  email: string
  role: UserRole
  active: boolean
  createdAt: string
}

export interface CreateUserRequest {
  firstName: string
  lastName: string
  email: string
  password: string
  role: UserRole
}

export interface UpdateUserRequest {
  firstName: string
  lastName: string
  email: string
  role: UserRole
  active: boolean
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/shared/models/company-profile.model.ts \
        src/app/shared/models/team-member.model.ts
git commit -m "feat(settings): add CompanyProfile and TeamMember models"
```

---

## Task 2: CompanyService + tests

**Files:**
- Create: `src/app/features/settings/company.service.ts`
- Create: `src/app/features/settings/company.service.spec.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/app/features/settings/company.service.spec.ts
import { TestBed } from '@angular/core/testing'
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { CompanyService } from './company.service'
import { CompanyProfile, UpdateCompanyRequest } from '../../shared/models/company-profile.model'

const MOCK_PROFILE: CompanyProfile = {
  id: 'uuid-1', name: 'Compta Pro', vatNumber: 'TN123', logoPath: null,
  streetNumber: '12', streetName: 'Rue de la Paix', complement: '',
  district: '', city: 'Tunis', postalCode: '1001', country: 'Tunisie'
}

describe('CompanyService', () => {
  let service: CompanyService
  let http: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] })
    service = TestBed.inject(CompanyService)
    http    = TestBed.inject(HttpTestingController)
  })

  afterEach(() => http.verify())

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('getMyCompany() calls GET /api/companies/me', () => {
    let result: CompanyProfile | undefined
    service.getMyCompany().subscribe(r => (result = r))
    const req = http.expectOne('/api/companies/me')
    expect(req.request.method).toBe('GET')
    req.flush(MOCK_PROFILE)
    expect(result).toEqual(MOCK_PROFILE)
  })

  it('updateMyCompany() calls PUT /api/companies/me with FormData', () => {
    const update: UpdateCompanyRequest = {
      name: 'Updated', vatNumber: 'TN999', streetNumber: '1',
      streetName: 'Rue Neuve', complement: '', district: '',
      city: 'Sfax', postalCode: '3000', country: 'Tunisie'
    }
    let result: CompanyProfile | undefined
    service.updateMyCompany(update).subscribe(r => (result = r))
    const req = http.expectOne('/api/companies/me')
    expect(req.request.method).toBe('PUT')
    expect(req.request.body instanceof FormData).toBeTrue()
    req.flush({ ...MOCK_PROFILE, ...update })
    expect(result?.name).toBe('Updated')
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL (service not yet created)**

```bash
cd comptabilite-frontend
ng test --include=src/app/features/settings/company.service.spec.ts --watch=false
```

Expected: `Error: Cannot find module './company.service'`

- [ ] **Step 3: Create the service**

```typescript
// src/app/features/settings/company.service.ts
import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { CompanyProfile, UpdateCompanyRequest } from '../../shared/models/company-profile.model'

@Injectable({ providedIn: 'root' })
export class CompanyService {
  private http = inject(HttpClient)

  getMyCompany(): Observable<CompanyProfile> {
    return this.http.get<CompanyProfile>('/api/companies/me')
  }

  updateMyCompany(data: UpdateCompanyRequest, logo?: File): Observable<CompanyProfile> {
    const formData = new FormData()
    formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }))
    if (logo) {
      formData.append('logo', logo)
    }
    return this.http.put<CompanyProfile>('/api/companies/me', formData)
  }
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
ng test --include=src/app/features/settings/company.service.spec.ts --watch=false
```

Expected: `3 specs, 0 failures`

- [ ] **Step 5: Commit**

```bash
git add src/app/features/settings/company.service.ts \
        src/app/features/settings/company.service.spec.ts
git commit -m "feat(settings): add CompanyService with tests"
```

---

## Task 3: UserAdminService + tests

**Files:**
- Create: `src/app/features/settings/user-admin.service.ts`
- Create: `src/app/features/settings/user-admin.service.spec.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/app/features/settings/user-admin.service.spec.ts
import { TestBed } from '@angular/core/testing'
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { UserAdminService } from './user-admin.service'
import { TeamMember, CreateUserRequest, UpdateUserRequest } from '../../shared/models/team-member.model'

const MOCK_MEMBER: TeamMember = {
  id: 'uuid-1', firstName: 'Ahmed', lastName: 'Hamdi',
  email: 'ahmed@test.tn', role: 'ADMIN', active: true,
  createdAt: '2025-01-15T10:00:00Z'
}

describe('UserAdminService', () => {
  let service: UserAdminService
  let http: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] })
    service = TestBed.inject(UserAdminService)
    http    = TestBed.inject(HttpTestingController)
  })

  afterEach(() => http.verify())

  it('should be created', () => expect(service).toBeTruthy())

  it('getAll() calls GET /api/users', () => {
    let result: TeamMember[] | undefined
    service.getAll().subscribe(r => (result = r))
    const req = http.expectOne('/api/users')
    expect(req.request.method).toBe('GET')
    req.flush([MOCK_MEMBER])
    expect(result?.length).toBe(1)
  })

  it('create() calls POST /api/users', () => {
    const payload: CreateUserRequest = {
      firstName: 'Sonia', lastName: 'Ben Amor',
      email: 'sonia@test.tn', password: 'secret123', role: 'USER'
    }
    let result: TeamMember | undefined
    service.create(payload).subscribe(r => (result = r))
    const req = http.expectOne('/api/users')
    expect(req.request.method).toBe('POST')
    expect(req.request.body).toEqual(payload)
    req.flush({ ...MOCK_MEMBER, ...payload })
    expect(result?.email).toBe('sonia@test.tn')
  })

  it('update() calls PUT /api/users/:id', () => {
    const payload: UpdateUserRequest = {
      firstName: 'Ahmed', lastName: 'Hamdi',
      email: 'ahmed@test.tn', role: 'USER', active: false
    }
    service.update('uuid-1', payload).subscribe()
    const req = http.expectOne('/api/users/uuid-1')
    expect(req.request.method).toBe('PUT')
    req.flush({ ...MOCK_MEMBER, ...payload })
  })

  it('delete() calls DELETE /api/users/:id', () => {
    service.delete('uuid-1').subscribe()
    const req = http.expectOne('/api/users/uuid-1')
    expect(req.request.method).toBe('DELETE')
    req.flush(null)
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
ng test --include=src/app/features/settings/user-admin.service.spec.ts --watch=false
```

Expected: `Error: Cannot find module './user-admin.service'`

- [ ] **Step 3: Create the service**

```typescript
// src/app/features/settings/user-admin.service.ts
import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { TeamMember, CreateUserRequest, UpdateUserRequest } from '../../shared/models/team-member.model'

@Injectable({ providedIn: 'root' })
export class UserAdminService {
  private http = inject(HttpClient)

  getAll(): Observable<TeamMember[]> {
    return this.http.get<TeamMember[]>('/api/users')
  }

  create(req: CreateUserRequest): Observable<TeamMember> {
    return this.http.post<TeamMember>('/api/users', req)
  }

  update(id: string, req: UpdateUserRequest): Observable<TeamMember> {
    return this.http.put<TeamMember>(`/api/users/${id}`, req)
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/api/users/${id}`)
  }
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
ng test --include=src/app/features/settings/user-admin.service.spec.ts --watch=false
```

Expected: `4 specs, 0 failures`

- [ ] **Step 5: Commit**

```bash
git add src/app/features/settings/user-admin.service.ts \
        src/app/features/settings/user-admin.service.spec.ts
git commit -m "feat(settings): add UserAdminService with tests"
```

---

## Task 4: Translation keys

**Files:**
- Modify: `src/assets/i18n/fr.json`
- Modify: `src/assets/i18n/en.json`

- [ ] **Step 1: Add SETTINGS namespace to fr.json**

Add the following block before the closing `}` of the JSON:

```json
  "SETTINGS": {
    "TITLE": "Paramètres",
    "NAV_PROFILE": "Profil Entreprise",
    "NAV_TEAM": "Gestion de l'équipe",
    "PROFILE_TITLE": "Profil Entreprise",
    "PROFILE_SUBTITLE": "Informations de votre entreprise affichées sur les documents.",
    "LOGO_CARD_TITLE": "Logo",
    "LOGO_CARD_SUB": "Affiché sur les factures et documents",
    "LOGO_CURRENT": "Logo actuel",
    "LOGO_HINT": "Formats : PNG, JPEG, WebP · Taille max : 2 Mo",
    "LOGO_CHANGE": "Changer le logo",
    "INFO_CARD_TITLE": "Informations générales",
    "INFO_CARD_SUB": "Identité légale de l'entreprise",
    "FIELD_NAME": "Nom de l'entreprise",
    "FIELD_VAT": "N° TVA / Matricule fiscal",
    "ADDRESS_CARD_TITLE": "Adresse",
    "ADDRESS_CARD_SUB": "Adresse postale de l'entreprise",
    "FIELD_STREET_NUMBER": "N° de rue",
    "FIELD_STREET_NAME": "Nom de la rue",
    "FIELD_COMPLEMENT": "Complément",
    "FIELD_DISTRICT": "Quartier",
    "FIELD_CITY": "Ville",
    "FIELD_POSTAL_CODE": "Code postal",
    "FIELD_COUNTRY": "Pays",
    "BTN_SAVE": "Enregistrer les modifications",
    "BTN_CANCEL": "Annuler",
    "SAVE_SUCCESS": "Modifications enregistrées.",
    "TEAM_TITLE": "Gestion de l'équipe",
    "TEAM_SUBTITLE_ONE": "1 membre",
    "TEAM_SUBTITLE_MANY": "{{count}} membres",
    "TEAM_SUBTITLE_SUB": "Gérez les accès à votre espace",
    "BTN_NEW_USER": "Nouvel utilisateur",
    "SEARCH_PLACEHOLDER": "Rechercher un membre...",
    "COL_MEMBER": "Membre",
    "COL_ROLE": "Rôle",
    "COL_STATUS": "Statut",
    "COL_SINCE": "Membre depuis",
    "COL_ACTIONS": "Actions",
    "ROLE_ADMIN": "Admin",
    "ROLE_USER": "Utilisateur",
    "ROLE_VIEWER": "Lecteur",
    "STATUS_ACTIVE": "Actif",
    "STATUS_INACTIVE": "Inactif",
    "MODAL_TITLE_CREATE": "Nouvel utilisateur",
    "MODAL_TITLE_EDIT": "Modifier l'utilisateur",
    "FIELD_FIRSTNAME": "Prénom",
    "FIELD_LASTNAME": "Nom",
    "FIELD_EMAIL": "Email",
    "FIELD_PASSWORD": "Mot de passe",
    "FIELD_ROLE": "Rôle",
    "FIELD_ACTIVE": "Compte actif",
    "BTN_CREATE": "Créer",
    "BTN_UPDATE": "Modifier",
    "DELETE_CONFIRM": "Confirmer",
    "DELETE_CANCEL": "Annuler",
    "ERROR_NAME_REQUIRED": "Le nom est requis.",
    "ERROR_EMAIL_REQUIRED": "L'email est requis.",
    "ERROR_EMAIL_INVALID": "Email invalide.",
    "ERROR_PASSWORD_REQUIRED": "Le mot de passe est requis.",
    "ERROR_CITY_REQUIRED": "La ville est requise.",
    "ERROR_EMAIL_TAKEN": "Cet email est déjà utilisé."
  }
```

- [ ] **Step 2: Add SETTINGS namespace to en.json**

Add the following block before the closing `}` of the JSON:

```json
  "SETTINGS": {
    "TITLE": "Settings",
    "NAV_PROFILE": "Company Profile",
    "NAV_TEAM": "Team Management",
    "PROFILE_TITLE": "Company Profile",
    "PROFILE_SUBTITLE": "Your company information displayed on documents.",
    "LOGO_CARD_TITLE": "Logo",
    "LOGO_CARD_SUB": "Displayed on invoices and documents",
    "LOGO_CURRENT": "Current logo",
    "LOGO_HINT": "Formats: PNG, JPEG, WebP · Max size: 2 MB",
    "LOGO_CHANGE": "Change logo",
    "INFO_CARD_TITLE": "General information",
    "INFO_CARD_SUB": "Legal identity of the company",
    "FIELD_NAME": "Company name",
    "FIELD_VAT": "VAT number / Tax ID",
    "ADDRESS_CARD_TITLE": "Address",
    "ADDRESS_CARD_SUB": "Company mailing address",
    "FIELD_STREET_NUMBER": "Street number",
    "FIELD_STREET_NAME": "Street name",
    "FIELD_COMPLEMENT": "Complement",
    "FIELD_DISTRICT": "District",
    "FIELD_CITY": "City",
    "FIELD_POSTAL_CODE": "Postal code",
    "FIELD_COUNTRY": "Country",
    "BTN_SAVE": "Save changes",
    "BTN_CANCEL": "Cancel",
    "SAVE_SUCCESS": "Changes saved.",
    "TEAM_TITLE": "Team Management",
    "TEAM_SUBTITLE_ONE": "1 member",
    "TEAM_SUBTITLE_MANY": "{{count}} members",
    "TEAM_SUBTITLE_SUB": "Manage access to your workspace",
    "BTN_NEW_USER": "New user",
    "SEARCH_PLACEHOLDER": "Search a member...",
    "COL_MEMBER": "Member",
    "COL_ROLE": "Role",
    "COL_STATUS": "Status",
    "COL_SINCE": "Member since",
    "COL_ACTIONS": "Actions",
    "ROLE_ADMIN": "Admin",
    "ROLE_USER": "User",
    "ROLE_VIEWER": "Viewer",
    "STATUS_ACTIVE": "Active",
    "STATUS_INACTIVE": "Inactive",
    "MODAL_TITLE_CREATE": "New user",
    "MODAL_TITLE_EDIT": "Edit user",
    "FIELD_FIRSTNAME": "First name",
    "FIELD_LASTNAME": "Last name",
    "FIELD_EMAIL": "Email",
    "FIELD_PASSWORD": "Password",
    "FIELD_ROLE": "Role",
    "FIELD_ACTIVE": "Active account",
    "BTN_CREATE": "Create",
    "BTN_UPDATE": "Update",
    "DELETE_CONFIRM": "Confirm",
    "DELETE_CANCEL": "Cancel",
    "ERROR_NAME_REQUIRED": "Company name is required.",
    "ERROR_EMAIL_REQUIRED": "Email is required.",
    "ERROR_EMAIL_INVALID": "Invalid email.",
    "ERROR_PASSWORD_REQUIRED": "Password is required.",
    "ERROR_CITY_REQUIRED": "City is required.",
    "ERROR_EMAIL_TAKEN": "This email is already in use."
  }
```

- [ ] **Step 3: Commit**

```bash
git add src/assets/i18n/fr.json src/assets/i18n/en.json
git commit -m "feat(settings): add SETTINGS translation keys (fr + en)"
```

---

## Task 5: Settings shell + routing

**Files:**
- Create: `src/app/features/settings/settings.routes.ts`
- Create: `src/app/features/settings/settings.component.ts`
- Create: `src/app/features/settings/settings.component.html`
- Create: `src/app/features/settings/settings.component.scss`
- Modify: `src/app/app.routes.ts`

- [ ] **Step 1: Create settings.routes.ts**

```typescript
// src/app/features/settings/settings.routes.ts
import { Routes } from '@angular/router'

export const settingsRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'profile'
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./company-profile/company-profile.component').then(m => m.CompanyProfileComponent)
  },
  {
    path: 'team',
    loadComponent: () =>
      import('./team-management/team-management.component').then(m => m.TeamManagementComponent)
  }
]
```

- [ ] **Step 2: Create settings.component.ts**

```typescript
// src/app/features/settings/settings.component.ts
import { Component } from '@angular/core'
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, TranslateModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {}
```

- [ ] **Step 3: Create settings.component.html**

```html
<!-- src/app/features/settings/settings.component.html -->
<div class="set-layout">

  <aside class="set-nav">
    <p class="set-nav__label">{{ 'SETTINGS.TITLE' | translate }}</p>

    <a routerLink="profile"
       routerLinkActive="set-nav__item--active"
       class="set-nav__item">
      <span class="material-symbols-outlined">business</span>
      {{ 'SETTINGS.NAV_PROFILE' | translate }}
    </a>

    <a routerLink="team"
       routerLinkActive="set-nav__item--active"
       class="set-nav__item">
      <span class="material-symbols-outlined">group</span>
      {{ 'SETTINGS.NAV_TEAM' | translate }}
    </a>
  </aside>

  <main class="set-content">
    <router-outlet />
  </main>

</div>
```

- [ ] **Step 4: Create settings.component.scss**

```scss
/* src/app/features/settings/settings.component.scss */

:host {
  display: block;
  background: var(--color-background);
  min-height: 100%;
}

.set-layout {
  display: flex;
  min-height: 100%;
}

/* ── Sidebar nav ───────────────────────────── */

.set-nav {
  width: 220px;
  flex-shrink: 0;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border-subtle);
  padding: 28px 0;

  @media (max-width: 768px) {
    display: none;
  }
}

.set-nav__label {
  padding: 0 20px 16px;
  font-size: 11px;
  font-weight: 700;
  color: var(--color-on-surface-variant);
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.set-nav__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 20px;
  font-size: 14px;
  color: var(--color-on-surface-variant);
  text-decoration: none;
  cursor: pointer;
  transition: background 0.15s;

  .material-symbols-outlined {
    font-size: 20px;
  }

  &:hover {
    background: var(--color-surface-container);
    color: var(--color-on-surface);
  }

  &--active {
    background: color-mix(in srgb, var(--color-primary) 10%, transparent);
    color: var(--color-primary);
    font-weight: 600;
    border-right: 3px solid var(--color-primary);
  }
}

/* ── Content area ──────────────────────────── */

.set-content {
  flex: 1;
  overflow-y: auto;
  background: var(--color-background);
}
```

- [ ] **Step 5: Add /settings to app.routes.ts**

In `src/app/app.routes.ts`, inside the `MainLayoutComponent` children array, add after the last purchase-invoice route:

```typescript
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.component').then(m => m.SettingsComponent),
        loadChildren: () =>
          import('./features/settings/settings.routes').then(m => m.settingsRoutes)
      },
```

- [ ] **Step 6: Verify app compiles**

```bash
cd comptabilite-frontend
ng build --configuration development 2>&1 | tail -5
```

Expected: `Build at: ... - Hash: ... - Time: ...ms`

- [ ] **Step 7: Commit**

```bash
git add src/app/features/settings/settings.routes.ts \
        src/app/features/settings/settings.component.ts \
        src/app/features/settings/settings.component.html \
        src/app/features/settings/settings.component.scss \
        src/app/app.routes.ts
git commit -m "feat(settings): add SettingsComponent shell with sidebar nav and child routes"
```

---

## Task 6: Wire header settings button

**Files:**
- Modify: `src/app/core/layout/header.component.html`

- [ ] **Step 1: Add routerLink to settings button**

In `src/app/core/layout/header.component.html`, replace:

```html
    <button class="app-header__icon-btn" type="button" aria-label="Paramètres">
      <span class="material-symbols-outlined">settings</span>
    </button>
```

With:

```html
    <a routerLink="/settings"
       routerLinkActive="app-header__icon-btn--active"
       class="app-header__icon-btn"
       aria-label="Paramètres">
      <span class="material-symbols-outlined">settings</span>
    </a>
```

- [ ] **Step 2: Add RouterLinkActive to header.component.ts imports**

In `src/app/core/layout/header.component.ts`, `RouterLinkActive` is already imported. Verify the imports array contains both `RouterLink` and `RouterLinkActive`. No change needed if they are already there.

- [ ] **Step 3: Commit**

```bash
git add src/app/core/layout/header.component.html
git commit -m "feat(settings): wire header settings icon to /settings route"
```

---

## Task 7: Company Profile component

**Files:**
- Create: `src/app/features/settings/company-profile/company-profile.component.ts`
- Create: `src/app/features/settings/company-profile/company-profile.component.html`
- Create: `src/app/features/settings/company-profile/company-profile.component.scss`

- [ ] **Step 1: Create company-profile.component.ts**

```typescript
// src/app/features/settings/company-profile/company-profile.component.ts
import { Component, inject, OnInit, signal } from '@angular/core'
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { CompanyService } from '../company.service'
import { UpdateCompanyRequest } from '../../../shared/models/company-profile.model'

@Component({
  selector: 'app-company-profile',
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule],
  templateUrl: './company-profile.component.html',
  styleUrl: './company-profile.component.scss'
})
export class CompanyProfileComponent implements OnInit {
  private fb             = inject(FormBuilder)
  private companyService = inject(CompanyService)

  loading     = signal(true)
  saving      = signal(false)
  saveError   = signal('')
  saveSuccess = signal(false)

  currentLogoUrl  = signal<string | null>(null)
  newLogoFile     = signal<File | null>(null)
  newLogoPreview  = signal<string | null>(null)

  form = this.fb.nonNullable.group({
    name:         ['', Validators.required],
    vatNumber:    [''],
    streetNumber: [''],
    streetName:   [''],
    complement:   [''],
    district:     [''],
    city:         ['', Validators.required],
    postalCode:   [''],
    country:      ['Tunisie']
  })

  ngOnInit(): void {
    this.companyService.getMyCompany().subscribe({
      next: (c) => {
        this.form.patchValue({
          name:         c.name         ?? '',
          vatNumber:    c.vatNumber    ?? '',
          streetNumber: c.streetNumber ?? '',
          streetName:   c.streetName   ?? '',
          complement:   c.complement   ?? '',
          district:     c.district     ?? '',
          city:         c.city         ?? '',
          postalCode:   c.postalCode   ?? '',
          country:      c.country      ?? 'Tunisie'
        })
        this.currentLogoUrl.set(c.logoPath)
        this.loading.set(false)
      },
      error: () => this.loading.set(false)
    })
  }

  onLogoChange(event: Event): void {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      this.saveError.set('Format non supporté. Utilisez PNG, JPEG ou WebP.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      this.saveError.set('Le logo ne doit pas dépasser 2 Mo.')
      return
    }

    this.saveError.set('')
    this.newLogoFile.set(file)
    const reader = new FileReader()
    reader.onload = () => this.newLogoPreview.set(reader.result as string)
    reader.readAsDataURL(file)
  }

  save(): void {
    this.form.markAllAsTouched()
    if (this.form.invalid) return

    this.saving.set(true)
    this.saveError.set('')
    this.saveSuccess.set(false)

    const req: UpdateCompanyRequest = this.form.getRawValue()

    this.companyService.updateMyCompany(req, this.newLogoFile() ?? undefined).subscribe({
      next: (updated) => {
        this.saving.set(false)
        this.saveSuccess.set(true)
        this.currentLogoUrl.set(updated.logoPath)
        this.newLogoFile.set(null)
        this.newLogoPreview.set(null)
        setTimeout(() => this.saveSuccess.set(false), 3000)
      },
      error: (e) => {
        this.saving.set(false)
        this.saveError.set(e?.error?.message ?? 'Une erreur est survenue.')
      }
    })
  }

  cancel(): void {
    this.newLogoFile.set(null)
    this.newLogoPreview.set(null)
    this.saveError.set('')
    this.ngOnInit()
  }

  logoDisplayUrl(): string | null {
    return this.newLogoPreview() ?? this.currentLogoUrl()
  }
}
```

- [ ] **Step 2: Create company-profile.component.html**

```html
<!-- src/app/features/settings/company-profile/company-profile.component.html -->
<div class="cp-page">

  <div class="cp-header">
    <h1 class="cp-header__title">{{ 'SETTINGS.PROFILE_TITLE' | translate }}</h1>
    <p class="cp-header__sub">{{ 'SETTINGS.PROFILE_SUBTITLE' | translate }}</p>
  </div>

  @if (loading()) {
    <div class="cp-skeleton">
      <div class="cp-skeleton__card"></div>
      <div class="cp-skeleton__card"></div>
      <div class="cp-skeleton__card"></div>
    </div>
  } @else {
    <form [formGroup]="form" (ngSubmit)="save()">

      <!-- Logo card -->
      <div class="cp-card">
        <div class="cp-card__head">
          <div class="cp-card__icon">
            <span class="material-symbols-outlined">image</span>
          </div>
          <div>
            <p class="cp-card__title">{{ 'SETTINGS.LOGO_CARD_TITLE' | translate }}</p>
            <p class="cp-card__sub">{{ 'SETTINGS.LOGO_CARD_SUB' | translate }}</p>
          </div>
        </div>
        <div class="cp-logo-area">
          @if (logoDisplayUrl()) {
            <img [src]="logoDisplayUrl()" alt="Logo" class="cp-logo-preview" />
          } @else {
            <div class="cp-logo-placeholder">
              <span class="material-symbols-outlined">business</span>
            </div>
          }
          <div class="cp-logo-info">
            <p class="cp-logo-info__label">{{ 'SETTINGS.LOGO_CURRENT' | translate }}</p>
            <p class="cp-logo-info__hint">{{ 'SETTINGS.LOGO_HINT' | translate }}</p>
            <label class="cp-btn-outline cp-logo-info__btn">
              {{ 'SETTINGS.LOGO_CHANGE' | translate }}
              <input type="file" accept="image/png,image/jpeg,image/webp"
                     (change)="onLogoChange($event)" class="cp-logo-input" />
            </label>
          </div>
        </div>
      </div>

      <!-- Informations générales card -->
      <div class="cp-card">
        <div class="cp-card__head">
          <div class="cp-card__icon">
            <span class="material-symbols-outlined">receipt_long</span>
          </div>
          <div>
            <p class="cp-card__title">{{ 'SETTINGS.INFO_CARD_TITLE' | translate }}</p>
            <p class="cp-card__sub">{{ 'SETTINGS.INFO_CARD_SUB' | translate }}</p>
          </div>
        </div>
        <div class="cp-form-grid">
          <div class="cp-field">
            <label class="cp-field__label">{{ 'SETTINGS.FIELD_NAME' | translate }} *</label>
            <input formControlName="name" class="cp-field__input"
                   [class.cp-field__input--error]="form.get('name')?.invalid && form.get('name')?.touched" />
            @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
              <p class="cp-field__error">{{ 'SETTINGS.ERROR_NAME_REQUIRED' | translate }}</p>
            }
          </div>
          <div class="cp-field">
            <label class="cp-field__label">{{ 'SETTINGS.FIELD_VAT' | translate }}</label>
            <input formControlName="vatNumber" class="cp-field__input" />
          </div>
        </div>
      </div>

      <!-- Adresse card -->
      <div class="cp-card">
        <div class="cp-card__head">
          <div class="cp-card__icon">
            <span class="material-symbols-outlined">location_on</span>
          </div>
          <div>
            <p class="cp-card__title">{{ 'SETTINGS.ADDRESS_CARD_TITLE' | translate }}</p>
            <p class="cp-card__sub">{{ 'SETTINGS.ADDRESS_CARD_SUB' | translate }}</p>
          </div>
        </div>
        <div class="cp-form-grid cp-form-grid--three">
          <div class="cp-field">
            <label class="cp-field__label">{{ 'SETTINGS.FIELD_STREET_NUMBER' | translate }}</label>
            <input formControlName="streetNumber" class="cp-field__input" />
          </div>
          <div class="cp-field cp-form-grid--span2">
            <label class="cp-field__label">{{ 'SETTINGS.FIELD_STREET_NAME' | translate }}</label>
            <input formControlName="streetName" class="cp-field__input" />
          </div>
          <div class="cp-field">
            <label class="cp-field__label">{{ 'SETTINGS.FIELD_COMPLEMENT' | translate }}</label>
            <input formControlName="complement" class="cp-field__input" />
          </div>
          <div class="cp-field">
            <label class="cp-field__label">{{ 'SETTINGS.FIELD_DISTRICT' | translate }}</label>
            <input formControlName="district" class="cp-field__input" />
          </div>
          <div class="cp-field">
            <label class="cp-field__label">{{ 'SETTINGS.FIELD_CITY' | translate }} *</label>
            <input formControlName="city" class="cp-field__input"
                   [class.cp-field__input--error]="form.get('city')?.invalid && form.get('city')?.touched" />
            @if (form.get('city')?.hasError('required') && form.get('city')?.touched) {
              <p class="cp-field__error">{{ 'SETTINGS.ERROR_CITY_REQUIRED' | translate }}</p>
            }
          </div>
          <div class="cp-field">
            <label class="cp-field__label">{{ 'SETTINGS.FIELD_POSTAL_CODE' | translate }}</label>
            <input formControlName="postalCode" class="cp-field__input" />
          </div>
          <div class="cp-field">
            <label class="cp-field__label">{{ 'SETTINGS.FIELD_COUNTRY' | translate }}</label>
            <input formControlName="country" class="cp-field__input" />
          </div>
        </div>
      </div>

      <!-- Footer actions -->
      <div class="cp-actions">
        @if (saveError()) {
          <span class="cp-actions__error">
            <span class="material-symbols-outlined">error</span>
            {{ saveError() }}
          </span>
        }
        @if (saveSuccess()) {
          <span class="cp-actions__success">
            <span class="material-symbols-outlined">check_circle</span>
            {{ 'SETTINGS.SAVE_SUCCESS' | translate }}
          </span>
        }
        <button type="button" (click)="cancel()" class="cp-btn-outline">
          {{ 'SETTINGS.BTN_CANCEL' | translate }}
        </button>
        <button type="submit" class="cp-btn-primary" [disabled]="saving()">
          @if (saving()) {
            <span class="material-symbols-outlined cp-spin">progress_activity</span>
          }
          {{ 'SETTINGS.BTN_SAVE' | translate }}
        </button>
      </div>

    </form>
  }

</div>
```

- [ ] **Step 3: Create company-profile.component.scss**

```scss
/* src/app/features/settings/company-profile/company-profile.component.scss */

:host {
  display: block;
}

.cp-page {
  max-width: 860px;
  margin: 0 auto;
  padding: 32px 32px 64px;
  display: flex;
  flex-direction: column;
  gap: 20px;

  @media (max-width: 768px) {
    padding: 20px 16px 48px;
  }
}

/* ── Header ────────────────────────────────── */

.cp-header__title {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-on-surface);
}

.cp-header__sub {
  font-size: 14px;
  color: var(--color-on-surface-variant);
  margin-top: 4px;
}

/* ── Card ──────────────────────────────────── */

.cp-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg, 12px);
  padding: 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.cp-card__head {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-bottom: 20px;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--color-border-subtle);
}

.cp-card__icon {
  width: 38px;
  height: 38px;
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  border-radius: var(--radius-md, 8px);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .material-symbols-outlined {
    font-size: 20px;
    color: var(--color-primary);
  }
}

.cp-card__title {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-on-surface);
}

.cp-card__sub {
  font-size: 12px;
  color: var(--color-on-surface-variant);
  margin-top: 2px;
}

/* ── Logo area ─────────────────────────────── */

.cp-logo-area {
  display: flex;
  align-items: center;
  gap: 20px;
}

.cp-logo-preview {
  width: 80px;
  height: 80px;
  object-fit: contain;
  border-radius: var(--radius-md, 8px);
  border: 1.5px solid var(--color-border-subtle);
  flex-shrink: 0;
}

.cp-logo-placeholder {
  width: 80px;
  height: 80px;
  background: color-mix(in srgb, var(--color-primary) 8%, transparent);
  border: 2px dashed color-mix(in srgb, var(--color-primary) 40%, transparent);
  border-radius: var(--radius-md, 8px);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .material-symbols-outlined {
    font-size: 32px;
    color: var(--color-on-surface-variant);
  }
}

.cp-logo-info__label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-on-surface);
}

.cp-logo-info__hint {
  font-size: 12px;
  color: var(--color-on-surface-variant);
  margin-top: 4px;
}

.cp-logo-info__btn {
  display: inline-block;
  margin-top: 10px;
  cursor: pointer;
}

.cp-logo-input {
  display: none;
}

/* ── Form grid ─────────────────────────────── */

.cp-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  &--three {
    grid-template-columns: 1fr 1fr 1fr;
  }
}

.cp-form-grid--span2 {
  grid-column: span 2;
}

/* ── Field ─────────────────────────────────── */

.cp-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cp-field__label {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-on-surface-variant);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.cp-field__input {
  padding: 10px 13px;
  border: 1.5px solid var(--color-border-subtle);
  border-radius: var(--radius-md, 8px);
  font-size: 14px;
  color: var(--color-on-surface);
  background: var(--color-surface-container, #f8fafc);
  transition: border-color 0.15s;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
    background: var(--color-surface);
  }

  &--error {
    border-color: #ef4444;
  }
}

.cp-field__error {
  font-size: 12px;
  color: #ef4444;
}

/* ── Buttons ───────────────────────────────── */

.cp-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 22px;
  background: var(--color-primary);
  color: var(--color-on-primary, #fff);
  border: none;
  border-radius: var(--radius-md, 8px);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.cp-btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: var(--color-surface);
  color: var(--color-on-surface-variant);
  border: 1.5px solid var(--color-border-subtle);
  border-radius: var(--radius-md, 8px);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: var(--color-surface-container);
  }
}

/* ── Actions footer ────────────────────────── */

.cp-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 8px;
}

.cp-actions__error {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-radius: var(--radius-md, 8px);
  font-size: 13px;
  margin-right: auto;

  .material-symbols-outlined { font-size: 16px; }
}

.cp-actions__success {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
  border-radius: var(--radius-md, 8px);
  font-size: 13px;
  margin-right: auto;

  .material-symbols-outlined { font-size: 16px; }
}

/* ── Skeleton ──────────────────────────────── */

.cp-skeleton {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.cp-skeleton__card {
  height: 160px;
  background: var(--color-surface);
  border-radius: var(--radius-lg, 12px);
  animation: cp-shimmer 1.4s ease-in-out infinite;
}

@keyframes cp-shimmer {
  0%   { opacity: 1; }
  50%  { opacity: 0.5; }
  100% { opacity: 1; }
}

/* ── Spinner ───────────────────────────────── */

@keyframes cp-spin {
  to { transform: rotate(360deg); }
}

.cp-spin {
  animation: cp-spin 0.8s linear infinite;
  font-size: 16px;
}
```

- [ ] **Step 4: Verify app builds**

```bash
ng build --configuration development 2>&1 | tail -5
```

Expected: clean build with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/features/settings/company-profile/
git commit -m "feat(settings): add CompanyProfileComponent with logo, name, VAT, address form"
```

---

## Task 8: User Form Modal component

**Files:**
- Create: `src/app/features/settings/team-management/user-form-modal/user-form-modal.component.ts`
- Create: `src/app/features/settings/team-management/user-form-modal/user-form-modal.component.html`
- Create: `src/app/features/settings/team-management/user-form-modal/user-form-modal.component.scss`

- [ ] **Step 1: Create user-form-modal.component.ts**

```typescript
// src/app/features/settings/team-management/user-form-modal/user-form-modal.component.ts
import { Component, inject, Input, Output, EventEmitter, OnInit, signal } from '@angular/core'
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { UserAdminService } from '../../user-admin.service'
import { TeamMember, CreateUserRequest, UpdateUserRequest, UserRole } from '../../../../shared/models/team-member.model'

@Component({
  selector: 'app-user-form-modal',
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule],
  templateUrl: './user-form-modal.component.html',
  styleUrl: './user-form-modal.component.scss'
})
export class UserFormModalComponent implements OnInit {
  @Input() mode: 'create' | 'edit' = 'create'
  @Input() member: TeamMember | null = null
  @Output() saved     = new EventEmitter<TeamMember>()
  @Output() cancelled = new EventEmitter<void>()

  private fb              = inject(FormBuilder)
  private userAdminService = inject(UserAdminService)

  saving    = signal(false)
  saveError = signal('')

  readonly roles: UserRole[] = ['ADMIN', 'USER', 'VIEWER']

  form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName:  ['', Validators.required],
    email:     ['', [Validators.required, Validators.email]],
    password:  ['', Validators.required],
    role:      ['USER' as UserRole, Validators.required],
    active:    [true]
  })

  ngOnInit(): void {
    if (this.mode === 'edit' && this.member) {
      this.form.patchValue({
        firstName: this.member.firstName,
        lastName:  this.member.lastName,
        email:     this.member.email,
        role:      this.member.role,
        active:    this.member.active
      })
      // Password not required for edit
      this.form.get('password')!.clearValidators()
      this.form.get('password')!.updateValueAndValidity()
    }
  }

  submit(): void {
    this.form.markAllAsTouched()
    if (this.form.invalid) return

    this.saving.set(true)
    this.saveError.set('')

    const v = this.form.getRawValue()

    if (this.mode === 'create') {
      const req: CreateUserRequest = {
        firstName: v.firstName,
        lastName:  v.lastName,
        email:     v.email,
        password:  v.password,
        role:      v.role
      }
      this.userAdminService.create(req).subscribe({
        next: (member) => { this.saving.set(false); this.saved.emit(member) },
        error: (e) => {
          this.saving.set(false)
          this.saveError.set(
            e?.status === 409
              ? 'SETTINGS.ERROR_EMAIL_TAKEN'
              : (e?.error?.message ?? 'Une erreur est survenue.')
          )
        }
      })
    } else {
      const req: UpdateUserRequest = {
        firstName: v.firstName,
        lastName:  v.lastName,
        email:     v.email,
        role:      v.role,
        active:    v.active
      }
      this.userAdminService.update(this.member!.id, req).subscribe({
        next: (member) => { this.saving.set(false); this.saved.emit(member) },
        error: (e) => {
          this.saving.set(false)
          this.saveError.set(
            e?.status === 409
              ? 'SETTINGS.ERROR_EMAIL_TAKEN'
              : (e?.error?.message ?? 'Une erreur est survenue.')
          )
        }
      })
    }
  }

  close(): void {
    this.cancelled.emit()
  }
}
```

- [ ] **Step 2: Create user-form-modal.component.html**

```html
<!-- src/app/features/settings/team-management/user-form-modal/user-form-modal.component.html -->
<div class="um-backdrop" (click)="close()"></div>

<div class="um-modal" (click)="$event.stopPropagation()">

  <div class="um-modal__head">
    <h2 class="um-modal__title">
      {{ (mode === 'create' ? 'SETTINGS.MODAL_TITLE_CREATE' : 'SETTINGS.MODAL_TITLE_EDIT') | translate }}
    </h2>
    <button type="button" class="um-modal__close" (click)="close()">
      <span class="material-symbols-outlined">close</span>
    </button>
  </div>

  <form [formGroup]="form" (ngSubmit)="submit()" class="um-modal__body">

    <div class="um-form-row">
      <div class="um-field">
        <label class="um-field__label">{{ 'SETTINGS.FIELD_FIRSTNAME' | translate }} *</label>
        <input formControlName="firstName" class="um-field__input"
               [class.um-field__input--error]="form.get('firstName')?.invalid && form.get('firstName')?.touched" />
      </div>
      <div class="um-field">
        <label class="um-field__label">{{ 'SETTINGS.FIELD_LASTNAME' | translate }} *</label>
        <input formControlName="lastName" class="um-field__input"
               [class.um-field__input--error]="form.get('lastName')?.invalid && form.get('lastName')?.touched" />
      </div>
    </div>

    <div class="um-field">
      <label class="um-field__label">{{ 'SETTINGS.FIELD_EMAIL' | translate }} *</label>
      <input formControlName="email" type="email" class="um-field__input"
             [class.um-field__input--error]="form.get('email')?.invalid && form.get('email')?.touched" />
      @if (form.get('email')?.hasError('email') && form.get('email')?.touched) {
        <p class="um-field__error">{{ 'SETTINGS.ERROR_EMAIL_INVALID' | translate }}</p>
      }
    </div>

    @if (mode === 'create') {
      <div class="um-field">
        <label class="um-field__label">{{ 'SETTINGS.FIELD_PASSWORD' | translate }} *</label>
        <input formControlName="password" type="password" class="um-field__input"
               [class.um-field__input--error]="form.get('password')?.invalid && form.get('password')?.touched" />
        @if (form.get('password')?.hasError('required') && form.get('password')?.touched) {
          <p class="um-field__error">{{ 'SETTINGS.ERROR_PASSWORD_REQUIRED' | translate }}</p>
        }
      </div>
    }

    <div class="um-field">
      <label class="um-field__label">{{ 'SETTINGS.FIELD_ROLE' | translate }} *</label>
      <select formControlName="role" class="um-field__input">
        @for (role of roles; track role) {
          <option [value]="role">{{ 'SETTINGS.ROLE_' + role | translate }}</option>
        }
      </select>
    </div>

    @if (mode === 'edit') {
      <div class="um-field um-field--checkbox">
        <label class="um-field__check-label">
          <input type="checkbox" formControlName="active" class="um-field__check" />
          {{ 'SETTINGS.FIELD_ACTIVE' | translate }}
        </label>
      </div>
    }

    @if (saveError()) {
      <p class="um-error">{{ saveError() | translate }}</p>
    }

    <div class="um-modal__foot">
      <button type="button" class="um-btn-cancel" (click)="close()">
        {{ 'SETTINGS.BTN_CANCEL' | translate }}
      </button>
      <button type="submit" class="um-btn-primary" [disabled]="saving()">
        @if (saving()) {
          <span class="material-symbols-outlined um-spin">progress_activity</span>
        }
        {{ (mode === 'create' ? 'SETTINGS.BTN_CREATE' : 'SETTINGS.BTN_UPDATE') | translate }}
      </button>
    </div>

  </form>
</div>
```

- [ ] **Step 3: Create user-form-modal.component.scss**

```scss
/* src/app/features/settings/team-management/user-form-modal/user-form-modal.component.scss */

.um-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 100;
}

.um-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 101;
  width: 480px;
  max-width: calc(100vw - 32px);
  background: var(--color-surface);
  border-radius: var(--radius-lg, 12px);
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.18);
  overflow: hidden;
}

.um-modal__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--color-border-subtle);
}

.um-modal__title {
  font-size: 17px;
  font-weight: 700;
  color: var(--color-on-surface);
}

.um-modal__close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-on-surface-variant);
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: var(--radius-md, 6px);

  &:hover { background: var(--color-surface-container); }

  .material-symbols-outlined { font-size: 20px; }
}

.um-modal__body {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.um-form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.um-field {
  display: flex;
  flex-direction: column;
  gap: 6px;

  &--checkbox {
    flex-direction: row;
    align-items: center;
  }
}

.um-field__label {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-on-surface-variant);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.um-field__input {
  padding: 10px 13px;
  border: 1.5px solid var(--color-border-subtle);
  border-radius: var(--radius-md, 8px);
  font-size: 14px;
  color: var(--color-on-surface);
  background: var(--color-surface-container, #f8fafc);
  width: 100%;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
    background: var(--color-surface);
  }

  &--error { border-color: #ef4444; }
}

.um-field__error {
  font-size: 12px;
  color: #ef4444;
}

.um-field__check-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--color-on-surface);
  cursor: pointer;
}

.um-field__check {
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary);
}

.um-error {
  font-size: 13px;
  color: #ef4444;
  padding: 8px 12px;
  background: rgba(239, 68, 68, 0.08);
  border-radius: var(--radius-md, 6px);
}

.um-modal__foot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 4px;
}

.um-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 22px;
  background: var(--color-primary);
  color: var(--color-on-primary, #fff);
  border: none;
  border-radius: var(--radius-md, 8px);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;

  &:disabled { opacity: 0.6; cursor: not-allowed; }
}

.um-btn-cancel {
  padding: 10px 18px;
  background: var(--color-surface);
  color: var(--color-on-surface-variant);
  border: 1.5px solid var(--color-border-subtle);
  border-radius: var(--radius-md, 8px);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;

  &:hover { background: var(--color-surface-container); }
}

@keyframes um-spin {
  to { transform: rotate(360deg); }
}
.um-spin {
  animation: um-spin 0.8s linear infinite;
  font-size: 16px;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/features/settings/team-management/user-form-modal/
git commit -m "feat(settings): add UserFormModalComponent for create/edit team members"
```

---

## Task 9: Team Management component

**Files:**
- Create: `src/app/features/settings/team-management/team-management.component.ts`
- Create: `src/app/features/settings/team-management/team-management.component.html`
- Create: `src/app/features/settings/team-management/team-management.component.scss`

- [ ] **Step 1: Create team-management.component.ts**

```typescript
// src/app/features/settings/team-management/team-management.component.ts
import { Component, inject, OnInit, signal, computed, HostListener } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { UserAdminService } from '../user-admin.service'
import { AuthService } from '../../../core/auth/auth.service'
import { TeamMember, UserRole } from '../../../shared/models/team-member.model'
import { UserFormModalComponent } from './user-form-modal/user-form-modal.component'

@Component({
  selector: 'app-team-management',
  standalone: true,
  imports: [FormsModule, TranslateModule, UserFormModalComponent],
  templateUrl: './team-management.component.html',
  styleUrl: './team-management.component.scss'
})
export class TeamManagementComponent implements OnInit {
  private userAdminService = inject(UserAdminService)
  private authService      = inject(AuthService)

  private allMembers = signal<TeamMember[]>([])
  loading    = signal(true)
  error      = signal('')
  searchQuery = signal('')

  // Modal
  showModal   = signal(false)
  modalMode   = signal<'create' | 'edit'>('create')
  editMember  = signal<TeamMember | null>(null)

  // Inline delete confirm
  confirmDeleteId = signal<string | null>(null)
  deleting        = signal(false)

  currentUserId = computed(() => this.authService.currentUser()?.id ?? '')

  filteredMembers = computed(() => {
    const q = this.searchQuery().toLowerCase()
    if (!q) return this.allMembers()
    return this.allMembers().filter(m =>
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q)
    )
  })

  @HostListener('document:click')
  onDocumentClick(): void {
    this.confirmDeleteId.set(null)
  }

  ngOnInit(): void {
    this.load()
  }

  private load(): void {
    this.loading.set(true)
    this.userAdminService.getAll().subscribe({
      next: (members) => { this.allMembers.set(members); this.loading.set(false) },
      error: () => { this.error.set('Impossible de charger les membres.'); this.loading.set(false) }
    })
  }

  openCreate(): void {
    this.editMember.set(null)
    this.modalMode.set('create')
    this.showModal.set(true)
  }

  openEdit(member: TeamMember, event: MouseEvent): void {
    event.stopPropagation()
    this.editMember.set(member)
    this.modalMode.set('edit')
    this.showModal.set(true)
  }

  closeModal(): void {
    this.showModal.set(false)
  }

  onSaved(member: TeamMember): void {
    this.showModal.set(false)
    if (this.modalMode() === 'create') {
      this.allMembers.update(list => [...list, member])
    } else {
      this.allMembers.update(list => list.map(m => m.id === member.id ? member : m))
    }
  }

  startDelete(id: string, event: MouseEvent): void {
    event.stopPropagation()
    this.confirmDeleteId.set(id)
  }

  cancelDelete(event: MouseEvent): void {
    event.stopPropagation()
    this.confirmDeleteId.set(null)
  }

  confirmDelete(id: string, event: MouseEvent): void {
    event.stopPropagation()
    this.deleting.set(true)
    this.userAdminService.delete(id).subscribe({
      next: () => {
        this.allMembers.update(list => list.filter(m => m.id !== id))
        this.confirmDeleteId.set(null)
        this.deleting.set(false)
      },
      error: () => this.deleting.set(false)
    })
  }

  memberCount(): string {
    const n = this.allMembers().length
    return n === 1 ? '1 membre' : `${n} membres`
  }

  initials(m: TeamMember): string {
    return `${m.firstName.charAt(0)}${m.lastName.charAt(0)}`.toUpperCase()
  }

  avatarColor(m: TeamMember): string {
    const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4']
    const index  = (m.firstName.charCodeAt(0) + m.lastName.charCodeAt(0)) % colors.length
    return colors[index]
  }

  roleLabelKey(role: UserRole): string {
    return `SETTINGS.ROLE_${role}`
  }

  roleClass(role: UserRole): string {
    return `tm-badge--${role.toLowerCase()}`
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
  }
}
```

- [ ] **Step 2: Create team-management.component.html**

```html
<!-- src/app/features/settings/team-management/team-management.component.html -->
<div class="tm-page">

  <div class="tm-header">
    <div>
      <h1 class="tm-header__title">{{ 'SETTINGS.TEAM_TITLE' | translate }}</h1>
      <p class="tm-header__sub">{{ memberCount() }} · {{ 'SETTINGS.TEAM_SUBTITLE_SUB' | translate }}</p>
    </div>
    <button class="tm-btn-new" type="button" (click)="openCreate()">
      <span class="material-symbols-outlined">add</span>
      {{ 'SETTINGS.BTN_NEW_USER' | translate }}
    </button>
  </div>

  @if (error()) {
    <p class="tm-error">{{ error() }}</p>
  }

  <div class="tm-card">
    <!-- Search -->
    <div class="tm-search-row">
      <div class="tm-search-wrap">
        <span class="material-symbols-outlined tm-search-icon">search</span>
        <input
          class="tm-search-input"
          type="text"
          [placeholder]="'SETTINGS.SEARCH_PLACEHOLDER' | translate"
          [ngModel]="searchQuery()"
          (ngModelChange)="searchQuery.set($event)" />
      </div>
    </div>

    <!-- Table -->
    <table class="tm-table">
      <thead>
        <tr>
          <th>{{ 'SETTINGS.COL_MEMBER' | translate }}</th>
          <th>{{ 'SETTINGS.COL_ROLE' | translate }}</th>
          <th>{{ 'SETTINGS.COL_STATUS' | translate }}</th>
          <th>{{ 'SETTINGS.COL_SINCE' | translate }}</th>
          <th>{{ 'SETTINGS.COL_ACTIONS' | translate }}</th>
        </tr>
      </thead>
      <tbody>
        @if (loading()) {
          @for (i of [1,2,3]; track i) {
            <tr class="tm-tr--skeleton">
              <td><div class="tm-skel tm-skel--member"></div></td>
              <td><div class="tm-skel tm-skel--badge"></div></td>
              <td><div class="tm-skel tm-skel--sm"></div></td>
              <td><div class="tm-skel tm-skel--sm"></div></td>
              <td><div class="tm-skel tm-skel--actions"></div></td>
            </tr>
          }
        } @else {
          @for (member of filteredMembers(); track member.id) {
            <tr>
              <!-- Member -->
              <td>
                <div class="tm-member-cell">
                  <div class="tm-avatar" [style.background]="avatarColor(member)">
                    {{ initials(member) }}
                  </div>
                  <div>
                    <p class="tm-member-cell__name">{{ member.firstName }} {{ member.lastName }}</p>
                    <p class="tm-member-cell__email">{{ member.email }}</p>
                  </div>
                </div>
              </td>

              <!-- Role -->
              <td>
                <span class="tm-badge" [class]="roleClass(member.role)">
                  {{ roleLabelKey(member.role) | translate }}
                </span>
              </td>

              <!-- Status -->
              <td>
                <div class="tm-status">
                  <span class="tm-status__dot" [class.tm-status__dot--active]="member.active"></span>
                  {{ (member.active ? 'SETTINGS.STATUS_ACTIVE' : 'SETTINGS.STATUS_INACTIVE') | translate }}
                </div>
              </td>

              <!-- Since -->
              <td class="tm-date">{{ formatDate(member.createdAt) }}</td>

              <!-- Actions -->
              <td>
                @if (confirmDeleteId() === member.id) {
                  <div class="tm-confirm" (click)="$event.stopPropagation()">
                    <button class="tm-confirm__btn tm-confirm__btn--yes"
                            (click)="confirmDelete(member.id, $event)"
                            [disabled]="deleting()">
                      {{ 'SETTINGS.DELETE_CONFIRM' | translate }}
                    </button>
                    <button class="tm-confirm__btn"
                            (click)="cancelDelete($event)">
                      {{ 'SETTINGS.DELETE_CANCEL' | translate }}
                    </button>
                  </div>
                } @else {
                  <div class="tm-actions-cell">
                    <button class="tm-icon-btn" type="button"
                            (click)="openEdit(member, $event)"
                            title="Modifier">
                      <span class="material-symbols-outlined">edit</span>
                    </button>
                    @if (member.id !== currentUserId()) {
                      <button class="tm-icon-btn tm-icon-btn--danger" type="button"
                              (click)="startDelete(member.id, $event)"
                              title="Supprimer">
                        <span class="material-symbols-outlined">delete</span>
                      </button>
                    }
                  </div>
                }
              </td>
            </tr>
          }
          @empty {
            <tr>
              <td colspan="5" class="tm-empty">Aucun membre trouvé.</td>
            </tr>
          }
        }
      </tbody>
    </table>
  </div>

</div>

<!-- Modal -->
@if (showModal()) {
  <app-user-form-modal
    [mode]="modalMode()"
    [member]="editMember()"
    (saved)="onSaved($event)"
    (cancelled)="closeModal()" />
}
```

- [ ] **Step 3: Create team-management.component.scss**

```scss
/* src/app/features/settings/team-management/team-management.component.scss */

:host {
  display: block;
}

.tm-page {
  max-width: 1020px;
  margin: 0 auto;
  padding: 32px 32px 64px;
  display: flex;
  flex-direction: column;
  gap: 20px;

  @media (max-width: 768px) {
    padding: 20px 16px 48px;
  }
}

/* ── Header ────────────────────────────────── */

.tm-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.tm-header__title {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-on-surface);
}

.tm-header__sub {
  font-size: 14px;
  color: var(--color-on-surface-variant);
  margin-top: 4px;
}

.tm-btn-new {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--color-primary);
  color: var(--color-on-primary, #fff);
  border: none;
  border-radius: var(--radius-md, 8px);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;

  .material-symbols-outlined { font-size: 18px; }
}

/* ── Card ──────────────────────────────────── */

.tm-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg, 12px);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

/* ── Search ────────────────────────────────── */

.tm-search-row {
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border-subtle);
}

.tm-search-wrap {
  position: relative;
  display: flex;
  align-items: center;
  max-width: 360px;
}

.tm-search-icon {
  position: absolute;
  left: 12px;
  font-size: 18px;
  color: var(--color-on-surface-variant);
  pointer-events: none;
}

.tm-search-input {
  width: 100%;
  padding: 9px 14px 9px 38px;
  border: 1.5px solid var(--color-border-subtle);
  border-radius: var(--radius-md, 8px);
  font-size: 14px;
  color: var(--color-on-surface);
  background: var(--color-surface-container, #f8fafc);

  &:focus {
    outline: none;
    border-color: var(--color-primary);
    background: var(--color-surface);
  }
}

/* ── Table ─────────────────────────────────── */

.tm-table {
  width: 100%;
  border-collapse: collapse;

  th {
    padding: 13px 20px;
    text-align: left;
    font-size: 11px;
    font-weight: 700;
    color: var(--color-on-surface-variant);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    background: var(--color-surface-container, #f8fafc);
    border-bottom: 1px solid var(--color-border-subtle);
  }

  td {
    padding: 14px 20px;
    font-size: 14px;
    color: var(--color-on-surface);
    border-bottom: 1px solid var(--color-border-subtle);
    vertical-align: middle;
  }

  tbody tr:last-child td {
    border-bottom: none;
  }

  tbody tr:hover td {
    background: var(--color-surface-container, #f8fafc);
  }
}

/* ── Member cell ───────────────────────────── */

.tm-member-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tm-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.tm-member-cell__name {
  font-weight: 600;
  color: var(--color-on-surface);
}

.tm-member-cell__email {
  font-size: 12px;
  color: var(--color-on-surface-variant);
  margin-top: 2px;
}

/* ── Role badge ────────────────────────────── */

.tm-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;

  &--admin  { background: #eff6ff; color: #2563eb; }
  &--user   { background: #f0fdf4; color: #16a34a; }
  &--viewer { background: #fef3c7; color: #d97706; }
}

/* ── Status ────────────────────────────────── */

.tm-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--color-on-surface-variant);
}

.tm-status__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-on-surface-variant);

  &--active { background: #10b981; }
}

/* ── Date ──────────────────────────────────── */

.tm-date {
  font-size: 13px;
  color: var(--color-on-surface-variant);
}

/* ── Action buttons ────────────────────────── */

.tm-actions-cell {
  display: flex;
  gap: 6px;
}

.tm-icon-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md, 6px);
  border: 1.5px solid var(--color-border-subtle);
  background: var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-on-surface-variant);
  transition: background 0.15s;

  &:hover { background: var(--color-surface-container); }

  .material-symbols-outlined { font-size: 16px; }

  &--danger {
    border-color: #fecaca;
    color: #ef4444;

    &:hover { background: #fef2f2; }
  }
}

/* ── Inline delete confirm ─────────────────── */

.tm-confirm {
  display: flex;
  gap: 6px;
  align-items: center;
}

.tm-confirm__btn {
  padding: 6px 12px;
  border-radius: var(--radius-md, 6px);
  border: 1.5px solid var(--color-border-subtle);
  background: var(--color-surface);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  color: var(--color-on-surface-variant);

  &:hover { background: var(--color-surface-container); }

  &--yes {
    background: #ef4444;
    color: #fff;
    border-color: #ef4444;

    &:hover { background: #dc2626; }
    &:disabled { opacity: 0.6; cursor: not-allowed; }
  }
}

/* ── Empty state ───────────────────────────── */

.tm-empty {
  text-align: center;
  padding: 48px 20px !important;
  color: var(--color-on-surface-variant);
  font-size: 14px;
}

/* ── Error ─────────────────────────────────── */

.tm-error {
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.08);
  color: #ef4444;
  border-radius: var(--radius-md, 8px);
  font-size: 14px;
}

/* ── Skeleton ──────────────────────────────── */

.tm-tr--skeleton td { border-bottom: 1px solid var(--color-border-subtle); }

%tm-skel-base {
  border-radius: var(--radius-md, 6px);
  background: var(--color-surface-container, #f1f5f9);
  animation: tm-shimmer 1.4s ease-in-out infinite;
}

.tm-skel {
  @extend %tm-skel-base;
  height: 14px;

  &--member { width: 180px; height: 36px; }
  &--badge  { width: 72px;  height: 24px; }
  &--sm     { width: 80px;  height: 14px; }
  &--actions{ width: 72px;  height: 32px; }
}

@keyframes tm-shimmer {
  0%   { opacity: 1; }
  50%  { opacity: 0.4; }
  100% { opacity: 1; }
}
```

- [ ] **Step 4: Verify full build**

```bash
ng build --configuration development 2>&1 | tail -5
```

Expected: clean build, no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/features/settings/team-management/
git commit -m "feat(settings): add TeamManagementComponent with list, search, create/edit/delete"
```

---

## Self-Review Checklist

- [x] **Models** cover all fields used in services and components (`CompanyProfile`, `TeamMember`, `CreateUserRequest`, `UpdateUserRequest`)
- [x] **Services** cover all 6 API endpoints in the spec (GET/PUT company, GET/POST/PUT/DELETE users)
- [x] **Routing** — `/settings` added to `app.routes.ts`, child routes redirect `/settings` → `/settings/profile`
- [x] **Header** settings button wired to `/settings`
- [x] **Logo** — client-side validation (type, 2 MB), FileReader preview, sent as multipart only on save
- [x] **Company form** — required fields (name, city) validated, marked on submit
- [x] **Team table** — avatar initials, color-coded, role badges, status dot, date formatted
- [x] **Delete guard** — delete button hidden for `currentUserId`, inline confirm before DELETE call
- [x] **Modal** — password field hidden in edit mode, validators cleared accordingly
- [x] **Error messages** — 409 on create/edit maps to `ERROR_EMAIL_TAKEN` key
- [x] **Translations** — all template keys defined in both `fr.json` and `en.json`
- [x] **No placeholder code** — every step contains actual, complete code
