# Registration Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Créer un formulaire d'inscription public à `/register` en 3 étapes (Personnel → Entreprise → Banque) + page de confirmation, avec header/footer identiques à la page login et soumission vers `POST /api/registrations`.

**Architecture:** `RegisterComponent` standalone, route publique lazy-loadée. Tout l'état est géré avec des signals Angular. Une seule URL `/register` — la navigation entre étapes est en mémoire via `currentStep = signal<1|2|3|4>(1)`. Le footer est dupliqué depuis le login (même CSS `lp-` classes).

**Tech Stack:** Angular 17 standalone, Angular signals, `HttpClient`, `FormsModule`, `TranslateModule`, json-server mock, CSS préfixe `rg-`

---

## File Map

| Fichier | Action | Responsabilité |
|---|---|---|
| `src/app/features/register/register.component.ts` | Créer | Signals, validation, soumission API |
| `src/app/features/register/register.component.html` | Créer | Template complet 4 étapes + header + footer |
| `src/app/features/register/register.component.scss` | Créer | Styles page register (stepper, formulaire, header, footer) |
| `src/app/app.routes.ts` | Modifier | Ajouter route `/register` |
| `src/app/features/login/login.component.html` | Modifier | Lier `<a href="#">Sign up</a>` → `routerLink="/register"` |
| `src/assets/i18n/en.json` | Modifier | Ajouter section `REGISTER` |
| `src/assets/i18n/fr.json` | Modifier | Ajouter section `REGISTER` |
| `mock/db.json` | Modifier | Ajouter `industries` et `registrations: []` |

---

## Task 1 : Mock data + i18n

**Files:**
- Modify: `mock/db.json`
- Modify: `src/assets/i18n/en.json`
- Modify: `src/assets/i18n/fr.json`

- [ ] **Step 1 : Ajouter `industries` et `registrations` dans `mock/db.json`**

Dans `mock/db.json`, ajouter au niveau racine (avant la clé `"clients"`) :

```json
"registrations": [],
"industries": [
  { "id": 1, "value": "Technologie", "label": "Technologie & IT" },
  { "id": 2, "value": "Finance", "label": "Finance & Comptabilité" },
  { "id": 3, "value": "Santé", "label": "Santé & Médical" },
  { "id": 4, "value": "Commerce", "label": "Commerce & Distribution" },
  { "id": 5, "value": "Industrie", "label": "Industrie & Production" },
  { "id": 6, "value": "Immobilier", "label": "Immobilier & Construction" },
  { "id": 7, "value": "Conseil", "label": "Conseil & Services" },
  { "id": 8, "value": "Éducation", "label": "Éducation & Formation" },
  { "id": 9, "value": "Autre", "label": "Autre" }
],
```

- [ ] **Step 2 : Vérifier json-server expose les nouvelles routes**

```bash
cd /home/houssem/projects/compta/facturation
npx json-server --watch mock/db.json --routes mock/routes.json --middlewares mock/middleware.js --port 3000 &
sleep 3
/usr/bin/curl -s http://localhost:3000/industries | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'industries OK: {len(d)} items')"
/usr/bin/curl -s http://localhost:3000/registrations | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'registrations OK: {len(d)} items')"
kill %1
```

Expected :
```
industries OK: 9 items
registrations OK: 0 items
```

- [ ] **Step 3 : Ajouter section `REGISTER` dans `src/assets/i18n/en.json`**

Ajouter avant le `}` final du fichier (après la section `NEW_INVOICE`) :

```json
,
  "REGISTER": {
    "TITLE": "Create your account",
    "STEP_PERSONAL": "Personal",
    "STEP_COMPANY": "Company",
    "STEP_BANK": "Bank",
    "STEP_CONFIRM": "Confirmation",
    "PERSONAL_TITLE": "Personal information",
    "PERSONAL_SUB": "Your credentials to access your workspace",
    "FULL_NAME": "Full name",
    "EMAIL": "Email address",
    "PASSWORD": "Password",
    "CONFIRM_PASSWORD": "Confirm password",
    "COMPANY_TITLE": "Company information",
    "COMPANY_SUB": "Your company details for invoices",
    "COMPANY_NAME": "Company name",
    "VAT_NUMBER": "VAT / Tax ID",
    "INDUSTRY": "Industry",
    "INDUSTRY_PLACEHOLDER": "Select your industry...",
    "STREET_NO": "Street no.",
    "STREET_NAME": "Street name",
    "CITY": "City",
    "POSTAL_CODE": "Postal code",
    "COUNTRY": "Country",
    "LOGO": "Company logo",
    "LOGO_HINT": "Drag & drop or click to upload (PNG, JPG, SVG — max 2 MB)",
    "BANK_TITLE": "Bank details",
    "BANK_SUB": "Required for payment transfers",
    "ACCOUNT_HOLDER": "Account holder name",
    "BANK_NAME": "Bank name",
    "IBAN": "IBAN",
    "SWIFT_BIC": "SWIFT / BIC",
    "CONFIRM_TITLE": "Registration summary",
    "CONFIRM_SUB": "Review your information below",
    "CONFIRM_PERSONAL": "Personal",
    "CONFIRM_COMPANY": "Company",
    "CONFIRM_BANK": "Bank",
    "CONFIRM_PENDING_TITLE": "Registration submitted",
    "CONFIRM_PENDING_BODY": "Your registration request has been submitted. Our team will review it within <strong>24–48 hours</strong>. A confirmation email will be sent to <strong>{{email}}</strong> once your account is approved.",
    "BACK_HOME": "Back to home",
    "NEXT": "Next",
    "PREV": "Previous",
    "SUBMIT": "Submit",
    "CANCEL": "Cancel",
    "ALREADY_ACCOUNT": "Already have an account?",
    "SIGN_IN": "Sign in",
    "ERR_REQUIRED": "This field is required.",
    "ERR_EMAIL": "Please enter a valid email address.",
    "ERR_PASSWORD_MIN": "Password must be at least 8 characters.",
    "ERR_PASSWORD_MATCH": "Passwords do not match."
  }
```

- [ ] **Step 4 : Ajouter section `REGISTER` dans `src/assets/i18n/fr.json`**

Ajouter avant le `}` final du fichier :

```json
,
  "REGISTER": {
    "TITLE": "Créer votre compte",
    "STEP_PERSONAL": "Personnel",
    "STEP_COMPANY": "Entreprise",
    "STEP_BANK": "Banque",
    "STEP_CONFIRM": "Confirmation",
    "PERSONAL_TITLE": "Informations personnelles",
    "PERSONAL_SUB": "Vos coordonnées pour accéder à votre espace",
    "FULL_NAME": "Nom complet",
    "EMAIL": "Adresse e-mail",
    "PASSWORD": "Mot de passe",
    "CONFIRM_PASSWORD": "Confirmer le mot de passe",
    "COMPANY_TITLE": "Informations entreprise",
    "COMPANY_SUB": "Les détails de votre société pour vos factures",
    "COMPANY_NAME": "Raison sociale",
    "VAT_NUMBER": "N° TVA / SIRET",
    "INDUSTRY": "Secteur d'activité",
    "INDUSTRY_PLACEHOLDER": "Sélectionner votre secteur...",
    "STREET_NO": "N° de rue",
    "STREET_NAME": "Nom de rue",
    "CITY": "Ville",
    "POSTAL_CODE": "Code postal",
    "COUNTRY": "Pays",
    "LOGO": "Logo de l'entreprise",
    "LOGO_HINT": "Glisser-déposer ou cliquer pour choisir (PNG, JPG, SVG — max 2 Mo)",
    "BANK_TITLE": "Coordonnées bancaires",
    "BANK_SUB": "Nécessaires pour les virements",
    "ACCOUNT_HOLDER": "Titulaire du compte",
    "BANK_NAME": "Nom de la banque",
    "IBAN": "IBAN",
    "SWIFT_BIC": "SWIFT / BIC",
    "CONFIRM_TITLE": "Récapitulatif de votre inscription",
    "CONFIRM_SUB": "Vérifiez vos informations avant validation",
    "CONFIRM_PERSONAL": "Personnel",
    "CONFIRM_COMPANY": "Entreprise",
    "CONFIRM_BANK": "Banque",
    "CONFIRM_PENDING_TITLE": "Inscription soumise",
    "CONFIRM_PENDING_BODY": "Votre demande d'inscription a été soumise. Notre équipe l'examinera dans les <strong>24 à 48h</strong>. Un email de confirmation sera envoyé à <strong>{{email}}</strong> dès que votre compte sera approuvé.",
    "BACK_HOME": "Retour à l'accueil",
    "NEXT": "Suivant",
    "PREV": "Précédent",
    "SUBMIT": "Soumettre",
    "CANCEL": "Annuler",
    "ALREADY_ACCOUNT": "Déjà un compte ?",
    "SIGN_IN": "Se connecter",
    "ERR_REQUIRED": "Ce champ est obligatoire.",
    "ERR_EMAIL": "Veuillez entrer une adresse e-mail valide.",
    "ERR_PASSWORD_MIN": "Le mot de passe doit contenir au moins 8 caractères.",
    "ERR_PASSWORD_MATCH": "Les mots de passe ne correspondent pas."
  }
```

- [ ] **Step 5 : Vérifier que TypeScript compile**

```bash
cd /home/houssem/projects/compta/facturation
npx tsc --noEmit
```

Expected : aucune erreur.

- [ ] **Step 6 : Commit**

```bash
git add mock/db.json src/assets/i18n/en.json src/assets/i18n/fr.json
git commit -m "feat(register): add industries mock data and REGISTER i18n keys"
```

---

## Task 2 : Route + lien login

**Files:**
- Modify: `src/app/app.routes.ts`
- Modify: `src/app/features/login/login.component.html`

- [ ] **Step 1 : Ajouter la route `/register` dans `app.routes.ts`**

Dans `src/app/app.routes.ts`, ajouter après la route `login` :

```typescript
  {
    path: 'register',
    loadComponent: () => import('./features/register/register.component').then(m => m.RegisterComponent)
  },
```

Le fichier complet doit ressembler à :

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
    path: 'register',
    loadComponent: () => import('./features/register/register.component').then(m => m.RegisterComponent)
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
      { path: 'dashboard', redirectTo: 'dashboard-vente' },
      {
        path: 'invoices',
        loadComponent: () =>
          import('./features/invoices/invoices.component').then(m => m.InvoicesComponent)
      },
      {
        path: 'customers',
        loadComponent: () =>
          import('./features/clients/clients.component').then(m => m.ClientsComponent)
      },
      {
        path: 'client/create',
        loadComponent: () =>
          import('./features/clients/new-client/new-client.component').then(m => m.NewClientComponent)
      },
      {
        path: 'client/edit/:id',
        loadComponent: () =>
          import('./features/clients/new-client/new-client.component').then(m => m.NewClientComponent)
      },
      {
        path: 'invoice/create',
        loadComponent: () =>
          import('./features/invoices/new-invoice/new-invoice.component').then(m => m.NewInvoiceComponent)
      },
      {
        path: 'invoice/edit/:id',
        loadComponent: () =>
          import('./features/invoices/new-invoice/new-invoice.component').then(m => m.NewInvoiceComponent)
      }
    ]
  },
  { path: '**', redirectTo: 'dashboard-vente' }
]
```

- [ ] **Step 2 : Lier le bouton "Sign up" dans `login.component.html`**

Dans `src/app/features/login/login.component.html`, remplacer :

```html
        <a href="#">{{ 'LOGIN.REGISTER' | translate }}</a>
```

Par :

```html
        <a routerLink="/register">{{ 'LOGIN.REGISTER' | translate }}</a>
```

**Note :** `RouterLink` est déjà dans les imports du `LoginComponent` (`imports: [FormsModule, RouterLink, TranslateModule]`) — aucune modification du `.ts` nécessaire.

- [ ] **Step 3 : Créer le dossier du composant**

```bash
mkdir -p /home/houssem/projects/compta/facturation/src/app/features/register
```

- [ ] **Step 4 : Vérifier que TypeScript compile**

```bash
cd /home/houssem/projects/compta/facturation
npx tsc --noEmit
```

Expected : erreur sur le `loadComponent` car le fichier n'existe pas encore — c'est normal à ce stade. Ignorer cette erreur spécifique. Si d'autres erreurs apparaissent, les corriger.

- [ ] **Step 5 : Commit**

```bash
git add src/app/app.routes.ts src/app/features/login/login.component.html
git commit -m "feat(register): add /register route and link Sign up button"
```

---

## Task 3 : RegisterComponent — TypeScript

**Files:**
- Create: `src/app/features/register/register.component.ts`

- [ ] **Step 1 : Créer `register.component.ts`**

Créer le fichier avec ce contenu exact :

```typescript
import { Component, signal, computed, OnInit, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Router, RouterLink } from '@angular/router'
import { HttpClient } from '@angular/common/http'
import { TranslateModule } from '@ngx-translate/core'

interface Industry { id: number; value: string; label: string }

interface RegistrationPayload {
  fullName: string
  email: string
  password: string
  company: {
    name: string
    vatNumber: string
    industry: string
    address: { streetNo: string; streetName: string; city: string; postalCode: string; country: string }
    logo: string
  }
  bank: { accountHolder: string; bankName: string; iban: string; swiftBic: string }
  status: 'pending'
  submittedAt: string
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslateModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
  private http   = inject(HttpClient)
  private router = inject(Router)

  currentStep   = signal<1 | 2 | 3 | 4>(1)
  formSubmitted = signal(false)

  // Step 1
  fullName        = signal('')
  email           = signal('')
  password        = signal('')
  confirmPassword = signal('')
  showPassword    = signal(false)
  showConfirm     = signal(false)

  // Step 2
  industries   = signal<Industry[]>([])
  companyName  = signal('')
  vatNumber    = signal('')
  industry     = signal('')
  streetNo     = signal('')
  streetName   = signal('')
  city         = signal('')
  postalCode   = signal('')
  country      = signal('France')
  logoBase64   = signal('')
  logoFileName = signal('')

  // Step 3
  accountHolder = signal('')
  bankName      = signal('')
  iban          = signal('')
  swiftBic      = signal('')

  // Submission
  submitting   = signal(false)
  submitError  = signal('')

  readonly countries = [
    'France', 'Tunisie', 'United Kingdom', 'Germany', 'Spain', 'Italy',
    'Belgium', 'Switzerland', 'Netherlands', 'United States', 'Other'
  ]

  step1Valid = computed(() =>
    this.fullName().trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email()) &&
    this.password().length >= 8 &&
    this.password() === this.confirmPassword()
  )

  step2Valid = computed(() =>
    this.companyName().trim().length > 0 &&
    this.industry().trim().length > 0 &&
    this.streetName().trim().length > 0 &&
    this.city().trim().length > 0 &&
    this.postalCode().trim().length > 0 &&
    this.country().trim().length > 0
  )

  step3Valid = computed(() =>
    this.accountHolder().trim().length > 0 &&
    this.bankName().trim().length > 0 &&
    this.iban().trim().length > 0 &&
    this.swiftBic().trim().length > 0
  )

  err = {
    fullName:        computed(() => this.formSubmitted() && !this.fullName().trim()),
    email:           computed(() => this.formSubmitted() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email())),
    password:        computed(() => this.formSubmitted() && this.password().length < 8),
    confirmPassword: computed(() => this.formSubmitted() && this.password() !== this.confirmPassword()),
    companyName:     computed(() => this.formSubmitted() && !this.companyName().trim()),
    industry:        computed(() => this.formSubmitted() && !this.industry().trim()),
    streetName:      computed(() => this.formSubmitted() && !this.streetName().trim()),
    city:            computed(() => this.formSubmitted() && !this.city().trim()),
    postalCode:      computed(() => this.formSubmitted() && !this.postalCode().trim()),
    country:         computed(() => this.formSubmitted() && !this.country().trim()),
    accountHolder:   computed(() => this.formSubmitted() && !this.accountHolder().trim()),
    bankName:        computed(() => this.formSubmitted() && !this.bankName().trim()),
    iban:            computed(() => this.formSubmitted() && !this.iban().trim()),
    swiftBic:        computed(() => this.formSubmitted() && !this.swiftBic().trim()),
  }

  ngOnInit(): void {
    this.http.get<Industry[]>('/api/industries').subscribe({
      next: list => this.industries.set(list),
      error: () => {}
    })
  }

  next(): void {
    this.formSubmitted.set(true)
    const step = this.currentStep()
    const valid = step === 1 ? this.step1Valid() : step === 2 ? this.step2Valid() : this.step3Valid()
    if (!valid) return
    this.formSubmitted.set(false)
    if (step < 3) {
      this.currentStep.set((step + 1) as 2 | 3)
    } else {
      this.submit()
    }
  }

  prev(): void {
    const step = this.currentStep()
    if (step > 1) this.currentStep.set((step - 1) as 1 | 2)
  }

  onLogoChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file || file.size > 2 * 1024 * 1024) return
    this.logoFileName.set(file.name)
    const reader = new FileReader()
    reader.onload = e => this.logoBase64.set((e.target?.result as string) ?? '')
    reader.readAsDataURL(file)
  }

  maskedIban(): string {
    const v = this.iban().replace(/\s/g, '')
    return v.length < 8 ? v : v.slice(0, 4) + ' •••• •••• ' + v.slice(-3)
  }

  private submit(): void {
    this.submitting.set(true)
    this.submitError.set('')

    const payload: RegistrationPayload = {
      fullName: this.fullName(),
      email:    this.email(),
      password: this.password(),
      company: {
        name:      this.companyName(),
        vatNumber: this.vatNumber(),
        industry:  this.industry(),
        address: {
          streetNo:   this.streetNo(),
          streetName: this.streetName(),
          city:       this.city(),
          postalCode: this.postalCode(),
          country:    this.country()
        },
        logo: this.logoBase64()
      },
      bank: {
        accountHolder: this.accountHolder(),
        bankName:      this.bankName(),
        iban:          this.iban(),
        swiftBic:      this.swiftBic()
      },
      status:      'pending',
      submittedAt: new Date().toISOString()
    }

    this.http.post('/api/registrations', payload).subscribe({
      next:  () => { this.submitting.set(false); this.currentStep.set(4) },
      error: e  => {
        this.submitError.set(e?.error?.message ?? 'Une erreur est survenue. Veuillez réessayer.')
        this.submitting.set(false)
      }
    })
  }
}
```

- [ ] **Step 2 : Vérifier que TypeScript compile** (avec fichiers HTML/SCSS vides)

Créer d'abord les fichiers vides pour que la compilation passe :

```bash
touch /home/houssem/projects/compta/facturation/src/app/features/register/register.component.html
touch /home/houssem/projects/compta/facturation/src/app/features/register/register.component.scss
cd /home/houssem/projects/compta/facturation
npx tsc --noEmit
```

Expected : aucune erreur.

- [ ] **Step 3 : Commit**

```bash
git add src/app/features/register/register.component.ts \
        src/app/features/register/register.component.html \
        src/app/features/register/register.component.scss
git commit -m "feat(register): add RegisterComponent TypeScript with signals and validation"
```

---

## Task 4 : RegisterComponent — Template HTML

**Files:**
- Modify: `src/app/features/register/register.component.html`

- [ ] **Step 1 : Écrire le template complet**

Remplacer le contenu de `src/app/features/register/register.component.html` :

```html
<div class="rg-page">

  <!-- ══ HEADER ═══════════════════════════════════════════ -->
  <header class="rg-header">
    <div class="rg-header__brand">
      <span class="rg-header__mark">
        <span class="material-symbols-outlined">receipt_long</span>
      </span>
      <span class="rg-header__name">{{ 'HEADER.BRAND' | translate }}</span>
    </div>
    <div class="rg-header__right">
      {{ 'REGISTER.ALREADY_ACCOUNT' | translate }}
      <a routerLink="/login" class="rg-header__link">{{ 'REGISTER.SIGN_IN' | translate }}</a>
    </div>
  </header>

  <!-- ══ MAIN ═════════════════════════════════════════════ -->
  <main class="rg-main">

    <!-- STEPPER -->
    <div class="rg-stepper">
      <div class="rg-stepper__step">
        <div class="rg-stepper__circle"
          [class.rg-stepper__circle--active]="currentStep() === 1"
          [class.rg-stepper__circle--done]="currentStep() > 1">
          @if (currentStep() > 1) { <span class="material-symbols-outlined">check</span> } @else { 1 }
        </div>
        <span class="rg-stepper__label" [class.rg-stepper__label--active]="currentStep() === 1">
          {{ 'REGISTER.STEP_PERSONAL' | translate }}
        </span>
      </div>
      <div class="rg-stepper__line" [class.rg-stepper__line--done]="currentStep() > 1"></div>
      <div class="rg-stepper__step">
        <div class="rg-stepper__circle"
          [class.rg-stepper__circle--active]="currentStep() === 2"
          [class.rg-stepper__circle--done]="currentStep() > 2">
          @if (currentStep() > 2) { <span class="material-symbols-outlined">check</span> } @else { 2 }
        </div>
        <span class="rg-stepper__label" [class.rg-stepper__label--active]="currentStep() === 2">
          {{ 'REGISTER.STEP_COMPANY' | translate }}
        </span>
      </div>
      <div class="rg-stepper__line" [class.rg-stepper__line--done]="currentStep() > 2"></div>
      <div class="rg-stepper__step">
        <div class="rg-stepper__circle"
          [class.rg-stepper__circle--active]="currentStep() === 3"
          [class.rg-stepper__circle--done]="currentStep() > 3">
          @if (currentStep() > 3) { <span class="material-symbols-outlined">check</span> } @else { 3 }
        </div>
        <span class="rg-stepper__label" [class.rg-stepper__label--active]="currentStep() === 3">
          {{ 'REGISTER.STEP_BANK' | translate }}
        </span>
      </div>
      <div class="rg-stepper__line" [class.rg-stepper__line--done]="currentStep() > 3"></div>
      <div class="rg-stepper__step">
        <div class="rg-stepper__circle"
          [class.rg-stepper__circle--active]="currentStep() === 4"
          [class.rg-stepper__circle--done]="false">
          @if (currentStep() === 4) { <span class="material-symbols-outlined">check</span> } @else { ✓ }
        </div>
        <span class="rg-stepper__label" [class.rg-stepper__label--active]="currentStep() === 4">
          {{ 'REGISTER.STEP_CONFIRM' | translate }}
        </span>
      </div>
    </div>

    <!-- ══ STEP 1 — Personnel ═══════════════════════════════ -->
    @if (currentStep() === 1) {
      <div class="rg-card rg-anim">
        <h2 class="rg-card__title">{{ 'REGISTER.PERSONAL_TITLE' | translate }}</h2>
        <p class="rg-card__sub">{{ 'REGISTER.PERSONAL_SUB' | translate }}</p>

        <div class="rg-grid rg-grid--2">

          <div class="rg-field rg-field--span2">
            <label class="rg-label">{{ 'REGISTER.FULL_NAME' | translate }} <span class="rg-req">*</span></label>
            <input class="rg-input" [class.rg-input--error]="err.fullName()" type="text"
              placeholder="Jean Dupont"
              [ngModel]="fullName()" (ngModelChange)="fullName.set($event)" />
            @if (err.fullName()) {
              <p class="rg-field-error"><span class="material-symbols-outlined">error</span>{{ 'REGISTER.ERR_REQUIRED' | translate }}</p>
            }
          </div>

          <div class="rg-field rg-field--span2">
            <label class="rg-label">{{ 'REGISTER.EMAIL' | translate }} <span class="rg-req">*</span></label>
            <div class="rg-input-wrap">
              <span class="material-symbols-outlined rg-input-icon">mail</span>
              <input class="rg-input rg-input--icon" [class.rg-input--error]="err.email()" type="email"
                placeholder="nom@entreprise.com"
                [ngModel]="email()" (ngModelChange)="email.set($event)" />
            </div>
            @if (err.email()) {
              <p class="rg-field-error"><span class="material-symbols-outlined">error</span>{{ 'REGISTER.ERR_EMAIL' | translate }}</p>
            }
          </div>

          <div class="rg-field">
            <label class="rg-label">{{ 'REGISTER.PASSWORD' | translate }} <span class="rg-req">*</span></label>
            <div class="rg-input-wrap">
              <span class="material-symbols-outlined rg-input-icon">lock</span>
              <input class="rg-input rg-input--icon" [class.rg-input--error]="err.password()"
                [type]="showPassword() ? 'text' : 'password'" placeholder="••••••••"
                [ngModel]="password()" (ngModelChange)="password.set($event)" />
              <button type="button" class="rg-eye-btn" (click)="showPassword.set(!showPassword())">
                <span class="material-symbols-outlined">{{ showPassword() ? 'visibility_off' : 'visibility' }}</span>
              </button>
            </div>
            @if (err.password()) {
              <p class="rg-field-error"><span class="material-symbols-outlined">error</span>{{ 'REGISTER.ERR_PASSWORD_MIN' | translate }}</p>
            }
          </div>

          <div class="rg-field">
            <label class="rg-label">{{ 'REGISTER.CONFIRM_PASSWORD' | translate }} <span class="rg-req">*</span></label>
            <div class="rg-input-wrap">
              <span class="material-symbols-outlined rg-input-icon">lock</span>
              <input class="rg-input rg-input--icon" [class.rg-input--error]="err.confirmPassword()"
                [type]="showConfirm() ? 'text' : 'password'" placeholder="••••••••"
                [ngModel]="confirmPassword()" (ngModelChange)="confirmPassword.set($event)" />
              <button type="button" class="rg-eye-btn" (click)="showConfirm.set(!showConfirm())">
                <span class="material-symbols-outlined">{{ showConfirm() ? 'visibility_off' : 'visibility' }}</span>
              </button>
            </div>
            @if (err.confirmPassword()) {
              <p class="rg-field-error"><span class="material-symbols-outlined">error</span>{{ 'REGISTER.ERR_PASSWORD_MATCH' | translate }}</p>
            }
          </div>

        </div>

        <div class="rg-nav">
          <a routerLink="/login" class="rg-btn rg-btn--ghost">{{ 'REGISTER.CANCEL' | translate }}</a>
          <button type="button" class="rg-btn rg-btn--primary" (click)="next()">
            {{ 'REGISTER.NEXT' | translate }}
            <span class="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </div>
    }

    <!-- ══ STEP 2 — Entreprise ══════════════════════════════ -->
    @if (currentStep() === 2) {
      <div class="rg-card rg-anim">
        <h2 class="rg-card__title">{{ 'REGISTER.COMPANY_TITLE' | translate }}</h2>
        <p class="rg-card__sub">{{ 'REGISTER.COMPANY_SUB' | translate }}</p>

        <div class="rg-grid rg-grid--2">

          <div class="rg-field">
            <label class="rg-label">{{ 'REGISTER.COMPANY_NAME' | translate }} <span class="rg-req">*</span></label>
            <input class="rg-input" [class.rg-input--error]="err.companyName()" type="text"
              placeholder="Acme Corp SAS"
              [ngModel]="companyName()" (ngModelChange)="companyName.set($event)" />
            @if (err.companyName()) {
              <p class="rg-field-error"><span class="material-symbols-outlined">error</span>{{ 'REGISTER.ERR_REQUIRED' | translate }}</p>
            }
          </div>

          <div class="rg-field">
            <label class="rg-label">{{ 'REGISTER.VAT_NUMBER' | translate }}</label>
            <input class="rg-input" type="text" placeholder="FR 12 345 678 901"
              [ngModel]="vatNumber()" (ngModelChange)="vatNumber.set($event)" />
          </div>

          <div class="rg-field rg-field--span2">
            <label class="rg-label">{{ 'REGISTER.INDUSTRY' | translate }} <span class="rg-req">*</span></label>
            <select class="rg-select" [class.rg-select--error]="err.industry()"
              [ngModel]="industry()" (ngModelChange)="industry.set($event)">
              <option value="">{{ 'REGISTER.INDUSTRY_PLACEHOLDER' | translate }}</option>
              @for (ind of industries(); track ind.id) {
                <option [value]="ind.value">{{ ind.label }}</option>
              }
            </select>
            @if (err.industry()) {
              <p class="rg-field-error"><span class="material-symbols-outlined">error</span>{{ 'REGISTER.ERR_REQUIRED' | translate }}</p>
            }
          </div>

          <div class="rg-field">
            <label class="rg-label">{{ 'REGISTER.STREET_NO' | translate }}</label>
            <input class="rg-input" type="text" placeholder="12"
              [ngModel]="streetNo()" (ngModelChange)="streetNo.set($event)" />
          </div>

          <div class="rg-field">
            <label class="rg-label">{{ 'REGISTER.STREET_NAME' | translate }} <span class="rg-req">*</span></label>
            <input class="rg-input" [class.rg-input--error]="err.streetName()" type="text"
              placeholder="Rue de la Paix"
              [ngModel]="streetName()" (ngModelChange)="streetName.set($event)" />
            @if (err.streetName()) {
              <p class="rg-field-error"><span class="material-symbols-outlined">error</span>{{ 'REGISTER.ERR_REQUIRED' | translate }}</p>
            }
          </div>

          <div class="rg-field">
            <label class="rg-label">{{ 'REGISTER.CITY' | translate }} <span class="rg-req">*</span></label>
            <input class="rg-input" [class.rg-input--error]="err.city()" type="text"
              placeholder="Paris"
              [ngModel]="city()" (ngModelChange)="city.set($event)" />
            @if (err.city()) {
              <p class="rg-field-error"><span class="material-symbols-outlined">error</span>{{ 'REGISTER.ERR_REQUIRED' | translate }}</p>
            }
          </div>

          <div class="rg-field">
            <label class="rg-label">{{ 'REGISTER.POSTAL_CODE' | translate }} <span class="rg-req">*</span></label>
            <input class="rg-input" [class.rg-input--error]="err.postalCode()" type="text"
              placeholder="75001"
              [ngModel]="postalCode()" (ngModelChange)="postalCode.set($event)" />
            @if (err.postalCode()) {
              <p class="rg-field-error"><span class="material-symbols-outlined">error</span>{{ 'REGISTER.ERR_REQUIRED' | translate }}</p>
            }
          </div>

          <div class="rg-field rg-field--span2">
            <label class="rg-label">{{ 'REGISTER.COUNTRY' | translate }} <span class="rg-req">*</span></label>
            <select class="rg-select" [class.rg-select--error]="err.country()"
              [ngModel]="country()" (ngModelChange)="country.set($event)">
              @for (c of countries; track c) {
                <option [value]="c">{{ c }}</option>
              }
            </select>
            @if (err.country()) {
              <p class="rg-field-error"><span class="material-symbols-outlined">error</span>{{ 'REGISTER.ERR_REQUIRED' | translate }}</p>
            }
          </div>

          <div class="rg-field rg-field--span2">
            <label class="rg-label">{{ 'REGISTER.LOGO' | translate }}</label>
            <label class="rg-upload" for="logoInput">
              @if (logoFileName()) {
                <span class="material-symbols-outlined">image</span>
                <span>{{ logoFileName() }}</span>
              } @else {
                <span class="material-symbols-outlined">upload</span>
                <span>{{ 'REGISTER.LOGO_HINT' | translate }}</span>
              }
            </label>
            <input id="logoInput" type="file" accept="image/png,image/jpeg,image/svg+xml"
              class="rg-upload-input" (change)="onLogoChange($event)" />
          </div>

        </div>

        <div class="rg-nav">
          <button type="button" class="rg-btn rg-btn--ghost" (click)="prev()">
            <span class="material-symbols-outlined">arrow_back</span>
            {{ 'REGISTER.PREV' | translate }}
          </button>
          <button type="button" class="rg-btn rg-btn--primary" (click)="next()">
            {{ 'REGISTER.NEXT' | translate }}
            <span class="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </div>
    }

    <!-- ══ STEP 3 — Banque ══════════════════════════════════ -->
    @if (currentStep() === 3) {
      <div class="rg-card rg-anim">
        <h2 class="rg-card__title">{{ 'REGISTER.BANK_TITLE' | translate }}</h2>
        <p class="rg-card__sub">{{ 'REGISTER.BANK_SUB' | translate }}</p>

        <div class="rg-grid rg-grid--2">

          <div class="rg-field">
            <label class="rg-label">{{ 'REGISTER.ACCOUNT_HOLDER' | translate }} <span class="rg-req">*</span></label>
            <input class="rg-input" [class.rg-input--error]="err.accountHolder()" type="text"
              placeholder="Jean Dupont"
              [ngModel]="accountHolder()" (ngModelChange)="accountHolder.set($event)" />
            @if (err.accountHolder()) {
              <p class="rg-field-error"><span class="material-symbols-outlined">error</span>{{ 'REGISTER.ERR_REQUIRED' | translate }}</p>
            }
          </div>

          <div class="rg-field">
            <label class="rg-label">{{ 'REGISTER.BANK_NAME' | translate }} <span class="rg-req">*</span></label>
            <input class="rg-input" [class.rg-input--error]="err.bankName()" type="text"
              placeholder="BNP Paribas"
              [ngModel]="bankName()" (ngModelChange)="bankName.set($event)" />
            @if (err.bankName()) {
              <p class="rg-field-error"><span class="material-symbols-outlined">error</span>{{ 'REGISTER.ERR_REQUIRED' | translate }}</p>
            }
          </div>

          <div class="rg-field rg-field--span2">
            <label class="rg-label">{{ 'REGISTER.IBAN' | translate }} <span class="rg-req">*</span></label>
            <input class="rg-input" [class.rg-input--error]="err.iban()" type="text"
              placeholder="FR76 3000 6000 0112 3456 7890 189"
              [ngModel]="iban()" (ngModelChange)="iban.set($event)" />
            @if (err.iban()) {
              <p class="rg-field-error"><span class="material-symbols-outlined">error</span>{{ 'REGISTER.ERR_REQUIRED' | translate }}</p>
            }
          </div>

          <div class="rg-field">
            <label class="rg-label">{{ 'REGISTER.SWIFT_BIC' | translate }} <span class="rg-req">*</span></label>
            <input class="rg-input" [class.rg-input--error]="err.swiftBic()" type="text"
              placeholder="BNPAFRPPXXX"
              [ngModel]="swiftBic()" (ngModelChange)="swiftBic.set($event)" />
            @if (err.swiftBic()) {
              <p class="rg-field-error"><span class="material-symbols-outlined">error</span>{{ 'REGISTER.ERR_REQUIRED' | translate }}</p>
            }
          </div>

        </div>

        @if (submitError()) {
          <p class="rg-submit-error">
            <span class="material-symbols-outlined">error</span>
            {{ submitError() }}
          </p>
        }

        <div class="rg-nav">
          <button type="button" class="rg-btn rg-btn--ghost" (click)="prev()" [disabled]="submitting()">
            <span class="material-symbols-outlined">arrow_back</span>
            {{ 'REGISTER.PREV' | translate }}
          </button>
          <button type="button" class="rg-btn rg-btn--success" (click)="next()" [disabled]="submitting()">
            @if (submitting()) {
              <span class="material-symbols-outlined rg-spin">progress_activity</span>
            } @else {
              <span class="material-symbols-outlined">send</span>
            }
            {{ submitting() ? ('LOGIN.LOADING' | translate) : ('REGISTER.SUBMIT' | translate) }}
          </button>
        </div>
      </div>
    }

    <!-- ══ STEP 4 — Confirmation ════════════════════════════ -->
    @if (currentStep() === 4) {
      <div class="rg-card rg-anim">
        <h2 class="rg-card__title">{{ 'REGISTER.CONFIRM_TITLE' | translate }}</h2>
        <p class="rg-card__sub">{{ 'REGISTER.CONFIRM_SUB' | translate }}</p>

        <div class="rg-summary">

          <div class="rg-summary__section">
            <h3 class="rg-summary__heading">{{ 'REGISTER.CONFIRM_PERSONAL' | translate }}</h3>
            <div class="rg-summary__row">
              <span class="rg-summary__key">{{ 'REGISTER.FULL_NAME' | translate }}</span>
              <span class="rg-summary__val">{{ fullName() }}</span>
            </div>
            <div class="rg-summary__row">
              <span class="rg-summary__key">{{ 'REGISTER.EMAIL' | translate }}</span>
              <span class="rg-summary__val">{{ email() }}</span>
            </div>
          </div>

          <div class="rg-summary__section">
            <h3 class="rg-summary__heading">{{ 'REGISTER.CONFIRM_COMPANY' | translate }}</h3>
            <div class="rg-summary__row">
              <span class="rg-summary__key">{{ 'REGISTER.COMPANY_NAME' | translate }}</span>
              <span class="rg-summary__val">{{ companyName() }}</span>
            </div>
            <div class="rg-summary__row">
              <span class="rg-summary__key">{{ 'REGISTER.INDUSTRY' | translate }}</span>
              <span class="rg-summary__val">{{ industry() }}</span>
            </div>
            <div class="rg-summary__row">
              <span class="rg-summary__key">Adresse</span>
              <span class="rg-summary__val">{{ streetNo() }} {{ streetName() }}, {{ postalCode() }} {{ city() }}, {{ country() }}</span>
            </div>
          </div>

          <div class="rg-summary__section">
            <h3 class="rg-summary__heading">{{ 'REGISTER.CONFIRM_BANK' | translate }}</h3>
            <div class="rg-summary__row">
              <span class="rg-summary__key">{{ 'REGISTER.BANK_NAME' | translate }}</span>
              <span class="rg-summary__val">{{ bankName() }}</span>
            </div>
            <div class="rg-summary__row">
              <span class="rg-summary__key">{{ 'REGISTER.IBAN' | translate }}</span>
              <span class="rg-summary__val">{{ maskedIban() }}</span>
            </div>
          </div>

        </div>

        <div class="rg-pending-banner">
          <span class="material-symbols-outlined rg-pending-banner__icon">info</span>
          <div class="rg-pending-banner__text" [innerHTML]="'REGISTER.CONFIRM_PENDING_BODY' | translate:{ email: email() }"></div>
        </div>

        <div class="rg-nav rg-nav--end">
          <a routerLink="/" class="rg-btn rg-btn--ghost">{{ 'REGISTER.BACK_HOME' | translate }}</a>
        </div>
      </div>
    }

    <p class="rg-login-hint">
      {{ 'REGISTER.ALREADY_ACCOUNT' | translate }}
      <a routerLink="/login" class="rg-login-hint__link">{{ 'REGISTER.SIGN_IN' | translate }}</a>
    </p>

  </main>

  <!-- ══ FOOTER ════════════════════════════════════════════ -->
  <footer class="rg-footer">
    <div class="rg-footer__inner">
      <div class="rg-footer__brand">
        <h3>{{ 'HEADER.BRAND' | translate }}</h3>
        <p>{{ 'LOGIN.FOOTER_DESC' | translate }}</p>
      </div>
      <div class="rg-footer__col">
        <h5>{{ 'LOGIN.FOOTER_PRODUCT' | translate }}</h5>
        <ul>
          <li><a href="#">{{ 'LOGIN.FOOTER_FEATURES' | translate }}</a></li>
          <li><a href="#">{{ 'LOGIN.FOOTER_PRICING' | translate }}</a></li>
          <li><a href="#">{{ 'LOGIN.FOOTER_SECURITY' | translate }}</a></li>
          <li><a href="#">{{ 'LOGIN.FOOTER_API' | translate }}</a></li>
        </ul>
      </div>
      <div class="rg-footer__col">
        <h5>{{ 'LOGIN.FOOTER_CONTACT' | translate }}</h5>
        <ul>
          <li>support&#64;facturation.dev</li>
          <li>+33 1 23 45 67 89</li>
        </ul>
      </div>
    </div>
    <div class="rg-footer__bottom">
      <p>{{ 'LOGIN.FOOTER_RIGHTS' | translate }}</p>
      <div class="rg-footer__links">
        <a href="#">{{ 'LOGIN.FOOTER_TERMS' | translate }}</a>
        <a href="#">{{ 'LOGIN.FOOTER_PRIVACY' | translate }}</a>
        <a href="#">{{ 'LOGIN.FOOTER_COOKIES' | translate }}</a>
      </div>
    </div>
  </footer>

</div>
```

- [ ] **Step 2 : Vérifier que TypeScript compile**

```bash
cd /home/houssem/projects/compta/facturation
npx tsc --noEmit
```

Expected : aucune erreur.

- [ ] **Step 3 : Commit**

```bash
git add src/app/features/register/register.component.html
git commit -m "feat(register): add full multi-step registration template"
```

---

## Task 5 : RegisterComponent — SCSS

**Files:**
- Modify: `src/app/features/register/register.component.scss`

- [ ] **Step 1 : Écrire les styles complets**

Remplacer le contenu de `src/app/features/register/register.component.scss` :

```scss
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

:host {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--color-background);
  color: var(--color-on-surface);
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes spin { to { transform: rotate(360deg); } }

.rg-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* ── HEADER ─────────────────────────────────────────────── */
.rg-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 32px;
  border-bottom: 1px solid var(--color-surface-border, #1e293b);
  background: var(--color-background);
  position: sticky;
  top: 0;
  z-index: 10;

  @media (max-width: 560px) { padding: 12px 16px; }
}
.rg-header__brand {
  display: flex;
  align-items: center;
  gap: 8px;
}
.rg-header__mark {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  background: linear-gradient(135deg, var(--color-primary, #3b82f6), #1d4ed8);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 15px;
}
.rg-header__name {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-on-surface);
}
.rg-header__right {
  font-size: 12px;
  color: var(--color-on-surface-muted, #64748b);
}
.rg-header__link {
  color: var(--color-primary, #3b82f6);
  text-decoration: none;
  font-weight: 600;
  margin-left: 4px;
  &:hover { text-decoration: underline; }
}

/* ── MAIN ────────────────────────────────────────────────── */
.rg-main {
  flex: 1;
  padding: 40px 24px 60px;
  max-width: 680px;
  width: 100%;
  margin: 0 auto;

  @media (max-width: 560px) { padding: 24px 16px 48px; }
}

/* ── STEPPER ─────────────────────────────────────────────── */
.rg-stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 36px;
  gap: 0;
}
.rg-stepper__step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.rg-stepper__circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  background: var(--color-surface, #1e293b);
  border: 2px solid var(--color-surface-border, #334155);
  color: var(--color-on-surface-muted, #64748b);
  transition: background 0.2s, border-color 0.2s;

  .material-symbols-outlined { font-size: 16px; }

  &--active {
    background: var(--color-primary, #3b82f6);
    border-color: var(--color-primary, #3b82f6);
    color: #fff;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
  }
  &--done {
    background: #22c55e;
    border-color: #22c55e;
    color: #fff;
  }
}
.rg-stepper__label {
  font-size: 10px;
  color: var(--color-on-surface-muted, #64748b);
  white-space: nowrap;
  &--active {
    color: var(--color-primary, #3b82f6);
    font-weight: 600;
  }
}
.rg-stepper__line {
  flex: 1;
  height: 2px;
  margin: 0 8px;
  margin-bottom: 20px;
  background: var(--color-surface-border, #334155);
  transition: background 0.3s;
  &--done { background: #22c55e; }
}

/* ── CARD ────────────────────────────────────────────────── */
.rg-card {
  background: var(--color-surface, #1e293b);
  border-radius: 12px;
  padding: 28px 32px;
  border: 1px solid var(--color-surface-border, #334155);

  @media (max-width: 560px) { padding: 20px 16px; }
}
.rg-anim { animation: fadeUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) both; }
.rg-card__title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-on-surface);
  margin-bottom: 4px;
}
.rg-card__sub {
  font-size: 13px;
  color: var(--color-on-surface-muted, #64748b);
  margin-bottom: 24px;
}

/* ── GRID ────────────────────────────────────────────────── */
.rg-grid {
  display: grid;
  gap: 16px;
  margin-bottom: 20px;
  &--2 { grid-template-columns: 1fr 1fr; }
  @media (max-width: 560px) { &--2 { grid-template-columns: 1fr; } }
}
.rg-field { display: flex; flex-direction: column; gap: 5px; }
.rg-field--span2 { grid-column: span 2; @media (max-width: 560px) { grid-column: span 1; } }

/* ── LABELS & INPUTS ─────────────────────────────────────── */
.rg-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-on-surface-muted, #94a3b8);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.rg-req { color: #ef4444; margin-left: 2px; }
.rg-input-wrap { position: relative; }
.rg-input-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  color: var(--color-on-surface-muted, #64748b);
  pointer-events: none;
}
.rg-input {
  width: 100%;
  background: var(--color-background, #0f172a);
  border: 1px solid var(--color-surface-border, #334155);
  border-radius: 7px;
  height: 40px;
  padding: 0 12px;
  font-size: 13px;
  color: var(--color-on-surface);
  transition: border-color 0.15s;
  box-sizing: border-box;

  &::placeholder { color: var(--color-on-surface-muted, #475569); }
  &:focus { outline: none; border-color: var(--color-primary, #3b82f6); }
  &--icon { padding-left: 36px; }
  &--error { border-color: #ef4444; }
}
.rg-eye-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-on-surface-muted, #64748b);
  display: flex;
  align-items: center;
  padding: 4px;
  &:hover { color: var(--color-on-surface); }
}
.rg-select {
  width: 100%;
  background: var(--color-background, #0f172a);
  border: 1px solid var(--color-surface-border, #334155);
  border-radius: 7px;
  height: 40px;
  padding: 0 12px;
  font-size: 13px;
  color: var(--color-on-surface);
  cursor: pointer;
  box-sizing: border-box;
  &:focus { outline: none; border-color: var(--color-primary, #3b82f6); }
  &--error { border-color: #ef4444; }
}
.rg-upload {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--color-background, #0f172a);
  border: 2px dashed var(--color-surface-border, #334155);
  border-radius: 7px;
  padding: 14px 16px;
  font-size: 12px;
  color: var(--color-on-surface-muted, #64748b);
  cursor: pointer;
  transition: border-color 0.15s;
  &:hover { border-color: var(--color-primary, #3b82f6); color: var(--color-primary, #3b82f6); }
}
.rg-upload-input { display: none; }
.rg-field-error {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #ef4444;
  margin-top: 2px;
  .material-symbols-outlined { font-size: 14px; }
}

/* ── NAV BUTTONS ─────────────────────────────────────────── */
.rg-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20px;
  border-top: 1px solid var(--color-surface-border, #1e293b);
  &--end { justify-content: flex-end; }
}
.rg-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 20px;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: opacity 0.15s;
  text-decoration: none;
  .material-symbols-outlined { font-size: 16px; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }

  &--ghost {
    background: transparent;
    border: 1px solid var(--color-surface-border, #334155);
    color: var(--color-on-surface-muted, #94a3b8);
  }
  &--primary {
    background: var(--color-primary, #3b82f6);
    color: #fff;
    &:hover:not(:disabled) { opacity: 0.9; }
  }
  &--success {
    background: #22c55e;
    color: #fff;
    &:hover:not(:disabled) { opacity: 0.9; }
  }
}
.rg-spin { animation: spin 1s linear infinite; }
.rg-submit-error {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #ef4444;
  margin-bottom: 12px;
  .material-symbols-outlined { font-size: 16px; }
}

/* ── SUMMARY (Step 4) ────────────────────────────────────── */
.rg-summary { margin-bottom: 20px; }
.rg-summary__section { margin-bottom: 16px; }
.rg-summary__heading {
  font-size: 10px;
  font-weight: 700;
  color: var(--color-primary, #3b82f6);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  margin-bottom: 8px;
}
.rg-summary__row {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
  border-bottom: 1px solid var(--color-surface-border, #1e293b);
  &:last-child { border-bottom: none; }
}
.rg-summary__key { font-size: 12px; color: var(--color-on-surface-muted, #64748b); }
.rg-summary__val { font-size: 12px; color: var(--color-on-surface); font-weight: 500; }

/* ── PENDING BANNER ──────────────────────────────────────── */
.rg-pending-banner {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  background: rgba(34, 197, 94, 0.08);
  border: 1px solid #22c55e;
  border-radius: 8px;
  padding: 14px 16px;
  margin-bottom: 20px;
}
.rg-pending-banner__icon {
  color: #22c55e;
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 1px;
}
.rg-pending-banner__text {
  font-size: 13px;
  color: #86efac;
  line-height: 1.6;
  strong { color: #fff; }
}

/* ── LOGIN HINT ──────────────────────────────────────────── */
.rg-login-hint {
  text-align: center;
  font-size: 12px;
  color: var(--color-on-surface-muted, #64748b);
  margin-top: 20px;
}
.rg-login-hint__link {
  color: var(--color-primary, #3b82f6);
  text-decoration: none;
  font-weight: 600;
  margin-left: 4px;
  &:hover { text-decoration: underline; }
}

/* ── FOOTER ──────────────────────────────────────────────── */
.rg-footer {
  background: var(--color-surface, #080f1a);
  border-top: 1px solid var(--color-surface-border, #1e293b);
  padding: 28px 32px 16px;
  @media (max-width: 560px) { padding: 20px 16px 12px; }
}
.rg-footer__inner {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 24px;
  margin-bottom: 16px;
  @media (max-width: 640px) { grid-template-columns: 1fr; gap: 16px; }
}
.rg-footer__brand h3 {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-on-surface);
  margin-bottom: 4px;
}
.rg-footer__brand p { font-size: 11px; color: var(--color-on-surface-muted, #475569); line-height: 1.5; }
.rg-footer__col h5 {
  font-size: 10px;
  font-weight: 700;
  color: var(--color-on-surface-muted, #94a3b8);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}
.rg-footer__col ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 4px; }
.rg-footer__col ul li, .rg-footer__col ul li a {
  font-size: 11px;
  color: var(--color-on-surface-muted, #475569);
  text-decoration: none;
  &:hover { color: var(--color-on-surface); }
}
.rg-footer__bottom {
  border-top: 1px solid var(--color-surface-border, #1e293b);
  padding-top: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  @media (max-width: 560px) { flex-direction: column; gap: 8px; text-align: center; }
}
.rg-footer__bottom p { font-size: 11px; color: var(--color-on-surface-muted, #475569); }
.rg-footer__links { display: flex; gap: 16px; }
.rg-footer__links a {
  font-size: 11px;
  color: var(--color-on-surface-muted, #475569);
  text-decoration: none;
  &:hover { color: var(--color-on-surface); }
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
git add src/app/features/register/register.component.scss
git commit -m "feat(register): add registration form styles"
```

---

## Task 6 : Test end-to-end

- [ ] **Step 1 : Lancer json-server**

```bash
cd /home/houssem/projects/compta/facturation
npm run mock
```

Expected : `http://localhost:3000/registrations` et `http://localhost:3000/industries` listés dans Resources.

- [ ] **Step 2 : Lancer Angular (second terminal)**

```bash
npm start
```

Expected : serveur sur `http://localhost:4200`.

- [ ] **Step 3 : Tester le flux complet**

1. Aller sur `http://localhost:4200/register`
2. Vérifier que le header affiche "Billing Module" + lien "Se connecter"
3. **Étape 1** : laisser les champs vides → cliquer Suivant → vérifier les messages d'erreur
4. Remplir : Nom=`Test User`, Email=`test@test.com`, Password=`password123`, Confirm=`password123` → Suivant
5. **Étape 2** : le stepper montre étape 1 en vert ✓, étape 2 active
6. Remplir entreprise → Suivant
7. **Étape 3** : remplir banque → Soumettre
8. **Confirmation** : vérifier le récapitulatif et la bannière verte
9. Cliquer "Retour à l'accueil" → vérifier la navigation vers `/`

- [ ] **Step 4 : Vérifier la persistence**

```bash
python3 -c "import json; d=json.load(open('mock/db.json')); regs=d['registrations']; print(f'{len(regs)} registration(s)'); print('status:', regs[-1]['status']) if regs else None"
```

Expected :
```
1 registration(s)
status: pending
```

- [ ] **Step 5 : Tester le lien "Sign up" depuis la page login**

1. Aller sur `http://localhost:4200/login`
2. Cliquer "Sign up" → vérifier la navigation vers `/register`

- [ ] **Step 6 : Commit final**

```bash
git add -p
git commit -m "chore: verify registration form e2e flow"
```
