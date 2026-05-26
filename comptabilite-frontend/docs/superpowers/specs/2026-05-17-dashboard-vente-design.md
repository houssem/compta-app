# Dashboard Vente — Design Spec

**Date:** 2026-05-17
**Scope:** Sales/Billing dashboard page + authenticated shell layout
**Reference:** `/home/houssem/projects/compta/facturation_doc/Stitch/dashboard_achat/code.html`

---

## 1. Goal

Port the Stitch HTML design faithfully into Angular using the same pattern as existing pages (home, login): plain HTML templates + component-scoped SCSS using CSS custom properties from `styles.scss`. No PrimeNG component tags in templates.

---

## 2. Architecture

### Shell: `MainLayoutComponent`

Wraps **all authenticated pages**. Contains:
- **Top header** (full width, fixed height 56px)
- **Sidebar** (256px, desktop only, hidden on mobile)
- `<router-outlet>` for page content
- **Mobile bottom nav bar**

All future pages (Invoices, Quotes, Bills, etc.) automatically inherit header + sidebar via this layout.

Public pages (Home, Login) are **outside** main-layout and keep their own structure.

### Dashboard: `DashboardComponent`

Page content only — no header or footer of its own. Renders inside `<router-outlet>`.

### Sub-components deleted

`kpi-card`, `revenue-chart`, `status-donut`, `comparison-bar` are removed. Content is inlined in the dashboard template, matching the Stitch structure.

---

## 3. Main Layout

### Header (`main-layout.component.html`)

```
[left]  "Module de facturation" (bold, primary color)
[right] Logout button | notifications icon | settings icon | avatar
```

- White background (`surface-container-lowest`)
- 1px bottom border (`border-subtle`)
- Height: 56px

### Sidebar

Three labeled sections, each with nav links:

**SALES**
- Dashboard (active state shown here)
- Invoices
- Quotes
- Customers

**PURCHASES**
- Dashboard
- Bills
- Suppliers

**GENERAL**
- Reports
- Settings

Active link: `secondary-container` background + primary text + bold
Inactive link: `on-surface-variant` text, hover shows `surface-container` background
Icons: Material Symbols Outlined
Footer of sidebar: "Accounting Suite" branding + copyright

### Mobile Bottom Nav Bar

4 tabs: Dashboard | Invoices | Clients | More
Fixed to bottom, hidden on `md+`

---

## 4. Dashboard Page

### Page Header

```
[left]  h2 "Billing Dashboard" + subtitle
[right] "New Invoice" primary button
```

### KPI Row (4 columns, responsive → 1 col on mobile)

Each card: white surface, 1px border, 4px left color bar, shadow-sm

| Card | Left bar color | Content |
|---|---|---|
| Factures émises | `status-sent` | Count (124), trend +12% |
| Montant total HT | `primary` | Multi-currency (EUR / USD / TND) |
| En attente | `status-pending` | Count (18), avg days pending |
| En retard | `status-overdue` | Multi-currency amounts in error color |

### Charts Row (2/3 + 1/3 on desktop, stacked on mobile)

**Evolution du CA facturé** (2/3):
- ECharts bar chart, 12-month data
- "12 Months" period label top-right
- Styled to match Stitch: primary color bars, border-subtle axes

**Répartition par statut** (1/3):
- ECharts donut chart
- Legend below: Payée / En attente / En retard with counts
- Colors: `status-paid` / `status-pending` / `status-overdue`

### Recent Invoices Table

- Header: "Recent Invoices" + "View All →" link
- Table headers: `label-caps` style on `surface-muted` background
- Columns: Number | Client | Date | Amount (right-aligned) | Status | Actions
- Status badges: `background: status-color/10`, colored text, no border, 2px radius
- Row height: 48px, hover: `surface-muted`
- Actions: `more_vert` icon button

---

## 5. Routing

| Path | Component | Guard |
|---|---|---|
| `/dashboard-vente` | `DashboardVenteComponent` | `authGuard` |
| `/dashboard` | redirect → `/dashboard-vente` | — |

The old `/dashboard` route redirects to `/dashboard-vente` to avoid broken links.

Sidebar "Sales > Dashboard" link points to `/dashboard-vente`. All other sidebar links (Invoices, Quotes, Customers, Bills, Suppliers, Reports, Settings) are **placeholder hrefs** (`#`) — those features are not built yet.

---

## 6. Files Changed

| File | Action |
|---|---|
| `core/layout/main-layout.component.html` | Rewrite |
| `core/layout/main-layout.component.ts` | Add styleUrls, imports |
| `core/layout/main-layout.component.scss` | Create |
| `features/dashboard-vente/dashboard-vente.component.html` | Create (replaces dashboard) |
| `features/dashboard-vente/dashboard-vente.component.ts` | Create |
| `features/dashboard-vente/dashboard-vente.component.scss` | Create |
| `app.routes.ts` | Add `/dashboard-vente` route + `/dashboard` redirect |
| `features/dashboard/components/kpi-card.*` | Delete |
| `features/dashboard/components/revenue-chart.*` | Delete |
| `features/dashboard/components/status-donut.*` | Delete |
| `features/dashboard/components/comparison-bar.*` | Delete |
| `styles.scss` | Verify all CSS vars are present |

---

## 7. CSS Variables Used

All sourced from `styles.scss` — no new tokens needed:

```
--color-primary, --color-on-primary
--color-surface-container-lowest, --color-surface-muted, --color-surface-container
--color-border-subtle, --color-on-surface, --color-on-surface-variant
--color-status-paid, --color-status-pending, --color-status-overdue, --color-status-sent
--color-error
--spacing-gutter, --spacing-margin-desktop
--radius-DEFAULT (4px)
```

---

## 8. Out of Scope

- Achat dashboard (deferred)
- Invoices, Quotes, Customers, Bills, Suppliers, Reports, Settings pages
- Real API data for the table (mock data in component)
- Dark mode
