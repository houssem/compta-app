# Design Spec — Formulaire d'inscription multi-étapes

**Date :** 2026-05-20
**Route :** `/register` (publique, sans authGuard)
**Scope :** Formulaire d'inscription en 3 étapes + page de confirmation, style identique à la page login

---

## 1. Architecture

**Layout retenu : Stepper horizontal (Option A)**

Page autonome sans `MainLayoutComponent`. Structure identique à `LoginComponent` :
- Header fixe avec marque + lien "Se connecter"
- Contenu centré (max 680px) avec stepper horizontal + carte formulaire
- Footer identique à la page login (colonnes produit/contact + copyright)

```
/register  →  RegisterComponent  (public, standalone, lazy-loaded)
```

**État du composant :** Signals Angular uniquement — `currentStep = signal<1|2|3|4>(1)`.  
Pas de router par étape — une seule URL `/register`, les étapes sont gérées en mémoire.

---

## 2. Fichiers

| Fichier | Action |
|---|---|
| `src/app/features/register/register.component.ts` | Créer |
| `src/app/features/register/register.component.html` | Créer |
| `src/app/features/register/register.component.scss` | Créer |
| `src/app/app.routes.ts` | Modifier — ajouter route `/register` |
| `src/app/features/login/login.component.html` | Modifier — lier le bouton "Sign up" à `/register` |
| `src/assets/i18n/en.json` | Modifier — ajouter section `REGISTER` |
| `src/assets/i18n/fr.json` | Modifier — ajouter section `REGISTER` |
| `mock/db.json` | Modifier — ajouter `registrations` et `industries` |

---

## 3. Étapes et champs

### Étape 1 — Informations personnelles
| Champ | Type | Obligatoire |
|---|---|---|
| `fullName` | text | ✅ |
| `email` | email | ✅ |
| `password` | password (toggle visibility) | ✅ min 8 chars |
| `confirmPassword` | password | ✅ doit matcher `password` |

**Validation avant passage à l'étape 2 :**
- Tous les champs remplis
- Email valide (regex)
- Password ≥ 8 caractères
- `confirmPassword === password`

### Étape 2 — Informations entreprise
| Champ | Type | Obligatoire |
|---|---|---|
| `companyName` | text | ✅ |
| `vatNumber` | text | ❌ |
| `industry` | select (liste depuis API) | ✅ |
| `streetNo` | text | ❌ |
| `streetName` | text | ✅ |
| `city` | text | ✅ |
| `postalCode` | text | ✅ |
| `country` | select (liste statique, même valeurs que `NewClientComponent`) | ✅ |
| `logo` | file input (PNG/JPG/SVG max 2 Mo) | ❌ |

**Grille :** 2 colonnes. Logo : zone drag-and-drop sur toute la largeur.  
**Logo stockage :** converti en base64 et inclus dans le payload JSON.

**Validation avant passage à l'étape 3 :**
- `companyName`, `industry`, `streetName`, `city`, `postalCode`, `country` remplis

### Étape 3 — Coordonnées bancaires
| Champ | Type | Obligatoire |
|---|---|---|
| `accountHolder` | text | ✅ |
| `bankName` | text | ✅ |
| `iban` | text | ✅ |
| `swiftBic` | text | ✅ |

**Validation avant soumission :**
- Tous les champs remplis

### Étape 4 — Confirmation (lecture seule)
- Récapitulatif des données (mot de passe masqué, IBAN partiellement masqué)
- Bannière verte : *"Votre demande sera examinée sous 24–48h. Un email de confirmation vous sera envoyé à `<email>`."*
- Bouton unique : **Retour à l'accueil** → navigue vers `/`

---

## 4. Navigation entre étapes

| Action | Comportement |
|---|---|
| **Suivant** | Valide l'étape courante — si invalide, affiche les erreurs inline ; si valide, `currentStep.set(step + 1)` |
| **Précédent** | `currentStep.set(step - 1)` sans validation |
| **Annuler** (étape 1) | Navigue vers `/login` |
| **Soumettre** (étape 3) | `POST /api/registrations`, puis `currentStep.set(4)` |

Les étapes complétées affichent un cercle vert ✓. L'étape active est bleue. Les suivantes sont grises.

---

## 5. Soumission API

**Endpoint :** `POST /api/registrations`

**Payload :**
```json
{
  "fullName": "Jean Dupont",
  "email": "jean@entreprise.com",
  "password": "hashed_or_plain_for_mock",
  "company": {
    "name": "Acme Corp SAS",
    "vatNumber": "FR 12 345 678 901",
    "industry": "Technologie",
    "address": {
      "streetNo": "12",
      "streetName": "Rue de la Paix",
      "city": "Paris",
      "postalCode": "75001",
      "country": "France"
    },
    "logo": "data:image/png;base64,..."
  },
  "bank": {
    "accountHolder": "Jean Dupont",
    "bankName": "BNP Paribas",
    "iban": "FR76 3000 6000 0112 3456 7890 189",
    "swiftBic": "BNPAFRPPXXX"
  },
  "status": "pending",
  "submittedAt": "<ISO timestamp>"
}
```

**États du composant pendant la soumission :**
- `submitting = signal(false)` — désactive le bouton Soumettre
- `submitError = signal('')` — message inline sous le bouton en cas d'erreur réseau

---

## 6. Mock json-server

### `mock/db.json` — ajouter :

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
]
```

`GET /api/industries` sera utilisé dans `ngOnInit` pour peupler le dropdown.

---

## 7. Clés i18n

Section `REGISTER` à ajouter dans `en.json` et `fr.json` :

```
TITLE, STEP_PERSONAL, STEP_COMPANY, STEP_BANK, STEP_CONFIRM,
PERSONAL_TITLE, PERSONAL_SUB,
FULL_NAME, EMAIL, PASSWORD, CONFIRM_PASSWORD,
COMPANY_TITLE, COMPANY_SUB,
COMPANY_NAME, VAT_NUMBER, INDUSTRY, STREET_NO, STREET_NAME,
CITY, POSTAL_CODE, COUNTRY, LOGO, LOGO_HINT,
BANK_TITLE, BANK_SUB,
ACCOUNT_HOLDER, BANK_NAME, IBAN, SWIFT_BIC,
CONFIRM_TITLE, CONFIRM_SUB, CONFIRM_PENDING_TITLE, CONFIRM_PENDING_BODY,
BACK_HOME, NEXT, PREV, SUBMIT, CANCEL,
ALREADY_ACCOUNT, SIGN_IN,
ERR_REQUIRED, ERR_EMAIL, ERR_PASSWORD_MIN, ERR_PASSWORD_MATCH
```

---

## 8. Hors scope

- Vérification d'unicité d'email côté serveur (json-server ne le supporte pas nativement)
- Upload de logo vers un bucket (stocké en base64 dans le JSON mock)
- Email de confirmation réel (mock seulement)
- Connexion Google/Microsoft (boutons existants dans login, non dupliqués ici)
