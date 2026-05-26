# Design Spec — Create Client API Integration

**Date :** 2026-05-20
**Scope :** Câbler le bouton "Enregistrer client" sur `POST /api/clients` via json-server

---

## 1. Architecture

**Approche retenue : json-server (Option A)**

Le proxy Angular existant (`/api → localhost:3000`) est réutilisé sans modification.
json-server expose automatiquement `POST /api/clients` et persiste les données dans `mock/db.json`.

```
NewClientComponent
  → ClientService.create(dto): Observable<Client>
      → HttpClient POST /api/clients
          → proxy.conf.json
              → json-server :3000
                  → mock/db.json (persistence)
```

---

## 2. Modèle de données

### `shared/models/client.model.ts`

```ts
export interface ClientContact {
  fullName: string
  email: string
  phone: string
}

export interface ClientAddress {
  street: string
  city: string
  postalCode: string
  country: string
}

export interface ClientFinancial {
  taxId: string
  currency: 'EUR' | 'GBP' | 'USD' | 'CHF'
  paymentTerms: 'Net 15' | 'Net 30' | 'Net 45' | 'Net 60' | 'Immédiat'
}

export interface CreateClientDto {
  companyName: string
  website: string
  contact: ClientContact
  billingAddress: ClientAddress
  financial: ClientFinancial
}

export interface Client extends CreateClientDto {
  id: string
  reference: string
  createdAt: string
}
```

**Note :** La référence `CUST-YYYY-XXXX` est générée par json-server via un middleware, pas par le composant.

---

## 3. ClientService

**Fichier :** `src/app/features/clients/client.service.ts`

- `providedIn: 'root'`
- Injecte `HttpClient`
- Une seule méthode publique : `create(dto: CreateClientDto): Observable<Client>`
- URL : `/api/clients`
- Pas de gestion d'erreur dans le service — délégué au composant

---

## 4. Middleware json-server (génération de référence)

**Fichier :** `mock/middleware.js`

Intercept `POST /clients` pour injecter `reference` et `createdAt` avant persistence :

```js
module.exports = (req, res, next) => {
  if (req.method === 'POST' && req.path === '/clients') {
    const year = new Date().getFullYear()
    const rand = Math.floor(Math.random() * 9000) + 1000
    req.body.reference = `CUST-${year}-${rand}`
    req.body.createdAt = new Date().toISOString()
  }
  next()
}
```

---

## 5. Comportement du composant `NewClientComponent`

### États ajoutés

| Signal | Type | Rôle |
|---|---|---|
| `loading` | `signal(false)` | Désactive le bouton pendant l'appel |
| `errorMsg` | `signal('')` | Affiche un message d'erreur inline |

### Flux `save()`

```
1. loading.set(true), errorMsg.set('')
2. Construire CreateClientDto depuis les signals
3. clientService.create(dto).subscribe({
     next:  () => router.navigate(['/customers']),
     error: (e) => { errorMsg.set(e?.error?.message ?? 'Une erreur est survenue. Veuillez réessayer.'); loading.set(false) }
   })
```

### Template — changements

- Bouton Save : désactivé si `loading()`, texte "Enregistrement..." pendant l'appel
- Paragraphe d'erreur rouge sous le bouton Save, visible si `errorMsg()`

---

## 6. Setup json-server

### Fichiers à créer

**`mock/db.json`** — seed initial avec un client exemple
**`mock/routes.json`** — `{ "/api/*": "/$1" }`
**`mock/middleware.js`** — injection de `reference` et `createdAt`

### Script `package.json`

```json
"mock": "json-server --watch mock/db.json --routes mock/routes.json --middlewares mock/middleware.js --port 3000"
```

---

## 7. Ce qui n'est PAS dans ce scope

- Validation côté formulaire (champs obligatoires) — sera une tâche séparée
- Gestion du 409 Conflict (taxId dupliqué) — json-server ne le supporte pas nativement
- Liste clients mise à jour en temps réel après création — hors scope

---

## 8. Fichiers impactés

| Fichier | Action |
|---|---|
| `src/app/shared/models/client.model.ts` | Créer |
| `src/app/features/clients/client.service.ts` | Créer |
| `src/app/features/clients/new-client/new-client.component.ts` | Modifier |
| `src/app/features/clients/new-client/new-client.component.html` | Modifier |
| `mock/db.json` | Créer |
| `mock/routes.json` | Créer |
| `mock/middleware.js` | Créer |
| `package.json` | Modifier (script mock) |
