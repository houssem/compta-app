# Dashboard Vente Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the Stitch dashboard_achat HTML design into an Angular `/dashboard-vente` route with a rebuilt `MainLayoutComponent` shell (header + sidebar) shared by all authenticated pages.

**Architecture:** Plain HTML + component-scoped SCSS using CSS custom properties from `styles.scss` — same pattern as home and login pages. No PrimeNG component tags. The `DashboardVenteComponent` inlines all KPI, chart and table content (no sub-components). `MainLayoutComponent` becomes the authenticated shell for all future pages.

**Tech Stack:** Angular 17 standalone components, ngx-echarts (NgxEchartsModule), Material Symbols Outlined icons, SCSS with CSS custom properties.

---

## File Map

| File | Action |
|---|---|
| `src/app/app.routes.ts` | Add `/dashboard-vente` child route + `/dashboard` redirect |
| `src/app/core/layout/main-layout.component.ts` | Remove ButtonModule import, add styleUrls |
| `src/app/core/layout/main-layout.component.html` | Full rewrite — Stitch header + sidebar |
| `src/app/core/layout/main-layout.component.scss` | Create |
| `src/app/features/dashboard-vente/dashboard-vente.component.ts` | Create |
| `src/app/features/dashboard-vente/dashboard-vente.component.html` | Create |
| `src/app/features/dashboard-vente/dashboard-vente.component.scss` | Create |
| `src/app/features/dashboard/components/kpi-card.component.*` | Delete |
| `src/app/features/dashboard/components/revenue-chart.component.*` | Delete |
| `src/app/features/dashboard/components/status-donut.component.*` | Delete |
| `src/app/features/dashboard/components/comparison-bar.component.*` | Delete |
| `src/app/features/dashboard/dashboard.component.*` | Delete |

`DashboardService` and models stay — the new component imports them from their current paths.

---

## Task 1: Add route + scaffold DashboardVenteComponent

**Files:**
- Modify: `src/app/app.routes.ts`
- Create: `src/app/features/dashboard-vente/dashboard-vente.component.ts`
- Create: `src/app/features/dashboard-vente/dashboard-vente.component.html`
- Create: `src/app/features/dashboard-vente/dashboard-vente.component.scss`

- [ ] **Step 1: Update routes**

Replace the contents of `src/app/app.routes.ts`:

```typescript
import { Routes } from '@angular/router'
import { authGuard } from './core/auth/auth.guard'
import { MainLayoutComponent } from './core/layout/main-layout.component'

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard-vente',
        loadComponent: () =>
          import('./features/dashboard-vente/dashboard-vente.component').then(m => m.DashboardVenteComponent)
      },
      { path: 'dashboard', redirectTo: 'dashboard-vente' }
    ]
  },
  { path: '**', redirectTo: '' }
]
```

- [ ] **Step 2: Create component scaffold**

Create `src/app/features/dashboard-vente/dashboard-vente.component.ts`:

```typescript
import { Component, OnInit, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { NgxEchartsModule } from 'ngx-echarts'
import type { EChartsOption } from 'echarts'
import { DashboardService } from '../dashboard/dashboard.service'
import { DashboardSummary } from '../../shared/models/kpi.model'

@Component({
  selector: 'app-dashboard-vente',
  standalone: true,
  imports: [CommonModule, NgxEchartsModule],
  templateUrl: './dashboard-vente.component.html',
  styleUrls: ['./dashboard-vente.component.scss']
})
export class DashboardVenteComponent implements OnInit {
  summary = signal<DashboardSummary | null>(null)
  loading = signal(true)
  error = signal('')

  revenueChartOptions: EChartsOption = {
    grid: { top: 8, right: 8, bottom: 0, left: 8, containLabel: true },
    xAxis: {
      type: 'category',
      data: ['JAN','FÉV','MAR','AVR','MAI','JUN','JUL','AOÛ','SEP','OCT','NOV','DÉC'],
      axisLine: { lineStyle: { color: '#E2E8F0' } },
      axisTick: { show: false },
      axisLabel: { fontSize: 11, fontWeight: '600', color: '#43474f', fontFamily: 'Inter' }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#E2E8F0' } },
      axisLabel: { fontSize: 11, color: '#43474f', fontFamily: 'Inter',
        formatter: (v: number) => `${(v / 1000).toFixed(0)}k` }
    },
    series: [{
      type: 'bar',
      data: [3200, 4100, 3800, 3100, 4800, 4200, 3900, 5100, 4400, 4700, 5200, 4900],
      itemStyle: { color: '#001e40', borderRadius: [2, 2, 0, 0] },
      barMaxWidth: 32
    }],
    tooltip: {
      trigger: 'axis',
      formatter: (p: any) => `${p[0].name}: €${p[0].value.toLocaleString('fr-FR')}`
    }
  }

  donutChartOptions: EChartsOption = {
    series: [{
      type: 'pie',
      radius: ['52%', '76%'],
      center: ['50%', '50%'],
      label: { show: false },
      emphasis: { scale: false },
      data: [
        { value: 78, name: 'Payée', itemStyle: { color: '#10B981' } },
        { value: 18, name: 'En attente', itemStyle: { color: '#F59E0B' } },
        { value: 12, name: 'En retard', itemStyle: { color: '#EF4444' } }
      ]
    }],
    tooltip: { trigger: 'item', formatter: '{b}: {c}' }
  }

  recentInvoices = [
    { number: 'INV-2023-089', client: 'Acme Corp Dynamics',  date: '24 oct. 2023', amount: '1 250,00 €', status: 'paid',    label: 'Payée' },
    { number: 'INV-2023-090', client: 'Global Logistics Ltd', date: '26 oct. 2023', amount: '840,00 €',   status: 'overdue', label: 'En retard' },
    { number: 'INV-2023-091', client: 'Horizon Ventures',     date: '27 oct. 2023', amount: '3 100,00 €', status: 'pending', label: 'En attente' }
  ]

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.dashboardService.getSummary().subscribe({
      next: (data) => { this.summary.set(data); this.loading.set(false) },
      error: () => { this.error.set('Impossible de charger les données.'); this.loading.set(false) }
    })
  }
}
```

- [ ] **Step 3: Create placeholder template**

Create `src/app/features/dashboard-vente/dashboard-vente.component.html`:

```html
<div class="dv-page">
  <p>Dashboard Vente — placeholder</p>
</div>
```

- [ ] **Step 4: Create placeholder SCSS**

Create `src/app/features/dashboard-vente/dashboard-vente.component.scss`:

```scss
:host { display: block; }
.dv-page { padding: 24px; }
```

- [ ] **Step 5: Verify app builds**

```bash
npm start
```

Open `http://localhost:4200/dashboard-vente` (after login). Expected: placeholder text renders inside the existing sidebar layout. Open `http://localhost:4200/dashboard` — expected: redirects to `/dashboard-vente`.

- [ ] **Step 6: Commit**

```bash
git add src/app/app.routes.ts src/app/features/dashboard-vente/
git commit -m "feat: scaffold DashboardVenteComponent at /dashboard-vente"
```

---

## Task 2: Rebuild MainLayoutComponent

**Files:**
- Modify: `src/app/core/layout/main-layout.component.ts`
- Modify: `src/app/core/layout/main-layout.component.html`
- Create: `src/app/core/layout/main-layout.component.scss`

- [ ] **Step 1: Update component TS**

Replace `src/app/core/layout/main-layout.component.ts`:

```typescript
import { Component, computed } from '@angular/core'
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router'
import { AuthService } from '../auth/auth.service'

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent {
  userName = computed(() => this.authService.currentUser()?.name ?? '')
  userInitial = computed(() => this.userName().charAt(0).toUpperCase())

  constructor(private authService: AuthService) {}

  logout(): void {
    this.authService.logout()
  }
}
```

- [ ] **Step 2: Rewrite HTML template**

Replace `src/app/core/layout/main-layout.component.html`:

```html
<!-- ============================================================
     HEADER (full width, fixed height 56px)
     ============================================================ -->
<header class="layout-header">
  <div class="layout-header__left">
    <span class="layout-header__title">Module de facturation</span>
  </div>
  <div class="layout-header__right">
    <button class="layout-header__logout" (click)="logout()">Logout</button>
    <span class="material-symbols-outlined layout-header__icon">notifications</span>
    <span class="material-symbols-outlined layout-header__icon">settings</span>
    <div class="layout-header__avatar">{{ userInitial() }}</div>
  </div>
</header>

<!-- ============================================================
     BODY: sidebar + main content
     ============================================================ -->
<div class="layout-body">

  <!-- SIDEBAR (desktop only) -->
  <aside class="layout-sidebar">
    <nav class="layout-nav">

      <!-- SALES -->
      <div class="layout-nav__group-label">Sales</div>
      <a routerLink="/dashboard-vente"
         routerLinkActive="layout-nav__link--active"
         class="layout-nav__link">
        <span class="material-symbols-outlined">dashboard</span>
        <span>Dashboard</span>
      </a>
      <a href="#" class="layout-nav__link">
        <span class="material-symbols-outlined">description</span>
        <span>Invoices</span>
      </a>
      <a href="#" class="layout-nav__link">
        <span class="material-symbols-outlined">request_quote</span>
        <span>Quotes</span>
      </a>
      <a href="#" class="layout-nav__link">
        <span class="material-symbols-outlined">group</span>
        <span>Customers</span>
      </a>

      <!-- PURCHASES -->
      <div class="layout-nav__group-label">Purchases</div>
      <a href="#" class="layout-nav__link">
        <span class="material-symbols-outlined">dashboard</span>
        <span>Dashboard</span>
      </a>
      <a href="#" class="layout-nav__link">
        <span class="material-symbols-outlined">receipt_long</span>
        <span>Bills</span>
      </a>
      <a href="#" class="layout-nav__link">
        <span class="material-symbols-outlined">precision_manufacturing</span>
        <span>Suppliers</span>
      </a>

      <!-- GENERAL -->
      <div class="layout-nav__group-label">General</div>
      <a href="#" class="layout-nav__link">
        <span class="material-symbols-outlined">assessment</span>
        <span>Reports</span>
      </a>
      <a href="#" class="layout-nav__link">
        <span class="material-symbols-outlined">settings</span>
        <span>Settings</span>
      </a>

    </nav>

    <div class="layout-sidebar__footer">
      <p class="layout-sidebar__footer-brand">Accounting Suite</p>
      <p class="layout-sidebar__footer-copy">© 2024 Precision Ledger</p>
    </div>
  </aside>

  <!-- MAIN CONTENT -->
  <main class="layout-main">
    <router-outlet />
  </main>

</div>

<!-- ============================================================
     MOBILE BOTTOM NAV (hidden on md+)
     ============================================================ -->
<nav class="layout-bottom-nav">
  <a routerLink="/dashboard-vente" routerLinkActive="layout-bottom-nav__item--active"
     class="layout-bottom-nav__item">
    <span class="material-symbols-outlined">dashboard</span>
    <span>Dash</span>
  </a>
  <a href="#" class="layout-bottom-nav__item">
    <span class="material-symbols-outlined">description</span>
    <span>Invoices</span>
  </a>
  <a href="#" class="layout-bottom-nav__item">
    <span class="material-symbols-outlined">group</span>
    <span>Clients</span>
  </a>
  <a href="#" class="layout-bottom-nav__item">
    <span class="material-symbols-outlined">settings</span>
    <span>More</span>
  </a>
</nav>
```

- [ ] **Step 3: Create SCSS**

Create `src/app/core/layout/main-layout.component.scss`:

```scss
:host {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  font-family: var(--font-family);
  background: var(--color-background);
}

/* ── HEADER ──────────────────────────────────────────────── */
.layout-header {
  height: 56px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-gutter);
  background: var(--color-surface-container-lowest);
  border-bottom: 1px solid var(--color-border-subtle);
  z-index: 70;
}

.layout-header__title {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-primary);
}

.layout-header__right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.layout-header__logout {
  font-family: var(--font-family);
  font-size: 14px;
  font-weight: 700;
  color: var(--color-primary);
  background: transparent;
  border: 1px solid var(--color-primary);
  border-radius: 4px;
  padding: 6px 16px;
  cursor: pointer;
  transition: background 0.15s;

  &:hover { background: var(--color-surface-container-low); }
}

.layout-header__icon {
  font-size: 22px;
  color: var(--color-on-surface-variant);
  cursor: pointer;
  user-select: none;
}

.layout-header__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-primary);
  color: var(--color-on-primary);
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border-subtle);
}

/* ── BODY ────────────────────────────────────────────────── */
.layout-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* ── SIDEBAR ─────────────────────────────────────────────── */
.layout-sidebar {
  width: 256px;
  flex-shrink: 0;
  background: var(--color-surface-container-low);
  border-right: 1px solid var(--color-border-subtle);
  display: none;
  flex-direction: column;
  padding: 16px 0;
  z-index: 60;
  overflow-y: auto;

  @media (min-width: 768px) { display: flex; }
}

.layout-nav { flex: 1; }

.layout-nav__group-label {
  padding: 16px 24px 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(67, 71, 79, 0.6);
}

.layout-nav__link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 24px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-on-surface-variant);
  text-decoration: none;
  transition: background 0.15s, color 0.15s;

  .material-symbols-outlined { font-size: 20px; }

  &:hover { background: var(--color-surface-container); }

  &--active {
    background: var(--color-secondary-container);
    color: var(--color-primary);
    font-weight: 700;
  }
}

.layout-sidebar__footer {
  margin-top: auto;
  padding: 16px 24px;
  border-top: 1px solid var(--color-border-subtle);
}

.layout-sidebar__footer-brand {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-on-surface-variant);
}

.layout-sidebar__footer-copy {
  font-size: 10px;
  color: var(--color-on-surface-variant);
  opacity: 0.6;
  margin-top: 2px;
}

/* ── MAIN ────────────────────────────────────────────────── */
.layout-main {
  flex: 1;
  overflow-y: auto;
  background: var(--color-background);
}

/* ── MOBILE BOTTOM NAV ───────────────────────────────────── */
.layout-bottom-nav {
  display: flex;
  justify-content: space-around;
  padding: 8px 0;
  background: var(--color-surface-container-low);
  border-top: 1px solid var(--color-border-subtle);
  z-index: 50;

  @media (min-width: 768px) { display: none; }
}

.layout-bottom-nav__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  color: var(--color-on-surface-variant);
  text-decoration: none;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;

  .material-symbols-outlined { font-size: 22px; }

  &--active { color: var(--color-primary); }
}
```

- [ ] **Step 4: Verify layout renders correctly**

```bash
npm start
```

Navigate to `/dashboard-vente`. Expected: white header with "Module de facturation" + Logout button + icons; sidebar with Sales/Purchases/General sections; "Dashboard Vente — placeholder" in main area; Sales > Dashboard link is highlighted.

- [ ] **Step 5: Commit**

```bash
git add src/app/core/layout/
git commit -m "feat: rebuild MainLayoutComponent with Stitch header and sidebar"
```

---

## Task 3: Dashboard page header + KPI cards

**Files:**
- Modify: `src/app/features/dashboard-vente/dashboard-vente.component.html`
- Modify: `src/app/features/dashboard-vente/dashboard-vente.component.scss`

- [ ] **Step 1: Write the full HTML**

Replace `src/app/features/dashboard-vente/dashboard-vente.component.html`:

```html
<div class="dv-page">
  <div class="dv-content">

    <!-- ── PAGE HEADER ─────────────────────────────────── -->
    <div class="dv-page-header">
      <div>
        <h2 class="dv-page-title">Billing Dashboard</h2>
        <p class="dv-page-subtitle">Aperçu en temps réel de votre activité de facturation.</p>
      </div>
      <button class="dv-btn-primary">
        <span class="material-symbols-outlined">add</span>
        Nouvelle facture
      </button>
    </div>

    <!-- ── KPI ROW ─────────────────────────────────────── -->
    <div class="dv-kpi-row">

      <!-- Factures émises -->
      <div class="dv-kpi-card">
        <div class="dv-kpi-card__bar dv-kpi-card__bar--sent"></div>
        <p class="dv-kpi-card__label">Factures émises</p>
        <p class="dv-kpi-card__value">{{ summary()?.totalInvoices ?? 124 }}</p>
        <div class="dv-kpi-card__trend dv-kpi-card__trend--up">
          <span class="material-symbols-outlined">trending_up</span>
          <span>+12% ce mois</span>
        </div>
      </div>

      <!-- Montant total HT -->
      <div class="dv-kpi-card">
        <div class="dv-kpi-card__bar dv-kpi-card__bar--primary"></div>
        <p class="dv-kpi-card__label">Montant total HT</p>
        <div class="dv-kpi-card__multicurrency">
          <p><span class="dv-kpi-card__currency-label">EUR</span> €42,8k</p>
          <p><span class="dv-kpi-card__currency-label">USD</span> $45,2k</p>
          <p><span class="dv-kpi-card__currency-label">TND</span> 140,5k DT</p>
        </div>
        <div class="dv-kpi-card__trend">
          <span>Tous comptes</span>
        </div>
      </div>

      <!-- En attente -->
      <div class="dv-kpi-card">
        <div class="dv-kpi-card__bar dv-kpi-card__bar--pending"></div>
        <p class="dv-kpi-card__label">En attente</p>
        <p class="dv-kpi-card__value">{{ summary()?.pendingCount ?? 18 }}</p>
        <div class="dv-kpi-card__trend dv-kpi-card__trend--pending">
          <span class="material-symbols-outlined">schedule</span>
          <span>Moy. 4 jours</span>
        </div>
      </div>

      <!-- En retard -->
      <div class="dv-kpi-card">
        <div class="dv-kpi-card__bar dv-kpi-card__bar--overdue"></div>
        <p class="dv-kpi-card__label">En retard</p>
        <div class="dv-kpi-card__multicurrency dv-kpi-card__multicurrency--error">
          <p><span class="dv-kpi-card__currency-label">EUR</span> €4,2k</p>
          <p><span class="dv-kpi-card__currency-label">USD</span> $1,1k</p>
          <p><span class="dv-kpi-card__currency-label">TND</span> 3,4k DT</p>
        </div>
        <div class="dv-kpi-card__trend dv-kpi-card__trend--overdue">
          <span class="material-symbols-outlined">warning</span>
          <span>Action requise</span>
        </div>
      </div>

    </div><!-- /dv-kpi-row -->

    <!-- ── CHARTS ROW ───────────────────────────────────── -->
    <div class="dv-charts-row">

      <!-- Revenue bar chart (2/3) -->
      <div class="dv-card dv-chart-revenue">
        <div class="dv-card__header">
          <h3 class="dv-card__title">Évolution du CA facturé</h3>
          <span class="dv-period-badge">12 Mois</span>
        </div>
        <div echarts [options]="revenueChartOptions" class="dv-chart-canvas"></div>
      </div>

      <!-- Status donut (1/3) -->
      <div class="dv-card dv-chart-donut">
        <h3 class="dv-card__title">Répartition par statut</h3>
        <div echarts [options]="donutChartOptions" class="dv-donut-canvas"></div>
        <div class="dv-donut-legend">
          <div class="dv-donut-legend__item">
            <span class="dv-donut-legend__dot dv-donut-legend__dot--paid"></span>
            <span class="dv-donut-legend__name">Payée</span>
            <span class="dv-donut-legend__count">78</span>
          </div>
          <div class="dv-donut-legend__item">
            <span class="dv-donut-legend__dot dv-donut-legend__dot--pending"></span>
            <span class="dv-donut-legend__name">En attente</span>
            <span class="dv-donut-legend__count">18</span>
          </div>
          <div class="dv-donut-legend__item">
            <span class="dv-donut-legend__dot dv-donut-legend__dot--overdue"></span>
            <span class="dv-donut-legend__name">En retard</span>
            <span class="dv-donut-legend__count">12</span>
          </div>
        </div>
      </div>

    </div><!-- /dv-charts-row -->

    <!-- ── RECENT INVOICES TABLE ─────────────────────────── -->
    <div class="dv-card dv-table-card">
      <div class="dv-table-card__header">
        <h3 class="dv-card__title">Factures récentes</h3>
        <a href="#" class="dv-table-card__view-all">
          Voir tout <span class="material-symbols-outlined">arrow_forward</span>
        </a>
      </div>
      <div class="dv-table-wrapper">
        <table class="dv-table">
          <thead>
            <tr>
              <th>Numéro</th>
              <th>Client</th>
              <th>Date</th>
              <th class="dv-table__cell--right">Montant</th>
              <th>Statut</th>
              <th class="dv-table__cell--center">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (inv of recentInvoices; track inv.number) {
              <tr class="dv-table__row">
                <td class="dv-table__cell--number">{{ inv.number }}</td>
                <td>{{ inv.client }}</td>
                <td>{{ inv.date }}</td>
                <td class="dv-table__cell--right dv-table__cell--mono">{{ inv.amount }}</td>
                <td>
                  <span class="dv-badge dv-badge--{{ inv.status }}">{{ inv.label }}</span>
                </td>
                <td class="dv-table__cell--center">
                  <button class="dv-table__action-btn">
                    <span class="material-symbols-outlined">more_vert</span>
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div><!-- /dv-table-card -->

  </div>
</div>
```

- [ ] **Step 2: Write the full SCSS**

Replace `src/app/features/dashboard-vente/dashboard-vente.component.scss`:

```scss
:host {
  display: block;
  background: var(--color-background);
  font-family: var(--font-family);
}

.dv-page {
  padding: var(--spacing-gutter);
  max-width: 1440px;
  margin: 0 auto;
}

/* ── PAGE HEADER ───────────────────────────────────────── */
.dv-page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: var(--spacing-gutter);
}

.dv-page-title {
  font-size: 24px;
  font-weight: 600;
  line-height: 32px;
  color: var(--color-primary);
  margin-bottom: 4px;
}

.dv-page-subtitle {
  font-size: 14px;
  color: var(--color-on-surface-variant);
}

.dv-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 24px;
  background: var(--color-primary-container);
  color: var(--color-on-primary);
  font-family: var(--font-family);
  font-size: 14px;
  font-weight: 700;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: opacity 0.15s;
  white-space: nowrap;

  .material-symbols-outlined { font-size: 18px; }
  &:hover { opacity: 0.9; }
}

/* ── KPI ROW ───────────────────────────────────────────── */
.dv-kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-gutter);
  margin-bottom: var(--spacing-gutter);

  @media (max-width: 1024px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 600px)  { grid-template-columns: 1fr; }
}

.dv-kpi-card {
  position: relative;
  overflow: hidden;
  background: var(--color-surface-container-lowest);
  border: 1px solid var(--color-border-subtle);
  border-radius: 4px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
}

.dv-kpi-card__bar {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 4px;

  &--sent    { background: var(--color-status-sent); }
  &--primary { background: var(--color-primary); }
  &--pending { background: var(--color-status-pending); }
  &--overdue { background: var(--color-status-overdue); }
}

.dv-kpi-card__label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-on-surface-variant);
  margin-bottom: 8px;
}

.dv-kpi-card__value {
  font-size: 36px;
  font-weight: 700;
  line-height: 44px;
  letter-spacing: -0.02em;
  color: var(--color-primary);
}

.dv-kpi-card__multicurrency {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;

  p {
    font-size: 20px;
    font-weight: 600;
    color: var(--color-primary);
    font-variant-numeric: tabular-nums;
  }

  &--error p { color: var(--color-error); }
}

.dv-kpi-card__currency-label {
  font-size: 14px;
  font-weight: 400;
  color: var(--color-on-surface-variant);
  margin-right: 8px;
}

.dv-kpi-card__trend {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 16px;
  font-size: 13px;
  color: var(--color-on-surface-variant);
  font-variant-numeric: tabular-nums;

  .material-symbols-outlined { font-size: 16px; }

  &--up      { color: var(--color-status-paid); }
  &--pending { color: var(--color-status-pending); }
  &--overdue { color: var(--color-status-overdue); }
}

/* ── CHARTS ROW ────────────────────────────────────────── */
.dv-charts-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--spacing-gutter);
  margin-bottom: var(--spacing-gutter);

  @media (max-width: 900px) { grid-template-columns: 1fr; }
}

/* ── SHARED CARD ───────────────────────────────────────── */
.dv-card {
  background: var(--color-surface-container-lowest);
  border: 1px solid var(--color-border-subtle);
  border-radius: 4px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
}

.dv-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.dv-card__title {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-primary);
}

.dv-period-badge {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 4px 8px;
  background: var(--color-surface-container);
  color: var(--color-on-surface-variant);
  border-radius: 4px;
}

/* ── REVENUE CHART ─────────────────────────────────────── */
.dv-chart-revenue {
  display: flex;
  flex-direction: column;
}

.dv-chart-canvas {
  height: 280px;
  width: 100%;
}

/* ── DONUT CHART ───────────────────────────────────────── */
.dv-chart-donut {
  display: flex;
  flex-direction: column;
}

.dv-donut-canvas {
  height: 200px;
  width: 100%;
}

.dv-donut-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
}

.dv-donut-legend__item {
  display: flex;
  align-items: center;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

.dv-donut-legend__dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
  flex-shrink: 0;

  &--paid    { background: var(--color-status-paid); }
  &--pending { background: var(--color-status-pending); }
  &--overdue { background: var(--color-status-overdue); }
}

.dv-donut-legend__name { flex: 1; color: var(--color-on-surface); }

.dv-donut-legend__count {
  font-weight: 700;
  color: var(--color-on-surface);
}

/* ── TABLE ─────────────────────────────────────────────── */
.dv-table-card {
  padding: 0;
  overflow: hidden;
}

.dv-table-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid var(--color-border-subtle);
}

.dv-table-card__view-all {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 700;
  color: var(--color-primary);
  text-decoration: none;

  .material-symbols-outlined { font-size: 18px; }
  &:hover { text-decoration: underline; }
}

.dv-table-wrapper { overflow-x: auto; }

.dv-table {
  width: 100%;
  border-collapse: collapse;

  thead tr {
    background: var(--color-surface-muted);
  }

  th {
    padding: 12px 24px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--color-on-surface-variant);
    text-align: left;
    white-space: nowrap;
  }

  tbody tr { border-bottom: 1px solid var(--color-border-subtle); }
  tbody tr:last-child { border-bottom: none; }

  td {
    padding: 0 24px;
    height: 48px;
    font-size: 13px;
    color: var(--color-on-surface);
    font-variant-numeric: tabular-nums;
  }
}

.dv-table__row {
  transition: background 0.12s;
  &:hover { background: var(--color-surface-muted); }
}

.dv-table__cell--number { font-weight: 700; }
.dv-table__cell--right  { text-align: right; }
.dv-table__cell--center { text-align: center; }
.dv-table__cell--mono   { font-variant-numeric: tabular-nums; font-weight: 700; }

.dv-table__action-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--color-on-surface-variant);
  display: inline-flex;
  align-items: center;
  padding: 4px;
  border-radius: 4px;
  transition: color 0.12s;

  &:hover { color: var(--color-primary); }
  .material-symbols-outlined { font-size: 20px; }
}

/* ── STATUS BADGES ─────────────────────────────────────── */
.dv-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 2px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  white-space: nowrap;

  &--paid    { background: rgba(16,185,129,.10); color: var(--color-status-paid); }
  &--pending { background: rgba(245,158,11,.10); color: var(--color-status-pending); }
  &--overdue { background: rgba(239,68,68,.10);  color: var(--color-status-overdue); }
  &--sent    { background: rgba(59,130,246,.10); color: var(--color-status-sent); }
  &--draft   { background: rgba(148,163,184,.10); color: var(--color-status-draft); }
}
```

- [ ] **Step 3: Verify full page renders**

```bash
npm start
```

Navigate to `/dashboard-vente`. Expected:
- Page header with "Billing Dashboard" title and "Nouvelle facture" button
- 4 KPI cards with left color bars
- Revenue bar chart + donut chart side by side
- Recent invoices table with colored status badges

- [ ] **Step 4: Commit**

```bash
git add src/app/features/dashboard-vente/
git commit -m "feat: implement dashboard vente — KPI cards, charts, invoices table"
```

---

## Task 4: Delete obsolete components

**Files:**
- Delete: `src/app/features/dashboard/components/kpi-card.component.ts`
- Delete: `src/app/features/dashboard/components/kpi-card.component.html`
- Delete: `src/app/features/dashboard/components/revenue-chart.component.ts`
- Delete: `src/app/features/dashboard/components/revenue-chart.component.html`
- Delete: `src/app/features/dashboard/components/status-donut.component.ts`
- Delete: `src/app/features/dashboard/components/status-donut.component.html`
- Delete: `src/app/features/dashboard/components/comparison-bar.component.ts`
- Delete: `src/app/features/dashboard/components/comparison-bar.component.html`
- Delete: `src/app/features/dashboard/dashboard.component.ts`
- Delete: `src/app/features/dashboard/dashboard.component.html`
- Delete: `src/app/features/dashboard/dashboard.component.scss` (if exists)

- [ ] **Step 1: Delete old dashboard files**

```bash
rm -rf src/app/features/dashboard/components
rm src/app/features/dashboard/dashboard.component.ts
rm src/app/features/dashboard/dashboard.component.html
```

Check for a dashboard.component.scss and remove it too:

```bash
rm -f src/app/features/dashboard/dashboard.component.scss
```

- [ ] **Step 2: Verify build still compiles**

```bash
npm run build
```

Expected: build succeeds with no errors. The `DashboardService` and model files remain in `features/dashboard/` and are still imported by `DashboardVenteComponent`.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove obsolete dashboard sub-components"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Covered in task |
|---|---|
| Port Stitch HTML, plain HTML + SCSS | Tasks 2, 3 |
| Header: logo + logout + icons + avatar | Task 2 |
| Sidebar: Sales/Purchases/General sections | Task 2 |
| Mobile bottom nav | Task 2 |
| `/dashboard-vente` route + `/dashboard` redirect | Task 1 |
| KPI cards with left color bar | Task 3 |
| Multi-currency KPIs (Montant HT, En retard) | Task 3 |
| Revenue bar chart (ECharts, 12 months) | Task 3 |
| Status donut chart + legend | Task 3 |
| Recent invoices table with status badges | Task 3 |
| Delete old sub-components | Task 4 |
| `DashboardService` reused from existing path | Tasks 1, 3 |
| CSS vars from `styles.scss` only | Tasks 2, 3 |

All spec requirements covered. No placeholders or TODOs in plan.
