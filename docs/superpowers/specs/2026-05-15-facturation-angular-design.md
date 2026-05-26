# Design Spec — Application Angular Facturation

**Date:** 2026-05-15
**Statut:** Approuvé

## Stack technique

| Choix | Technologie |
|---|---|
| Framework | Angular 17+ (standalone components, signals) |
| Package manager | npm |
| Graphiques | Apache ECharts via ngx-echarts |
| UI / Design system | PrimeNG + PrimeFlex |
| Authentification | JWT stateless |
| Mock server | Express.js (Node) |

---

## Architecture

Structure **Core / Features / Shared** :

```
facturation/
└── src/
    └── app/
        ├── core/
        │   ├── auth/
        │   │   ├── auth.service.ts        # login(), logout(), isAuthenticated(), currentUser signal
        │   │   ├── auth.guard.ts          # canActivate → redirige vers /login
        │   │   └── jwt.interceptor.ts     # injecte Authorization: Bearer <token>
        │   └── layout/
        │       ├── main-layout.component.ts    # sidebar + topbar (pages protégées)
        │       └── auth-layout.component.ts    # layout minimaliste (login)
        ├── features/
        │   ├── home/
        │   │   └── home.component.ts
        │   ├── login/
        │   │   └── login.component.ts
        │   └── dashboard/
        │       ├── dashboard.component.ts
        │       └── components/
        │           ├── kpi-card.component.ts
        │           ├── revenue-chart.component.ts    # courbe CA 12 mois
        │           ├── status-donut.component.ts     # donut répartition statuts
        │           └── comparison-bar.component.ts   # barres empilées facturé vs encaissé
        ├── shared/
        │   └── models/
        │       ├── invoice.model.ts
        │       └── kpi.model.ts
        ├── app.routes.ts
        └── app.config.ts
```

**Extensibilité :** ajouter une feature = créer `features/<nom>/` + une route lazy-loadée dans `app.routes.ts`.

---

## Routing

| Route | Layout | Accès | Composant |
|---|---|---|---|
| `/login` | `auth-layout` | Public | `LoginComponent` |
| `/` | `main-layout` | Protégé | `HomeComponent` |
| `/dashboard` | `main-layout` | Protégé | `DashboardComponent` |

Toutes les routes sous `main-layout` sont protégées par `AuthGuard`.

---

## Authentification JWT

### Flux login

```
POST /api/auth/login
    ↓
localStorage.setItem('token', jwt)
    ↓
currentUser.set(jwtDecode(token))   ← signal Angular
    ↓
redirect /dashboard
    ↓
JwtInterceptor  →  Authorization: Bearer <token>  (toutes requêtes HTTP)
AuthGuard       →  isAuthenticated() + vérification exp  (toutes routes protégées)
logout()        →  localStorage.clear() + currentUser.set(null) + redirect /login
```

### Interface publique de AuthService

```typescript
login(email: string, password: string): Observable<void>
logout(): void
isAuthenticated(): boolean
getToken(): string | null
currentUser: Signal<User | null>   // readonly, décodé depuis JWT
```

### Détails

- **Expiration :** `jwtDecode` lit le champ `exp` sans appel serveur. Si expiré → logout automatique.
- **currentUser signal :** évite de décoder le JWT dans chaque composant. Disponible partout dans l'app (header, guards de rôle, affichage conditionnel).
- **Sécurité future :** migration possible vers `httpOnly cookie` sans changer l'interface du service.

---

## Tableau de bord

### KPI Cards

Composant réutilisable `kpi-card` avec `@Input()` pour titre, valeur, variation :

| Card | Valeur | Variation |
|---|---|---|
| Factures émises | Count ce mois | vs mois précédent |
| Montant total HT | Cumul mensuel HT | % évolution |
| En attente | Montant en attente | Nombre de factures |
| En retard | Montant en retard | Nombre de factures |

### Graphiques ngx-echarts

| Composant | Type | Données |
|---|---|---|
| `revenue-chart` | Courbe linéaire | CA sur 12 mois glissants |
| `status-donut` | Donut | Répartition par statut (émise, payée, en attente, en retard) |
| `comparison-bar` | Barres empilées | Facturé vs encaissé par mois |

**Principe :** chaque composant de graphique reçoit ses données via `@Input()` — pas de couplage direct au service.

### DashboardService

Un seul appel API : `GET /api/dashboard/summary` retourne KPIs + séries de données.

### Layout PrimeNG / PrimeFlex

- `p-card` pour les KPI cards
- Grille responsive : 4 colonnes desktop → 2 tablette → 1 mobile
- Graphiques sous les KPIs en ligne de 3 colonnes

---

## Modèles de données

```typescript
// shared/models/invoice.model.ts
export interface Invoice {
  id: string
  number: string
  clientName: string
  amountHT: number
  status: 'emise' | 'payee' | 'en_attente' | 'en_retard'
  createdAt: Date
  dueDate: Date
}

// shared/models/kpi.model.ts
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

export interface User {
  id: string
  email: string
  name: string
  role: string
}
```

---

## Mock Server (Express.js)

Serveur Node léger pour simuler le backend durant le développement UI.

### Structure

```
mock-server/
├── server.js           # express app, écoute sur port 3000
├── data/
│   ├── users.json      # comptes de test (email, password, role)
│   └── dashboard.json  # données mockées KPIs + séries
└── package.json
```

### Endpoints exposés

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/auth/login` | Vérifie credentials, retourne un JWT signé |
| GET | `/api/dashboard/summary` | Retourne KPIs + séries graphiques |

### Détails

- **JWT signé** avec `jsonwebtoken` (secret local) — token valide 8h
- **CORS** activé pour `http://localhost:4200` (Angular dev server)
- **Compte de test :** `admin@facturation.dev` / `password123`
- Lancement : `node mock-server/server.js` (port 3000)
- Angular proxy config (`proxy.conf.json`) : `/api/*` → `http://localhost:3000`

---

## Hors périmètre (v1)

- Backend / API réelle
- Gestion des rôles avancée
- NgRx (ajouté si état partagé complexe émerge)
- Tests e2e
