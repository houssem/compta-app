# Angular Facturation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an Angular 17+ SPA (Home, Login, Dashboard) for a billing module, with JWT auth, PrimeNG UI, ngx-echarts charts, and an Express.js mock backend.

**Architecture:** Core/Features/Shared pattern with standalone components and Angular signals. Auth is handled via JWT in localStorage with a functional interceptor and guard. The dashboard aggregates KPI cards and 3 ECharts visualizations from a single `DashboardService`.

**Tech Stack:** Angular 17+, PrimeNG v17 + PrimeFlex, ngx-echarts@17 + echarts, jwt-decode@4, Express.js + jsonwebtoken (mock server), Karma + Jasmine (unit tests)

---

## File Map

| File | Role |
|---|---|
| `proxy.conf.json` | Proxy `/api/*` → `http://localhost:3000` |
| `mock-server/server.js` | Express: POST /api/auth/login, GET /api/dashboard/summary |
| `mock-server/data/users.json` | Test credentials |
| `mock-server/data/dashboard.json` | Mocked KPI + chart data |
| `mock-server/package.json` | express, cors, jsonwebtoken |
| `src/app/app.config.ts` | Angular providers: router, httpClient+interceptor, animations, echarts |
| `src/app/app.routes.ts` | Route definitions: /login, /, /dashboard |
| `src/app/shared/models/invoice.model.ts` | Invoice interface |
| `src/app/shared/models/kpi.model.ts` | User, KpiSummary, DashboardSummary interfaces |
| `src/app/core/auth/auth.service.ts` | login(), logout(), isAuthenticated(), currentUser signal |
| `src/app/core/auth/auth.service.spec.ts` | Unit tests for AuthService |
| `src/app/core/auth/jwt.interceptor.ts` | Functional interceptor: injects Bearer token |
| `src/app/core/auth/auth.guard.ts` | Functional guard: redirects to /login if unauthenticated |
| `src/app/core/auth/auth.guard.spec.ts` | Unit tests for AuthGuard |
| `src/app/core/layout/auth-layout.component.ts` | Centered layout for login page |
| `src/app/core/layout/main-layout.component.ts` | Sidebar + topbar layout for protected pages |
| `src/app/features/login/login.component.ts` | Login form (PrimeNG), calls AuthService |
| `src/app/features/login/login.component.spec.ts` | Unit tests for LoginComponent |
| `src/app/features/home/home.component.ts` | Home page (welcome, quick links) |
| `src/app/features/dashboard/dashboard.service.ts` | GET /api/dashboard/summary → DashboardSummary |
| `src/app/features/dashboard/dashboard.service.spec.ts` | Unit tests for DashboardService |
| `src/app/features/dashboard/dashboard.component.ts` | Orchestrates KPI cards + charts |
| `src/app/features/dashboard/components/kpi-card.component.ts` | Reusable KPI card (@Input: title, value, variation) |
| `src/app/features/dashboard/components/kpi-card.component.spec.ts` | Unit tests for KpiCardComponent |
| `src/app/features/dashboard/components/revenue-chart.component.ts` | Line chart: CA 12 months (@Input: series data) |
| `src/app/features/dashboard/components/status-donut.component.ts` | Donut chart: invoice status distribution |
| `src/app/features/dashboard/components/comparison-bar.component.ts` | Stacked bar: invoiced vs collected |

---

## Task 1: Scaffold Angular 17 project and install dependencies

**Files:** `package.json`, `angular.json`, `src/styles.scss`

- [ ] **Step 1: Create Angular project in existing directory**

```bash
cd /home/houssem/projects/facturation
npx -y @angular/cli@17 new facturation --directory . --routing --style=scss --skip-git --defaults
```

If prompted about a non-empty directory, type `y` to proceed.

Expected: `src/`, `angular.json`, `package.json` created. Final message: "✓ Packages installed successfully."

- [ ] **Step 2: Install UI and charting dependencies**

```bash
npm install primeng@17 primeicons primeflex ngx-echarts@17 echarts
```

Expected: packages added to `node_modules/`, no peer dependency errors.

- [ ] **Step 3: Install auth dependency**

```bash
npm install jwt-decode@4
```

- [ ] **Step 4: Add PrimeNG styles to angular.json**

In `angular.json`, find `"styles"` under `projects.facturation.architect.build.options` and replace its value with:

```json
"styles": [
  "node_modules/primeng/resources/themes/lara-dark-blue/theme.css",
  "node_modules/primeng/resources/primeng.min.css",
  "node_modules/primeicons/primeicons.css",
  "node_modules/primeflex/primeflex.css",
  "src/styles.scss"
]
```

Then add the same list to `projects.facturation.architect.test.options.styles`.

- [ ] **Step 5: Verify project compiles**

```bash
ng build --configuration development 2>&1 | tail -5
```

Expected: `Build at: ... - Hash: ... - Time: ...ms` with no errors.

- [ ] **Step 6: Initialize git and commit**

```bash
git init
git add .
git commit -m "feat: scaffold Angular 17 with PrimeNG, ngx-echarts, jwt-decode"
```

---

## Task 2: Setup Express mock server

**Files:** `mock-server/package.json`, `mock-server/server.js`, `mock-server/data/users.json`, `mock-server/data/dashboard.json`

- [ ] **Step 1: Create mock-server/package.json**

```json
{
  "name": "facturation-mock-server",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2"
  }
}
```

- [ ] **Step 2: Install mock server dependencies**

```bash
cd mock-server && npm install && cd ..
```

- [ ] **Step 3: Create mock-server/data/users.json**

```json
[
  {
    "id": "1",
    "email": "admin@facturation.dev",
    "password": "password123",
    "name": "Admin User",
    "role": "admin"
  }
]
```

- [ ] **Step 4: Create mock-server/data/dashboard.json**

```json
{
  "kpis": {
    "invoicesCount": 47,
    "invoicesCountVariation": 12,
    "totalAmountHT": 128450.00,
    "totalAmountVariation": 8.5,
    "pendingAmount": 34200.00,
    "pendingCount": 11,
    "overdueAmount": 9800.00,
    "overdueCount": 3
  },
  "revenueSeries": [
    { "month": "Juin 2025", "amount": 95000 },
    { "month": "Juil 2025", "amount": 87000 },
    { "month": "Août 2025", "amount": 72000 },
    { "month": "Sept 2025", "amount": 105000 },
    { "month": "Oct 2025", "amount": 118000 },
    { "month": "Nov 2025", "amount": 99000 },
    { "month": "Déc 2025", "amount": 143000 },
    { "month": "Jan 2026", "amount": 110000 },
    { "month": "Fév 2026", "amount": 98000 },
    { "month": "Mar 2026", "amount": 125000 },
    { "month": "Avr 2026", "amount": 132000 },
    { "month": "Mai 2026", "amount": 128450 }
  ],
  "statusDistribution": [
    { "status": "Payée", "count": 28 },
    { "status": "En attente", "count": 11 },
    { "status": "En retard", "count": 3 },
    { "status": "Émise", "count": 5 }
  ],
  "comparisonSeries": [
    { "month": "Jan", "invoiced": 110000, "collected": 95000 },
    { "month": "Fév", "invoiced": 98000, "collected": 88000 },
    { "month": "Mar", "invoiced": 125000, "collected": 118000 },
    { "month": "Avr", "invoiced": 132000, "collected": 124000 },
    { "month": "Mai", "invoiced": 128450, "collected": 89000 }
  ]
}
```

- [ ] **Step 5: Create mock-server/server.js**

```javascript
const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const users = require('./data/users.json')
const dashboardData = require('./data/dashboard.json')

const app = express()
const SECRET = 'facturation-dev-secret-2026'
const PORT = 3000

app.use(cors({ origin: 'http://localhost:4200' }))
app.use(express.json())

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body
  const user = users.find(u => u.email === email && u.password === password)
  if (!user) {
    return res.status(401).json({ message: 'Email ou mot de passe incorrect' })
  }
  const { password: _pw, ...userPayload } = user
  const token = jwt.sign(userPayload, SECRET, { expiresIn: '8h' })
  res.json({ token })
})

app.get('/api/dashboard/summary', (req, res) => {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Non autorisé' })
  }
  try {
    jwt.verify(auth.split(' ')[1], SECRET)
    res.json(dashboardData)
  } catch {
    res.status(401).json({ message: 'Token invalide ou expiré' })
  }
})

app.listen(PORT, () => console.log(`Mock server running on http://localhost:${PORT}`))
```

- [ ] **Step 6: Verify mock server starts and login works**

In one terminal:
```bash
node mock-server/server.js
```
Expected: `Mock server running on http://localhost:3000`

In another terminal:
```bash
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@facturation.dev","password":"password123"}'
```
Expected: `{"token":"eyJ..."}` — a JWT string.

Stop the server with Ctrl+C.

- [ ] **Step 7: Commit**

```bash
git add mock-server/
git commit -m "feat: add Express mock server with auth and dashboard endpoints"
```

---

## Task 3: Create shared data models

**Files:** `src/app/shared/models/invoice.model.ts`, `src/app/shared/models/kpi.model.ts`

- [ ] **Step 1: Create src/app/shared/models/invoice.model.ts**

```typescript
export interface Invoice {
  id: string
  number: string
  clientName: string
  amountHT: number
  status: 'emise' | 'payee' | 'en_attente' | 'en_retard'
  createdAt: Date
  dueDate: Date
}
```

- [ ] **Step 2: Create src/app/shared/models/kpi.model.ts**

```typescript
export interface User {
  id: string
  email: string
  name: string
  role: string
}

export interface KpiSummary {
  invoicesCount: number
  invoicesCountVariation: number
  totalAmountHT: number
  totalAmountVariation: number
  pendingAmount: number
  pendingCount: number
  overdueAmount: number
  overdueCount: number
}

export interface DashboardSummary {
  kpis: KpiSummary
  revenueSeries: { month: string; amount: number }[]
  statusDistribution: { status: string; count: number }[]
  comparisonSeries: { month: string; invoiced: number; collected: number }[]
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/shared/
git commit -m "feat: add shared data models (Invoice, User, KpiSummary, DashboardSummary)"
```

---

## Task 4: Implement AuthService with currentUser signal

**Files:** `src/app/core/auth/auth.service.ts`, `src/app/core/auth/auth.service.spec.ts`

- [ ] **Step 1: Write failing tests**

Create `src/app/core/auth/auth.service.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing'
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { AuthService } from './auth.service'

function makeJwt(payload: object): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  const body = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  return `${header}.${body}.fake-sig`
}

describe('AuthService', () => {
  let service: AuthService
  let httpMock: HttpTestingController

  beforeEach(() => {
    localStorage.clear()
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [AuthService]
    })
    service = TestBed.inject(AuthService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    httpMock.verify()
    localStorage.clear()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('isAuthenticated() returns false when no token in localStorage', () => {
    expect(service.isAuthenticated()).toBeFalse()
  })

  it('currentUser signal is null on init with no token', () => {
    expect(service.currentUser()).toBeNull()
  })

  it('login() stores token and updates currentUser signal', () => {
    const token = makeJwt({
      id: '1', email: 'admin@facturation.dev', name: 'Admin', role: 'admin',
      exp: Math.floor(Date.now() / 1000) + 3600
    })
    let completed = false

    service.login('admin@facturation.dev', 'password123').subscribe(() => {
      completed = true
    })

    const req = httpMock.expectOne('/api/auth/login')
    expect(req.request.method).toBe('POST')
    expect(req.request.body).toEqual({ email: 'admin@facturation.dev', password: 'password123' })
    req.flush({ token })

    expect(completed).toBeTrue()
    expect(localStorage.getItem('token')).toBe(token)
    expect(service.isAuthenticated()).toBeTrue()
    expect(service.currentUser()?.email).toBe('admin@facturation.dev')
  })

  it('logout() clears token and sets currentUser to null', () => {
    localStorage.setItem('token', 'some-token')
    service.logout()
    expect(localStorage.getItem('token')).toBeNull()
    expect(service.currentUser()).toBeNull()
  })

  it('isAuthenticated() returns false for expired token', () => {
    const expiredToken = makeJwt({ id: '1', exp: Math.floor(Date.now() / 1000) - 10 })
    localStorage.setItem('token', expiredToken)
    expect(service.isAuthenticated()).toBeFalse()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
ng test --include src/app/core/auth/auth.service.spec.ts 2>&1 | grep -E "FAILED|ERROR|Cannot find"
```

Expected: errors about `AuthService` not found.

- [ ] **Step 3: Create src/app/core/auth/auth.service.ts**

```typescript
import { Injectable, signal } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Router } from '@angular/router'
import { Observable, map, tap } from 'rxjs'
import { jwtDecode } from 'jwt-decode'
import { User } from '../../shared/models/kpi.model'

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly currentUser = signal<User | null>(null)

  constructor(private http: HttpClient, private router: Router) {
    this._restoreSession()
  }

  login(email: string, password: string): Observable<void> {
    return this.http.post<{ token: string }>('/api/auth/login', { email, password }).pipe(
      tap(({ token }) => {
        localStorage.setItem('token', token)
        this.currentUser.set(jwtDecode<User>(token))
      }),
      map(() => void 0)
    )
  }

  logout(): void {
    localStorage.clear()
    this.currentUser.set(null)
    this.router.navigate(['/login'])
  }

  isAuthenticated(): boolean {
    const token = this.getToken()
    if (!token) return false
    try {
      const { exp } = jwtDecode<{ exp: number }>(token)
      return exp > Math.floor(Date.now() / 1000)
    } catch {
      return false
    }
  }

  getToken(): string | null {
    return localStorage.getItem('token')
  }

  private _restoreSession(): void {
    const token = this.getToken()
    if (token && this.isAuthenticated()) {
      try {
        this.currentUser.set(jwtDecode<User>(token))
      } catch {
        localStorage.clear()
      }
    }
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
ng test --include src/app/core/auth/auth.service.spec.ts 2>&1 | grep -E "SUMMARY|SUCCESS|FAILED"
```

Expected: `5 specs, 0 failures`

- [ ] **Step 5: Commit**

```bash
git add src/app/core/auth/auth.service.ts src/app/core/auth/auth.service.spec.ts
git commit -m "feat: implement AuthService with JWT storage and currentUser signal"
```

---

## Task 5: Implement functional JwtInterceptor

**Files:** `src/app/core/auth/jwt.interceptor.ts`

- [ ] **Step 1: Create src/app/core/auth/jwt.interceptor.ts**

```typescript
import { HttpInterceptorFn } from '@angular/common/http'
import { inject } from '@angular/core'
import { AuthService } from './auth.service'

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getToken()
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    })
  }
  return next(req)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/core/auth/jwt.interceptor.ts
git commit -m "feat: add functional JWT interceptor"
```

---

## Task 6: Implement functional AuthGuard

**Files:** `src/app/core/auth/auth.guard.ts`, `src/app/core/auth/auth.guard.spec.ts`

- [ ] **Step 1: Write failing tests**

Create `src/app/core/auth/auth.guard.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing'
import { Router } from '@angular/router'
import { RouterTestingModule } from '@angular/router/testing'
import { AuthService } from './auth.service'
import { authGuard } from './auth.guard'
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router'

describe('authGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>
  let router: Router

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated'])
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [{ provide: AuthService, useValue: authServiceSpy }]
    })
    router = TestBed.inject(Router)
  })

  it('returns true when authenticated', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true)
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    )
    expect(result).toBeTrue()
  })

  it('returns UrlTree to /login when not authenticated', () => {
    authServiceSpy.isAuthenticated.and.returnValue(false)
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    )
    expect(result).toEqual(router.createUrlTree(['/login']))
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
ng test --include src/app/core/auth/auth.guard.spec.ts 2>&1 | grep -E "FAILED|ERROR|Cannot find"
```

Expected: errors about `authGuard` not found.

- [ ] **Step 3: Create src/app/core/auth/auth.guard.ts**

```typescript
import { inject } from '@angular/core'
import { CanActivateFn, Router } from '@angular/router'
import { AuthService } from './auth.service'

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService)
  const router = inject(Router)
  if (authService.isAuthenticated()) {
    return true
  }
  return router.createUrlTree(['/login'])
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
ng test --include src/app/core/auth/auth.guard.spec.ts 2>&1 | grep -E "SUMMARY|SUCCESS|FAILED"
```

Expected: `2 specs, 0 failures`

- [ ] **Step 5: Commit**

```bash
git add src/app/core/auth/auth.guard.ts src/app/core/auth/auth.guard.spec.ts
git commit -m "feat: add functional AuthGuard redirecting unauthenticated users to /login"
```

---

## Task 7: Configure Angular app (app.config.ts, proxy, app.routes.ts skeleton)

**Files:** `proxy.conf.json`, `angular.json`, `src/app/app.config.ts`, `src/app/app.routes.ts`

- [ ] **Step 1: Create proxy.conf.json**

```json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true
  }
}
```

- [ ] **Step 2: Register proxy in angular.json**

In `angular.json`, under `projects.facturation.architect.serve.options`, add:

```json
"proxyConfig": "proxy.conf.json"
```

- [ ] **Step 3: Update src/app/app.config.ts**

```typescript
import { ApplicationConfig } from '@angular/core'
import { provideRouter } from '@angular/router'
import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { provideAnimations } from '@angular/platform-browser/animations'
import { provideEcharts } from 'ngx-echarts'
import { routes } from './app.routes'
import { jwtInterceptor } from './core/auth/jwt.interceptor'

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor])),
    provideAnimations(),
    provideEcharts(),
  ]
}
```

- [ ] **Step 4: Set src/app/app.routes.ts to empty skeleton**

```typescript
import { Routes } from '@angular/router'

export const routes: Routes = []
```

(Routes will be wired in Task 15 after all components are built.)

- [ ] **Step 5: Verify build still compiles**

```bash
ng build --configuration development 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add proxy.conf.json angular.json src/app/app.config.ts src/app/app.routes.ts
git commit -m "feat: configure Angular providers (http, echarts, animations) and dev proxy"
```

---

## Task 8: Create layout components

**Files:** `src/app/core/layout/auth-layout.component.ts`, `src/app/core/layout/main-layout.component.ts`

- [ ] **Step 1: Create src/app/core/layout/auth-layout.component.ts**

```typescript
import { Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="flex align-items-center justify-content-center min-h-screen surface-ground">
      <div class="surface-card p-5 border-round shadow-2" style="width: 100%; max-width: 420px">
        <router-outlet />
      </div>
    </div>
  `
})
export class AuthLayoutComponent {}
```

- [ ] **Step 2: Create src/app/core/layout/main-layout.component.ts**

```typescript
import { Component, computed } from '@angular/core'
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router'
import { ButtonModule } from 'primeng/button'
import { AuthService } from '../auth/auth.service'

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ButtonModule],
  template: `
    <div class="flex h-screen overflow-hidden">
      <!-- Sidebar -->
      <aside class="surface-card border-right-1 surface-border flex flex-column" style="width: 240px; flex-shrink: 0">
        <div class="p-4 border-bottom-1 surface-border">
          <span class="text-xl font-bold text-primary">Facturation</span>
        </div>
        <nav class="flex flex-column p-2 gap-1 flex-1">
          <a routerLink="/" routerLinkActive="surface-hover"
             [routerLinkActiveOptions]="{exact: true}"
             class="flex align-items-center gap-2 p-3 border-round text-color no-underline hover:surface-hover cursor-pointer">
            <i class="pi pi-home"></i>
            <span>Accueil</span>
          </a>
          <a routerLink="/dashboard" routerLinkActive="surface-hover"
             class="flex align-items-center gap-2 p-3 border-round text-color no-underline hover:surface-hover cursor-pointer">
            <i class="pi pi-chart-bar"></i>
            <span>Tableau de bord</span>
          </a>
        </nav>
        <div class="p-3 border-top-1 surface-border">
          <p-button
            label="Déconnexion"
            icon="pi pi-sign-out"
            [text]="true"
            severity="secondary"
            styleClass="w-full"
            (onClick)="logout()" />
        </div>
      </aside>

      <!-- Main content -->
      <div class="flex flex-column flex-1 overflow-hidden">
        <!-- Topbar -->
        <header class="surface-card border-bottom-1 surface-border flex align-items-center justify-content-end px-4" style="height: 56px; flex-shrink: 0">
          <span class="text-color-secondary text-sm">{{ userName() }}</span>
        </header>
        <main class="flex-1 overflow-auto p-4 surface-ground">
          <router-outlet />
        </main>
      </div>
    </div>
  `
})
export class MainLayoutComponent {
  userName = computed(() => this.authService.currentUser()?.name ?? '')

  constructor(private authService: AuthService) {}

  logout(): void {
    this.authService.logout()
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/core/layout/
git commit -m "feat: add AuthLayout and MainLayout components"
```

---

## Task 9: Implement Login page

**Files:** `src/app/features/login/login.component.ts`, `src/app/features/login/login.component.spec.ts`

- [ ] **Step 1: Write failing tests**

Create `src/app/features/login/login.component.spec.ts`:

```typescript
import { TestBed, ComponentFixture } from '@angular/core/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { of, throwError } from 'rxjs'
import { LoginComponent } from './login.component'
import { AuthService } from '../../core/auth/auth.service'

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>
  let component: LoginComponent
  let authServiceSpy: jasmine.SpyObj<AuthService>

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login'])
    await TestBed.configureTestingModule({
      imports: [LoginComponent, RouterTestingModule],
      providers: [{ provide: AuthService, useValue: authServiceSpy }]
    }).compileComponents()
    fixture = TestBed.createComponent(LoginComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('onSubmit() calls authService.login with form values', () => {
    authServiceSpy.login.and.returnValue(of(void 0))
    component.email = 'admin@facturation.dev'
    component.password = 'password123'
    component.onSubmit()
    expect(authServiceSpy.login).toHaveBeenCalledWith('admin@facturation.dev', 'password123')
  })

  it('onSubmit() sets errorMessage on login failure', () => {
    authServiceSpy.login.and.returnValue(throwError(() => ({ error: { message: 'Email ou mot de passe incorrect' } })))
    component.email = 'bad@test.com'
    component.password = 'wrong'
    component.onSubmit()
    expect(component.errorMessage).toBe('Email ou mot de passe incorrect')
  })

  it('onSubmit() clears errorMessage on login success', () => {
    authServiceSpy.login.and.returnValue(of(void 0))
    component.errorMessage = 'previous error'
    component.email = 'admin@facturation.dev'
    component.password = 'password123'
    component.onSubmit()
    expect(component.errorMessage).toBe('')
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
ng test --include src/app/features/login/login.component.spec.ts 2>&1 | grep -E "FAILED|ERROR|Cannot find"
```

Expected: `Cannot find module './login.component'`

- [ ] **Step 3: Create src/app/features/login/login.component.ts**

```typescript
import { Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Router } from '@angular/router'
import { InputTextModule } from 'primeng/inputtext'
import { PasswordModule } from 'primeng/password'
import { ButtonModule } from 'primeng/button'
import { AuthService } from '../../core/auth/auth.service'

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, InputTextModule, PasswordModule, ButtonModule],
  template: `
    <div class="text-center mb-5">
      <div class="text-3xl font-bold text-primary mb-2">Facturation</div>
      <div class="text-color-secondary">Connectez-vous à votre espace</div>
    </div>

    <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
      <div class="flex flex-column gap-4">
        <div class="flex flex-column gap-2">
          <label for="email" class="font-medium text-sm">Email</label>
          <input
            pInputText
            id="email"
            type="email"
            [(ngModel)]="email"
            name="email"
            placeholder="admin@facturation.dev"
            class="w-full"
            required />
        </div>

        <div class="flex flex-column gap-2">
          <label for="password" class="font-medium text-sm">Mot de passe</label>
          <p-password
            inputId="password"
            [(ngModel)]="password"
            name="password"
            [feedback]="false"
            [toggleMask]="true"
            styleClass="w-full"
            inputStyleClass="w-full"
            required />
        </div>

        @if (errorMessage) {
          <div class="p-3 border-round bg-red-50 text-red-700 text-sm">
            <i class="pi pi-exclamation-circle mr-2"></i>{{ errorMessage }}
          </div>
        }

        <p-button
          type="submit"
          label="Se connecter"
          icon="pi pi-sign-in"
          styleClass="w-full"
          [loading]="loading"
          [disabled]="!email || !password" />
      </div>
    </form>
  `
})
export class LoginComponent {
  email = ''
  password = ''
  errorMessage = ''
  loading = false

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(): void {
    this.loading = true
    this.errorMessage = ''
    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.loading = false
        this.router.navigate(['/dashboard'])
      },
      error: (err) => {
        this.loading = false
        this.errorMessage = err.error?.message ?? 'Une erreur est survenue'
      }
    })
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
ng test --include src/app/features/login/login.component.spec.ts 2>&1 | grep -E "SUMMARY|SUCCESS|FAILED"
```

Expected: `4 specs, 0 failures`

- [ ] **Step 5: Commit**

```bash
git add src/app/features/login/
git commit -m "feat: implement Login page with PrimeNG form and error handling"
```

---

## Task 10: Implement Home page

**Files:** `src/app/features/home/home.component.ts`

- [ ] **Step 1: Create src/app/features/home/home.component.ts**

```typescript
import { Component, inject, computed } from '@angular/core'
import { RouterLink } from '@angular/router'
import { CardModule } from 'primeng/card'
import { ButtonModule } from 'primeng/button'
import { AuthService } from '../../core/auth/auth.service'

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CardModule, ButtonModule],
  template: `
    <div class="mb-5">
      <h1 class="text-3xl font-bold text-color m-0">Bonjour, {{ userName() }}</h1>
      <p class="text-color-secondary mt-2">Bienvenue dans votre module de facturation.</p>
    </div>

    <div class="grid">
      <div class="col-12 md:col-6 lg:col-4">
        <p-card>
          <ng-template pTemplate="header">
            <div class="flex align-items-center gap-3 p-4 pb-0">
              <div class="flex align-items-center justify-content-center border-round surface-100" style="width: 48px; height: 48px">
                <i class="pi pi-chart-bar text-xl text-primary"></i>
              </div>
              <span class="font-semibold text-lg">Tableau de bord</span>
            </div>
          </ng-template>
          <p class="text-color-secondary text-sm m-0">Visualisez la santé financière de votre activité.</p>
          <ng-template pTemplate="footer">
            <p-button label="Ouvrir" icon="pi pi-arrow-right" [text]="true" routerLink="/dashboard" />
          </ng-template>
        </p-card>
      </div>
    </div>
  `
})
export class HomeComponent {
  private authService = inject(AuthService)
  userName = computed(() => this.authService.currentUser()?.name ?? 'Utilisateur')
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/features/home/home.component.ts
git commit -m "feat: implement Home page with welcome message and navigation card"
```

---

## Task 11: Implement KpiCard component

**Files:** `src/app/features/dashboard/components/kpi-card.component.ts`, `src/app/features/dashboard/components/kpi-card.component.spec.ts`

- [ ] **Step 1: Write failing tests**

Create `src/app/features/dashboard/components/kpi-card.component.spec.ts`:

```typescript
import { TestBed, ComponentFixture } from '@angular/core/testing'
import { KpiCardComponent } from './kpi-card.component'

describe('KpiCardComponent', () => {
  let fixture: ComponentFixture<KpiCardComponent>
  let component: KpiCardComponent

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KpiCardComponent]
    }).compileComponents()
    fixture = TestBed.createComponent(KpiCardComponent)
    component = fixture.componentInstance
    component.title = 'Factures émises'
    component.value = '47'
    component.variation = 12
    component.icon = 'pi-file'
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('renders the title', () => {
    const el: HTMLElement = fixture.nativeElement
    expect(el.textContent).toContain('Factures émises')
  })

  it('renders the value', () => {
    const el: HTMLElement = fixture.nativeElement
    expect(el.textContent).toContain('47')
  })

  it('shows positive variation with up arrow', () => {
    const el: HTMLElement = fixture.nativeElement
    expect(el.querySelector('.pi-arrow-up')).toBeTruthy()
  })

  it('shows negative variation with down arrow', () => {
    component.variation = -5
    fixture.detectChanges()
    const el: HTMLElement = fixture.nativeElement
    expect(el.querySelector('.pi-arrow-down')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
ng test --include src/app/features/dashboard/components/kpi-card.component.spec.ts 2>&1 | grep -E "FAILED|ERROR|Cannot find"
```

Expected: `Cannot find module './kpi-card.component'`

- [ ] **Step 3: Create src/app/features/dashboard/components/kpi-card.component.ts**

```typescript
import { Component, Input } from '@angular/core'
import { CommonModule } from '@angular/common'
import { CardModule } from 'primeng/card'

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule, CardModule],
  template: `
    <p-card styleClass="h-full">
      <div class="flex align-items-start justify-content-between">
        <div class="flex flex-column gap-2">
          <span class="text-color-secondary text-sm font-medium uppercase">{{ title }}</span>
          <span class="text-3xl font-bold text-color">{{ value }}</span>
          <div class="flex align-items-center gap-1 text-sm">
            <i class="pi"
               [class.pi-arrow-up]="variation >= 0"
               [class.pi-arrow-down]="variation < 0"
               [class.text-green-500]="variation >= 0"
               [class.text-red-500]="variation < 0"></i>
            <span [class.text-green-500]="variation >= 0" [class.text-red-500]="variation < 0">
              {{ variation >= 0 ? '+' : '' }}{{ variation }}{{ variationUnit }}
            </span>
            <span class="text-color-secondary">{{ subtitle }}</span>
          </div>
        </div>
        <div class="flex align-items-center justify-content-center border-round surface-100"
             style="width: 48px; height: 48px; flex-shrink: 0">
          <i class="pi text-2xl text-primary" [class]="icon"></i>
        </div>
      </div>
    </p-card>
  `
})
export class KpiCardComponent {
  @Input() title = ''
  @Input() value = ''
  @Input() variation = 0
  @Input() variationUnit = ''
  @Input() subtitle = 'vs mois précédent'
  @Input() icon = 'pi-chart-bar'
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
ng test --include src/app/features/dashboard/components/kpi-card.component.spec.ts 2>&1 | grep -E "SUMMARY|SUCCESS|FAILED"
```

Expected: `5 specs, 0 failures`

- [ ] **Step 5: Commit**

```bash
git add src/app/features/dashboard/components/kpi-card.component.ts src/app/features/dashboard/components/kpi-card.component.spec.ts
git commit -m "feat: add reusable KpiCard component with variation indicator"
```

---

## Task 12: Implement DashboardService

**Files:** `src/app/features/dashboard/dashboard.service.ts`, `src/app/features/dashboard/dashboard.service.spec.ts`

- [ ] **Step 1: Write failing tests**

Create `src/app/features/dashboard/dashboard.service.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing'
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { DashboardService } from './dashboard.service'
import { DashboardSummary } from '../../shared/models/kpi.model'

describe('DashboardService', () => {
  let service: DashboardService
  let httpMock: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DashboardService]
    })
    service = TestBed.inject(DashboardService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => httpMock.verify())

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('getSummary() calls GET /api/dashboard/summary and returns data', () => {
    const mockData: DashboardSummary = {
      kpis: {
        invoicesCount: 47, invoicesCountVariation: 12,
        totalAmountHT: 128450, totalAmountVariation: 8.5,
        pendingAmount: 34200, pendingCount: 11,
        overdueAmount: 9800, overdueCount: 3
      },
      revenueSeries: [{ month: 'Jan', amount: 1000 }],
      statusDistribution: [{ status: 'Payée', count: 28 }],
      comparisonSeries: [{ month: 'Jan', invoiced: 1000, collected: 900 }]
    }
    let result: DashboardSummary | undefined
    service.getSummary().subscribe(data => { result = data })
    const req = httpMock.expectOne('/api/dashboard/summary')
    expect(req.request.method).toBe('GET')
    req.flush(mockData)
    expect(result).toEqual(mockData)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
ng test --include src/app/features/dashboard/dashboard.service.spec.ts 2>&1 | grep -E "FAILED|ERROR|Cannot find"
```

Expected: `Cannot find module './dashboard.service'`

- [ ] **Step 3: Create src/app/features/dashboard/dashboard.service.ts**

```typescript
import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { DashboardSummary } from '../../shared/models/kpi.model'

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private http: HttpClient) {}

  getSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>('/api/dashboard/summary')
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
ng test --include src/app/features/dashboard/dashboard.service.spec.ts 2>&1 | grep -E "SUMMARY|SUCCESS|FAILED"
```

Expected: `2 specs, 0 failures`

- [ ] **Step 5: Commit**

```bash
git add src/app/features/dashboard/dashboard.service.ts src/app/features/dashboard/dashboard.service.spec.ts
git commit -m "feat: implement DashboardService calling GET /api/dashboard/summary"
```

---

## Task 13: Implement chart components

**Files:** `src/app/features/dashboard/components/revenue-chart.component.ts`, `src/app/features/dashboard/components/status-donut.component.ts`, `src/app/features/dashboard/components/comparison-bar.component.ts`

- [ ] **Step 1: Create src/app/features/dashboard/components/revenue-chart.component.ts**

```typescript
import { Component, Input, OnChanges } from '@angular/core'
import { NgxEchartsModule } from 'ngx-echarts'
import type { EChartsOption } from 'echarts'

@Component({
  selector: 'app-revenue-chart',
  standalone: true,
  imports: [NgxEchartsModule],
  template: `
    <div echarts [options]="chartOptions" style="height: 280px; width: 100%"></div>
  `
})
export class RevenueChartComponent implements OnChanges {
  @Input() series: { month: string; amount: number }[] = []

  chartOptions: EChartsOption = {}

  ngOnChanges(): void {
    this.chartOptions = {
      tooltip: { trigger: 'axis', formatter: (params: any) => `${params[0].name}<br/>CA : ${params[0].value.toLocaleString('fr-FR')} €` },
      xAxis: { type: 'category', data: this.series.map(s => s.month), axisLabel: { rotate: 30, fontSize: 11 } },
      yAxis: { type: 'value', axisLabel: { formatter: (v: number) => `${(v / 1000).toFixed(0)}k €` } },
      series: [{
        type: 'line',
        data: this.series.map(s => s.amount),
        smooth: true,
        areaStyle: { opacity: 0.15 },
        lineStyle: { width: 2 }
      }],
      grid: { left: '10%', right: '4%', bottom: '15%', top: '8%' }
    }
  }
}
```

- [ ] **Step 2: Create src/app/features/dashboard/components/status-donut.component.ts**

```typescript
import { Component, Input, OnChanges } from '@angular/core'
import { NgxEchartsModule } from 'ngx-echarts'
import type { EChartsOption } from 'echarts'

@Component({
  selector: 'app-status-donut',
  standalone: true,
  imports: [NgxEchartsModule],
  template: `
    <div echarts [options]="chartOptions" style="height: 280px; width: 100%"></div>
  `
})
export class StatusDonutComponent implements OnChanges {
  @Input() distribution: { status: string; count: number }[] = []

  chartOptions: EChartsOption = {}

  ngOnChanges(): void {
    this.chartOptions = {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { orient: 'vertical', right: '5%', top: 'center' },
      series: [{
        type: 'pie',
        radius: ['45%', '75%'],
        center: ['35%', '50%'],
        data: this.distribution.map(d => ({ name: d.status, value: d.count })),
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } }
      }]
    }
  }
}
```

- [ ] **Step 3: Create src/app/features/dashboard/components/comparison-bar.component.ts**

```typescript
import { Component, Input, OnChanges } from '@angular/core'
import { NgxEchartsModule } from 'ngx-echarts'
import type { EChartsOption } from 'echarts'

@Component({
  selector: 'app-comparison-bar',
  standalone: true,
  imports: [NgxEchartsModule],
  template: `
    <div echarts [options]="chartOptions" style="height: 280px; width: 100%"></div>
  `
})
export class ComparisonBarComponent implements OnChanges {
  @Input() series: { month: string; invoiced: number; collected: number }[] = []

  chartOptions: EChartsOption = {}

  ngOnChanges(): void {
    this.chartOptions = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['Facturé', 'Encaissé'], bottom: 0 },
      xAxis: { type: 'category', data: this.series.map(s => s.month) },
      yAxis: { type: 'value', axisLabel: { formatter: (v: number) => `${(v / 1000).toFixed(0)}k €` } },
      series: [
        {
          name: 'Facturé',
          type: 'bar',
          stack: 'total',
          data: this.series.map(s => s.invoiced)
        },
        {
          name: 'Encaissé',
          type: 'bar',
          stack: 'total',
          data: this.series.map(s => s.collected)
        }
      ],
      grid: { left: '10%', right: '4%', bottom: '15%', top: '8%' }
    }
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/features/dashboard/components/revenue-chart.component.ts \
        src/app/features/dashboard/components/status-donut.component.ts \
        src/app/features/dashboard/components/comparison-bar.component.ts
git commit -m "feat: add Revenue, StatusDonut and ComparisonBar chart components (ngx-echarts)"
```

---

## Task 14: Assemble Dashboard page

**Files:** `src/app/features/dashboard/dashboard.component.ts`

- [ ] **Step 1: Create src/app/features/dashboard/dashboard.component.ts**

```typescript
import { Component, OnInit, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { CardModule } from 'primeng/card'
import { ProgressSpinnerModule } from 'primeng/progressspinner'
import { DashboardService } from './dashboard.service'
import { DashboardSummary } from '../../shared/models/kpi.model'
import { KpiCardComponent } from './components/kpi-card.component'
import { RevenueChartComponent } from './components/revenue-chart.component'
import { StatusDonutComponent } from './components/status-donut.component'
import { ComparisonBarComponent } from './components/comparison-bar.component'

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, CardModule, ProgressSpinnerModule,
    KpiCardComponent, RevenueChartComponent, StatusDonutComponent, ComparisonBarComponent
  ],
  template: `
    <h2 class="text-2xl font-bold text-color mt-0 mb-4">Tableau de bord</h2>

    @if (loading()) {
      <div class="flex justify-content-center align-items-center" style="height: 300px">
        <p-progressSpinner />
      </div>
    }

    @if (error()) {
      <div class="p-4 border-round bg-red-50 text-red-700">
        <i class="pi pi-exclamation-circle mr-2"></i>{{ error() }}
      </div>
    }

    @if (summary(); as data) {
      <!-- KPI Cards -->
      <div class="grid mb-4">
        <div class="col-12 sm:col-6 lg:col-3">
          <app-kpi-card
            title="Factures émises"
            [value]="data.kpis.invoicesCount.toString()"
            [variation]="data.kpis.invoicesCountVariation"
            variationUnit=""
            icon="pi-file"
            subtitle="vs mois précédent" />
        </div>
        <div class="col-12 sm:col-6 lg:col-3">
          <app-kpi-card
            title="Montant total HT"
            [value]="fmtCurrency(data.kpis.totalAmountHT)"
            [variation]="data.kpis.totalAmountVariation"
            variationUnit="%"
            icon="pi-euro"
            subtitle="ce mois" />
        </div>
        <div class="col-12 sm:col-6 lg:col-3">
          <app-kpi-card
            title="En attente"
            [value]="fmtCurrency(data.kpis.pendingAmount)"
            [variation]="data.kpis.pendingCount"
            variationUnit=" factures"
            icon="pi-clock"
            subtitle="en attente" />
        </div>
        <div class="col-12 sm:col-6 lg:col-3">
          <app-kpi-card
            title="En retard"
            [value]="fmtCurrency(data.kpis.overdueAmount)"
            [variation]="data.kpis.overdueCount"
            variationUnit=" factures"
            icon="pi-exclamation-triangle"
            subtitle="en retard" />
        </div>
      </div>

      <!-- Charts -->
      <div class="grid">
        <div class="col-12 lg:col-8">
          <p-card header="Évolution du CA (12 mois)">
            <app-revenue-chart [series]="data.revenueSeries" />
          </p-card>
        </div>
        <div class="col-12 lg:col-4">
          <p-card header="Répartition par statut">
            <app-status-donut [distribution]="data.statusDistribution" />
          </p-card>
        </div>
        <div class="col-12">
          <p-card header="Facturé vs Encaissé">
            <app-comparison-bar [series]="data.comparisonSeries" />
          </p-card>
        </div>
      </div>
    }
  `
})
export class DashboardComponent implements OnInit {
  summary = signal<DashboardSummary | null>(null)
  loading = signal(true)
  error = signal('')

  private currencyFormatter = new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0
  })

  fmtCurrency(value: number): string {
    return this.currencyFormatter.format(value)
  }

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.dashboardService.getSummary().subscribe({
      next: (data) => {
        this.summary.set(data)
        this.loading.set(false)
      },
      error: () => {
        this.error.set('Impossible de charger les données du tableau de bord.')
        this.loading.set(false)
      }
    })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/features/dashboard/dashboard.component.ts
git commit -m "feat: implement Dashboard page assembling KPI cards and charts"
```

---

## Task 15: Wire routes and smoke test

**Files:** `src/app/app.routes.ts`, `src/app/app.component.ts`

- [ ] **Step 1: Update src/app/app.component.ts**

Replace the generated AppComponent with a minimal router host:

```typescript
import { Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`
})
export class AppComponent {}
```

- [ ] **Step 2: Update src/app/app.routes.ts with all routes**

```typescript
import { Routes } from '@angular/router'
import { authGuard } from './core/auth/auth.guard'
import { AuthLayoutComponent } from './core/layout/auth-layout.component'
import { MainLayoutComponent } from './core/layout/main-layout.component'

export const routes: Routes = [
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent)
      }
    ]
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      }
    ]
  },
  { path: '**', redirectTo: '' }
]
```

- [ ] **Step 3: Build to verify no compilation errors**

```bash
ng build --configuration development 2>&1 | tail -10
```

Expected: build succeeds with no errors.

- [ ] **Step 4: Run all unit tests**

```bash
ng test --watch=false 2>&1 | grep -E "SUMMARY|specs|failures"
```

Expected: all specs pass, 0 failures.

- [ ] **Step 5: Remove generated AppComponent spec**

```bash
rm src/app/app.component.spec.ts
```

- [ ] **Step 6: Smoke test in browser**

Open two terminals:

Terminal 1:
```bash
node mock-server/server.js
```

Terminal 2:
```bash
ng serve
```

Then open `http://localhost:4200` in a browser.

Expected flow:
1. Redirected to `/login`
2. Enter `admin@facturation.dev` / `password123` → lands on Home page
3. Navigate to `/dashboard` → KPI cards and 3 charts load with mocked data
4. Click "Déconnexion" → redirected to `/login`
5. Navigating to `http://localhost:4200/dashboard` directly → redirected to `/login`

- [ ] **Step 7: Final commit**

```bash
git add src/app/app.routes.ts src/app/app.component.ts
git commit -m "feat: wire all routes with lazy loading and AuthGuard protection"
```
