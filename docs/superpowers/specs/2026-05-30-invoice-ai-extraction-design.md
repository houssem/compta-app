# Design — Extraction IA de facture d'achat

**Date:** 2026-05-30
**Branch:** feat/FACT-1-Facture-achat
**Scope:** Formulaire "Nouvelle facture d'achat" (create mode uniquement)

## Objectif

Permettre à l'utilisateur d'uploader une facture fournisseur (PDF ou image) et de remplir automatiquement le formulaire de création via l'API Claude (vision).

---

## Architecture

### Backend

**Nouvel endpoint :** `POST /api/purchase-invoices/extract`

- **Auth :** JWT requis (même que les autres endpoints)
- **Request body :**
  ```json
  { "name": "facture.pdf", "type": "application/pdf", "data": "data:application/pdf;base64,..." }
  ```
- **Response body :** `ExtractedInvoiceDto` — tous les champs sont nullable (extraction partielle acceptée)
  ```json
  {
    "supplierName": "Acme Fournitures SARL",
    "supplierInvoiceRef": "FA-2026-00842",
    "issueDate": "2026-05-15",
    "dueDate": "2026-06-15",
    "currency": "TND",
    "purchaseCategory": "401000",
    "paymentMethod": "Virement bancaire",
    "lineItems": [
      { "description": "Fournitures bureau", "qty": 2, "priceHT": 150.00, "discPct": 0, "vatPct": 19 }
    ]
  }
  ```
- **Erreurs :**
  - `400` — fichier manquant ou type non supporté
  - `500` — échec API Claude ou timeout (30s)
- **Extraction partielle :** si Claude ne détecte pas certains champs, ils sont `null` — la réponse 200 est quand même retournée avec ce qui a été extrait

**Nouveau package :** `com.compta.purchaseinvoice.extraction`
- `InvoiceExtractionController` — endpoint `/extract`
- `InvoiceExtractionService` — appel API Claude via Anthropic Java SDK
- `ExtractedInvoiceDto` — record Java avec tous les champs nullable

**Appel Claude :**
- Modèle : `claude-sonnet-4-5` (bon équilibre vitesse / précision)
- Claude supporte nativement PDF et images — pas de conversion nécessaire
- Prompt système : extraction structurée en JSON, champs explicitement listés
- Clé API : variable d'environnement `ANTHROPIC_API_KEY`

---

### Frontend

**Nouvelle section "00 — Import facture fournisseur"** insérée avant la section 01, visible uniquement en **create mode**.

**3 états de la section :**

1. **Zone d'upload** (état initial)
   - Drag & drop ou clic pour parcourir
   - Formats : PDF, JPG, PNG, WEBP — 10 Mo max (même contraintes que section 04)

2. **Extraction en cours**
   - Spinner + message "Analyse de la facture en cours… ~10 secondes"
   - Bouton annuler non présent (attente passive)

3. **Résultat**
   - Succès : badge vert + résumé "X champs remplis" + bouton "Recommencer"
   - Erreur : badge rouge + message d'erreur + bouton "Réessayer"

**Auto-fill des signals après extraction réussie :**
- `supplierInvoiceRef`, `issueDate`, `dueDate`, `currency`, `purchaseCategory`, `paymentMethod` → appliqués directement
- `lineItems` → remplacent les lignes existantes
- `attachment` → fichier défini comme pièce jointe (section 04 affiche l'aperçu)

**Matching fournisseur (côté frontend) :**
- Liste des fournisseurs déjà chargée en mémoire (`allSuppliers` signal)
- Normalisation : lowercase + suppression accents + trim
- Algorithme : si le nom extrait est contenu dans `companyName` ou vice-versa → match candidat
- Fallback : score Levenshtein, seuil 75%
- Si match trouvé → `selectedSupplier.set(match)` silencieusement
- Si aucun match → fournisseur laissé vide, l'utilisateur sélectionne manuellement

**Les champs pré-remplis restent tous éditables.** Aucun verrouillage.

---

## Flux de données

```
Utilisateur dépose fichier
  → frontend lit le fichier (FileReader.readAsDataURL)
  → POST /api/purchase-invoices/extract { name, type, data }
    → InvoiceExtractionService appelle Claude API (vision)
    → Claude retourne JSON structuré
    → backend mappe vers ExtractedInvoiceDto
  → frontend reçoit ExtractedInvoiceDto
  → applique les champs aux signals
  → fuzzy-match fournisseur sur allSuppliers
  → attachment.set({ name, type, size, data })
  → affiche état "Extraction réussie"
```

---

## Gestion des erreurs

| Cas | Comportement |
|---|---|
| Fichier trop grand (>10 Mo) | Validation frontend, message immédiat, pas d'appel API |
| Type non supporté | Validation frontend |
| Timeout Claude (>30s) | 500 backend → message "L'analyse a pris trop de temps. Réessayez." |
| Erreur API Claude | 500 backend → message générique + bouton Réessayer |
| Extraction partielle | 200 avec champs null → appliqués quand même, champs vides laissés à l'utilisateur |
| Aucun champ extrait | 200 avec tout null → message "Aucune information détectée. Remplissez manuellement." |

---

## Ce qui n'est PAS dans ce scope

- Mode édition (edit mode) — la section d'import n'apparaît pas en edit
- Score de confiance par champ — prévu en v2
- Support multipage (plusieurs factures à la fois)
- Historique des extractions

---

## Dépendances à ajouter

**Backend (`pom.xml`) :**
```xml
<dependency>
  <groupId>com.anthropic</groupId>
  <artifactId>anthropic-java</artifactId>
  <version>0.8.0</version>
</dependency>
```

**Env var requise :**
```
ANTHROPIC_API_KEY=sk-ant-...
```
À ajouter dans `application-dev.yml` (valeur fictive) et documenter dans CLAUDE.md.
