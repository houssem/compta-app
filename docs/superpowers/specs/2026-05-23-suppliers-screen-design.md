# Suppliers Screen — Design Spec

**Date:** 2026-05-23  
**Branch:** feature/FACT-4-registration-form  
**Approach:** Clone du module clients (Option A)

---

## 1. Modèle de données

### `shared/models/supplier.model.ts`

```ts
interface SupplierContact  { fullName: string; email: string; phone: string }
interface SupplierAddress  { street: string; city: string; postalCode: string; country: string }
interface SupplierFinancial { taxId: string; currency: string; paymentTerms: string }

interface CreateSupplierDto {
  companyName: string
  website: string
  category: string
  contact: SupplierContact
  address: SupplierAddress
  financial: SupplierFinancial
}

interface Supplier extends CreateSupplierDto {
  id: string
  reference: string          // format: SUP-XXXX
  openBalance: number
  lastInvoiceDate: string    // ISO date string
  createdAt: string
}
```

**Catégories** (valeurs fixes, champ select) :
`Informatique` · `Transport` · `Fournitures` · `Services professionnels` · `Télécommunications` · `Autre`

---

## 2. Service

### `features/suppliers/supplier.service.ts`

| Méthode | Endpoint |
|---------|----------|
| `getAll()` | `GET /api/suppliers` |
| `getById(id)` | `GET /api/suppliers/:id` |
| `create(dto)` | `POST /api/suppliers` |
| `update(id, dto)` | `PUT /api/suppliers/:id` |
| `delete(id)` | `DELETE /api/suppliers/:id` |
| `getCountries()` | `GET /api/countries` (partagé) |
| `getCurrencies()` | `GET /api/currencies` (partagé) |
| `getPaymentTerms()` | `GET /api/paymentTerms` (partagé) |

---

## 3. Écran liste — `SuppliersComponent`

**Route :** `/suppliers`  
**Fichiers :** `features/suppliers/suppliers.component.{ts,html,scss}`

### KPI Strip (4 cartes)

| Couleur barre | Métrique | Calcul |
|---------------|----------|--------|
| Vert (`status-paid`) | Total fournisseurs actifs | `allSuppliers().length` |
| Ambre (`status-pending`) | Solde ouvert total (TND) | Somme `openBalance` |
| Rouge (`status-overdue`) | Montant en retard | Somme `openBalance` des fournisseurs avec `lastInvoiceDate` > 30j et solde > 0 |
| Bleu (`status-sent`) | Nouveaux ce mois (30j) | Count `createdAt >= now - 30j` |

### Barre de filtres

Trois onglets locaux (pas d'appel API) :
- **Tous** — aucun filtre supplémentaire
- **En retard** — `openBalance > 0` et dernière facture > 30 jours
- **Priorité haute** — `openBalance > 5000` (seuil initial, peut évoluer)

Icônes export/impression à droite (boutons visuels, non fonctionnels dans cette itération).

### Table

| Colonne | Contenu | Alignement |
|---------|---------|-----------|
| Fournisseur | Avatar initiales + `companyName` (bold) + `reference` (muted) | Gauche |
| Catégorie | Badge `label-caps` fond `secondary-container/30` | Gauche |
| Solde ouvert | Montant TND, `tabular-nums lining-nums` | Droite |
| Devise | `financial.currency` | Gauche |
| Dernière facture | `lastInvoiceDate` formaté `fr-FR` | Gauche |
| Actions | Bouton `⋯` → menu flottant Modifier / Supprimer | Centre |

**Recherche :** filtre sur `companyName`, `contact.fullName`, `contact.email`, `address.city`  
**Pagination :** 6 lignes/page, même logique que `ClientsComponent`  
**États :** loading (skeleton), error, empty (avec icône `inventory_2`)  
**Menu action :** même pattern `position:fixed` avec confirmation de suppression

---

## 4. Formulaire — `NewSupplierComponent`

**Routes :** `/supplier/create` · `/supplier/edit/:id`  
**Fichiers :** `features/suppliers/new-supplier/new-supplier.component.{ts,html,scss}`

### Sections

1. **Informations générales**
   - Raison sociale (requis)
   - Site web (optionnel, validation `optionalUrl`)
   - Catégorie (select requis, valeurs fixes ci-dessus)

2. **Contact principal**
   - Nom complet (requis)
   - Adresse e-mail (requis, validation email)
   - Téléphone (optionnel, validation `optionalPhone`)

3. **Adresse**
   - Rue (requis), Ville (requis), Code postal (requis)
   - Pays (select, chargé via `getCountries()`)

4. **Détails financiers**
   - N° TVA / MF (optionnel)
   - Devise (select, `getCurrencies()`)
   - Conditions de paiement (select, `getPaymentTerms()`)

**Mode edit :** détecté via `route.snapshot.paramMap.get('id')`, pré-remplit le formulaire via `getById()`  
**Retour :** navigation vers `/suppliers` après save ou cancel

---

## 5. Routing

Dans `app.routes.ts`, sous `MainLayoutComponent` (authGuard) :

```ts
{ path: 'suppliers',        loadComponent: () => import('./features/suppliers/suppliers.component').then(m => m.SuppliersComponent) },
{ path: 'supplier/create',  loadComponent: () => import('./features/suppliers/new-supplier/new-supplier.component').then(m => m.NewSupplierComponent) },
{ path: 'supplier/edit/:id',loadComponent: () => import('./features/suppliers/new-supplier/new-supplier.component').then(m => m.NewSupplierComponent) },
```

Le lien `/suppliers` existe déjà dans le sidebar (`main-layout.component.html`).

---

## 6. i18n

Nouvelles clés à ajouter dans `fr.json` et `en.json` :

- `SUPPLIERS.*` — calqué sur `CLIENTS.*` (titre, sous-titre, KPIs, colonnes, états)
- `NEW_SUPPLIER.*` — calqué sur `NEW_CLIENT.*` (labels de sections et champs)

---

## 7. Style

- Préfixe CSS : `sp-` (au lieu de `cl-`) pour éviter les conflits
- `suppliers.component.scss` est un clone de `clients.component.scss` avec le préfixe renommé
- `new-supplier.component.scss` est un clone de `new-client.component.scss`
- Aucun nouveau token de design — toutes les variables `var(--color-*)` existantes sont réutilisées
