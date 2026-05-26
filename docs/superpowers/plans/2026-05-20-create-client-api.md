# Create Client API Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Câbler le bouton "Enregistrer client" sur `POST /api/clients` via json-server, avec persistence dans `mock/db.json` et feedback loading/erreur dans le formulaire.

**Architecture:** json-server tourne sur le port 3000 et est proxifié par Angular via `proxy.conf.json` existant (`/api → localhost:3000`). Un `ClientService` Angular envoie le `POST`, et `NewClientComponent` gère les états `loading`/`errorMsg` avec des signals.

**Tech Stack:** Angular 17 standalone, Angular `HttpClient`, signals, json-server 1.x, Node.js middleware

---

## File Map

| Fichier | Action | Responsabilité |
|---|---|---|
| `src/app/shared/models/client.model.ts` | Créer | Interfaces `Client`, `CreateClientDto` |
| `src/app/features/clients/client.service.ts` | Créer | `create(dto): Observable<Client>` |
| `src/app/features/clients/new-client/new-client.component.ts` | Modifier | Câbler `save()`, ajouter `loading`/`errorMsg` signals |
| `src/app/features/clients/new-client/new-client.component.html` | Modifier | Désactiver bouton pendant loading, afficher erreur |
| `mock/db.json` | Créer | Seed json-server avec un client exemple |
| `mock/routes.json` | Créer | Mapping `/api/*` → `/$1` |
| `mock/middleware.js` | Créer | Injection `reference` et `createdAt` côté serveur |
| `package.json` | Modifier | Ajouter script `mock` |

---

## Task 1 : Modèle `Client`

**Files:**
- Create: `src/app/shared/models/client.model.ts`

- [ ] **Step 1 : Créer le fichier de modèle**

```typescript
// src/app/shared/models/client.model.ts

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

- [ ] **Step 2 : Vérifier que TypeScript compile**

```bash
cd /home/houssem/projects/compta/facturation
npx tsc --noEmit
```

Expected : aucune erreur.

- [ ] **Step 3 : Commit**

```bash
git add src/app/shared/models/client.model.ts
git commit -m "feat(clients): add Client and CreateClientDto models"
```

---

## Task 2 : `ClientService`

**Files:**
- Create: `src/app/features/clients/client.service.ts`

- [ ] **Step 1 : Créer le service**

```typescript
// src/app/features/clients/client.service.ts
import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { Client, CreateClientDto } from '../../shared/models/client.model'

@Injectable({ providedIn: 'root' })
export class ClientService {
  constructor(private http: HttpClient) {}

  create(dto: CreateClientDto): Observable<Client> {
    return this.http.post<Client>('/api/clients', dto)
  }
}
```

- [ ] **Step 2 : Vérifier que TypeScript compile**

```bash
npx tsc --noEmit
```

Expected : aucune erreur.

- [ ] **Step 3 : Commit**

```bash
git add src/app/features/clients/client.service.ts
git commit -m "feat(clients): add ClientService with create() method"
```

---

## Task 3 : Setup json-server

**Files:**
- Create: `mock/db.json`
- Create: `mock/routes.json`
- Create: `mock/middleware.js`
- Modify: `package.json`

- [ ] **Step 1 : Installer json-server**

```bash
npm install --save-dev json-server
```

Expected : json-server apparaît dans `devDependencies` de `package.json`.

- [ ] **Step 2 : Créer `mock/db.json`**

```json
{
  "clients": [
    {
      "id": "clnt_001",
      "reference": "CUST-2026-0001",
      "companyName": "Acme Corp",
      "website": "https://www.acme.com",
      "contact": {
        "fullName": "John Doe",
        "email": "john@acme.com",
        "phone": "+33 6 00 00 00 00"
      },
      "billingAddress": {
        "street": "123 rue de la Paix",
        "city": "Paris",
        "postalCode": "75001",
        "country": "France"
      },
      "financial": {
        "taxId": "FR 12 345 678 901",
        "currency": "EUR",
        "paymentTerms": "Net 30"
      },
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ]
}
```

- [ ] **Step 3 : Créer `mock/routes.json`**

```json
{
  "/api/*": "/$1"
}
```

- [ ] **Step 4 : Créer `mock/middleware.js`**

```js
// mock/middleware.js
module.exports = (req, _res, next) => {
  if (req.method === 'POST' && req.path === '/clients') {
    const year = new Date().getFullYear()
    const rand = Math.floor(Math.random() * 9000) + 1000
    req.body.reference = `CUST-${year}-${rand}`
    req.body.createdAt = new Date().toISOString()
  }
  next()
}
```

- [ ] **Step 5 : Ajouter le script `mock` dans `package.json`**

Dans la section `"scripts"`, ajouter :

```json
"mock": "json-server --watch mock/db.json --routes mock/routes.json --middlewares mock/middleware.js --port 3000"
```

Résultat attendu dans `package.json` :

```json
"scripts": {
  "ng": "ng",
  "start": "ng serve",
  "build": "ng build",
  "watch": "ng build --watch --configuration development",
  "test": "ng test",
  "mock": "json-server --watch mock/db.json --routes mock/routes.json --middlewares mock/middleware.js --port 3000"
},
```

- [ ] **Step 6 : Tester json-server seul**

```bash
npm run mock
```

Expected dans le terminal :

```
Resources
http://localhost:3000/clients

Home
http://localhost:3000
```

Tester dans un second terminal :

```bash
curl -s http://localhost:3000/clients | head -5
```

Expected : le JSON du client seed s'affiche. Arrêter json-server (`Ctrl+C`).

- [ ] **Step 7 : Commit**

```bash
git add mock/db.json mock/routes.json mock/middleware.js package.json package-lock.json
git commit -m "chore: add json-server mock with client seed and reference middleware"
```

---

## Task 4 : Câbler `NewClientComponent`

**Files:**
- Modify: `src/app/features/clients/new-client/new-client.component.ts`

- [ ] **Step 1 : Mettre à jour le composant**

Remplacer le contenu complet du fichier :

```typescript
// src/app/features/clients/new-client/new-client.component.ts
import { Component, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink, Router } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'
import { ClientService } from '../client.service'
import { CreateClientDto } from '../../../shared/models/client.model'

@Component({
  selector: 'app-new-client',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslateModule],
  templateUrl: './new-client.component.html',
  styleUrl: './new-client.component.scss'
})
export class NewClientComponent {
  companyName    = signal('')
  website        = signal('')

  fullName       = signal('')
  email          = signal('')
  phone          = signal('')

  street         = signal('')
  city           = signal('')
  postalCode     = signal('')
  country        = signal('France')

  taxId          = signal('')
  currency       = signal('EUR')
  paymentTerms   = signal('Net 30')

  loading        = signal(false)
  errorMsg       = signal('')

  readonly countries = [
    'France', 'United Kingdom', 'Germany', 'Spain', 'Italy',
    'Belgium', 'Switzerland', 'Netherlands', 'United States', 'Other'
  ]

  readonly currencies = [
    { value: 'EUR', label: 'EUR (€) – Euro' },
    { value: 'GBP', label: 'GBP (£) – British Pound' },
    { value: 'USD', label: 'USD ($) – US Dollar' },
    { value: 'CHF', label: 'CHF – Swiss Franc' },
  ]

  readonly paymentTermsOptions = ['Net 15', 'Net 30', 'Net 45', 'Net 60', 'Immédiat']

  constructor(
    private router: Router,
    private clientService: ClientService
  ) {}

  save(): void {
    this.loading.set(true)
    this.errorMsg.set('')

    const dto: CreateClientDto = {
      companyName: this.companyName(),
      website: this.website(),
      contact: {
        fullName: this.fullName(),
        email: this.email(),
        phone: this.phone()
      },
      billingAddress: {
        street: this.street(),
        city: this.city(),
        postalCode: this.postalCode(),
        country: this.country()
      },
      financial: {
        taxId: this.taxId(),
        currency: this.currency() as 'EUR' | 'GBP' | 'USD' | 'CHF',
        paymentTerms: this.paymentTerms() as 'Net 15' | 'Net 30' | 'Net 45' | 'Net 60' | 'Immédiat'
      }
    }

    this.clientService.create(dto).subscribe({
      next: () => this.router.navigate(['/customers']),
      error: (e) => {
        this.errorMsg.set(e?.error?.message ?? 'Une erreur est survenue. Veuillez réessayer.')
        this.loading.set(false)
      }
    })
  }

  cancel(): void {
    this.router.navigate(['/customers'])
  }
}
```

**Note :** le signal `reference` est supprimé — la référence est désormais générée côté serveur par le middleware json-server.

- [ ] **Step 2 : Vérifier que TypeScript compile**

```bash
npx tsc --noEmit
```

Expected : aucune erreur.

- [ ] **Step 3 : Commit**

```bash
git add src/app/features/clients/new-client/new-client.component.ts
git commit -m "feat(clients): wire save() to ClientService.create() with loading/error signals"
```

---

## Task 5 : Mettre à jour le template

**Files:**
- Modify: `src/app/features/clients/new-client/new-client.component.html`

- [ ] **Step 1 : Modifier la topbar — bouton Save + message d'erreur**

Remplacer le bloc `nc-topbar__actions` existant :

```html
<!-- AVANT -->
<div class="nc-topbar__actions">
  <button type="button" class="nc-btn nc-btn--ghost" (click)="cancel()">{{ 'NEW_CLIENT.CANCEL' | translate }}</button>
  <button type="button" class="nc-btn nc-btn--primary" (click)="save()">
    <span class="material-symbols-outlined">save</span>
    {{ 'NEW_CLIENT.SAVE' | translate }}
  </button>
</div>
```

Par :

```html
<!-- APRÈS -->
<div class="nc-topbar__actions">
  @if (errorMsg()) {
    <span class="nc-error-msg">{{ errorMsg() }}</span>
  }
  <button type="button" class="nc-btn nc-btn--ghost" (click)="cancel()" [disabled]="loading()">
    {{ 'NEW_CLIENT.CANCEL' | translate }}
  </button>
  <button type="button" class="nc-btn nc-btn--primary" (click)="save()" [disabled]="loading()">
    @if (loading()) {
      <span class="material-symbols-outlined nc-spin">progress_activity</span>
    } @else {
      <span class="material-symbols-outlined">save</span>
    }
    {{ loading() ? ('NEW_CLIENT.SAVING' | translate) : ('NEW_CLIENT.SAVE' | translate) }}
  </button>
</div>
```

- [ ] **Step 2 : Supprimer le champ Reference du template**

Supprimer ce bloc dans la section "General Information" (la référence est maintenant générée côté serveur) :

```html
          <div class="nc-field">
            <label class="nc-label">{{ 'NEW_CLIENT.REFERENCE' | translate }}</label>
            <input class="nc-input nc-input--readonly" type="text" readonly [value]="reference()" />
          </div>
```

- [ ] **Step 3 : Ajouter les clés i18n manquantes**

Dans `src/assets/i18n/en.json`, dans la section `NEW_CLIENT`, ajouter :

```json
"SAVING": "Saving..."
```

Dans `src/assets/i18n/fr.json`, dans la section `NEW_CLIENT`, ajouter :

```json
"SAVING": "Enregistrement..."
```

- [ ] **Step 4 : Ajouter le style `nc-error-msg` et `nc-spin`**

Dans `src/app/features/clients/new-client/new-client.component.scss`, ajouter à la fin :

```scss
.nc-error-msg {
  color: #ef4444;
  font-size: 0.875rem;
  align-self: center;
}

.nc-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
```

- [ ] **Step 5 : Vérifier que TypeScript compile**

```bash
npx tsc --noEmit
```

Expected : aucune erreur.

- [ ] **Step 6 : Commit**

```bash
git add src/app/features/clients/new-client/new-client.component.html \
        src/app/features/clients/new-client/new-client.component.scss \
        src/assets/i18n/en.json \
        src/assets/i18n/fr.json
git commit -m "feat(clients): update new-client template with loading state and error feedback"
```

---

## Task 6 : Test end-to-end manuel

- [ ] **Step 1 : Lancer json-server dans un terminal**

```bash
npm run mock
```

Expected :

```
Resources
http://localhost:3000/clients
```

- [ ] **Step 2 : Lancer Angular dans un second terminal**

```bash
npm start
```

Expected : `** Angular Live Development Server is listening on localhost:4200 **`

- [ ] **Step 3 : Tester le cas nominal**

1. Aller sur `http://localhost:4200/login` → se connecter (`admin@facturation.dev` / `admin123`)
2. Naviguer vers `http://localhost:4200/client/create`
3. Remplir au minimum : **Company Name** + **Email** du contact
4. Cliquer **Enregistrer client**
5. Expected : redirection vers `/customers`

Vérifier la persistence :

```bash
cat mock/db.json
```

Expected : un second objet dans le tableau `clients` avec `reference: "CUST-2026-XXXX"` et `createdAt` renseignés.

- [ ] **Step 4 : Tester le cas d'erreur réseau**

1. Arrêter json-server (`Ctrl+C`)
2. Recharger `http://localhost:4200/client/create`
3. Remplir les champs et cliquer **Enregistrer client**
4. Expected : message `"Une erreur est survenue. Veuillez réessayer."` sous le bouton, bouton réactivé

- [ ] **Step 5 : Commit final**

```bash
git add -p  # vérifier qu'il n'y a rien de non-intentionnel
git commit -m "chore: verify create-client flow end-to-end"
```
