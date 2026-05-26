# Design — Page "Factures d'achat"

**Date:** 2026-05-23  
**Branche:** feature/FACT-6-achat-invoices

---

## Contexte

Ajouter une page "Factures d'achat" dans l'application Angular 17 de facturation, similaire en design à la page `/invoices` existante mais orientée achat (fournisseur au lieu de client, statuts propres aux achats).

---

## Structure des fichiers

```
src/app/features/purchase-invoices/
  purchase-invoices.component.ts
  purchase-invoices.component.html
  purchase-invoices.component.scss
  purchase-invoice.service.ts
  new-purchase-invoice/
    new-purchase-invoice.component.ts
    new-purchase-invoice.component.html
    new-purchase-invoice.component.scss

src/app/shared/models/
  purchase-invoice.model.ts      ← nouveau modèle
```

---

## Modèle de données

**`purchase-invoice.model.ts`**

```ts
export type PurchaseInvoiceStatus = 'reçue' | 'validée' | 'payée' | 'en retard'

export interface ApiPurchaseInvoice {
  id: number | string
  supplierName: string
  invoiceNumber: string
  issueDate: string
  dueDate: string
  currency: string
  totalTTC: number
  status: PurchaseInvoiceStatus
  createdAt: string
}

export interface StoredPurchaseInvoice {
  id: number | string
  supplierId: string
  supplierName: string
  invoiceNumber: string
  issueDate: string
  dueDate: string
  currency: string
  lineItems: LineItem[]
  internalNotes: string
  status: PurchaseInvoiceStatus
}

export interface CreatePurchaseInvoicePayload {
  supplierId: string
  supplierName: string
  invoiceNumber: string
  issueDate: string
  dueDate: string
  currency: string
  lineItems: LineItem[]
  internalNotes: string
  totalHT: number
  totalTTC: number
  status: PurchaseInvoiceStatus
  createdAt: string
}

export interface LineItem {
  id: number
  description: string
  qty: number
  priceHT: number
  discPct: number
  vatPct: number
}
```

---

## Page liste — `PurchaseInvoicesComponent`

### Route

```
/purchase-invoices
```

### Layout (pas de KPI cards)

1. **Header** — titre "Factures d'achat", sous-titre, bouton "Nouvelle facture" (→ `/purchase-invoice/create`)
Ajouter un autre bouton "Importer Facture" 
2. **Card tableau** :
   - Barre de contrôles : recherche (par nom fournisseur ou code facture) + filtre statut
   - Colonnes : Fournisseur (avatar + nom + code facture), Code facture, Date facture, Montant TTC, Actions
   - États vides, erreur, skeleton loader (3 lignes)
   - Menu contextuel `more_vert` : Modifier → `/purchase-invoice/edit/:id`, Supprimer (confirmation inline)
3. **Pagination** — 5 lignes/page, info "X–Y sur Z", boutons prev/next/numéros

### CSS

Préfixe `pinv-` (purchase invoice) pour toutes les classes, évite les collisions avec `/invoices` (`inv-`). Même design tokens, même patterns visuels.

### State (signals)

```ts
loading = signal(true)
error   = signal('')
allInvoices = signal<PurchaseInvoice[]>([])
searchQuery  = signal('')
statusFilter = signal<PurchaseInvoiceStatus | ''>('')
currentPage  = signal(1)
openMenuId      = signal<string | null>(null)
confirmDeleteId = signal<string | null>(null)
menuAnchorRect  = signal<{ top: number; right: number } | null>(null)
```

### API

```
GET    /api/purchase-invoices       → ApiPurchaseInvoice[]
DELETE /api/purchase-invoices/:id   → void
```

---

## Page formulaire — `NewPurchaseInvoiceComponent`

### Routes

```
/purchase-invoice/create
/purchase-invoice/edit/:id
```

### Champs

- **Sélecteur fournisseur** — modal de sélection (comme le sélecteur client dans `new-invoice`), appelle `GET /api/suppliers`
- Numéro de facture (auto-généré, modifiable) — préfixe `ACH-YYYY-NNNN`
- Date de facture + Date d'échéance
- Devise (depuis `/api/currencies`)
- Lignes d'articles : description, qté, prix HT, remise %, TVA %
- Note interne
- Statut initial : `reçue`

### Totaux

HT / TVA (ventilée par taux) / TTC — identique à `new-invoice`.

### Save

- Création : `POST /api/purchase-invoices`
- Édition : `PUT /api/purchase-invoices/:id`
- Succès → redirect `/purchase-invoices`

---

## Routing (`app.routes.ts`)

Trois nouvelles routes lazy-loaded dans le bloc `MainLayoutComponent` :

```ts
{ path: 'purchase-invoices', loadComponent: () => import('./features/purchase-invoices/purchase-invoices.component').then(m => m.PurchaseInvoicesComponent) },
{ path: 'purchase-invoice/create', loadComponent: () => import('./features/purchase-invoices/new-purchase-invoice/new-purchase-invoice.component').then(m => m.NewPurchaseInvoiceComponent) },
{ path: 'purchase-invoice/edit/:id', loadComponent: () => import('./features/purchase-invoices/new-purchase-invoice/new-purchase-invoice.component').then(m => m.NewPurchaseInvoiceComponent) },
```

---

## Sidebar

Ajouter le lien "Factures d'achat" dans `main-layout.component` dans la section navigation, avec l'icône `shopping_cart` ou `receipt`.

---

## Ce qui est hors scope

- Traductions i18n (les labels seront en français inline, comme les autres pages)
- Tests unitaires
- Export PDF / envoi e-mail (boutons absents du menu contextuel pour les achats)
