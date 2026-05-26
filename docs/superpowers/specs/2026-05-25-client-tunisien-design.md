# Spec — Adaptation table clients pour la Tunisie

**Date:** 2026-05-25
**Statut:** Approuvé

## Contexte

La table `clients` (et `suppliers`) était calquée sur la réglementation française (SIRET, APE, EUR, France, TVA 20%). L'application étant destinée à des clients tunisiens, elle doit refléter les identifiants légaux, fiscaux et administratifs tunisiens.

## Changements Base de Données (V2)

### Table `clients`

| Action | Colonne | Avant | Après |
|---|---|---|---|
| Supprimer | `siret` | VARCHAR(14) | — |
| Supprimer | `ape_code` | VARCHAR(10) | — |
| Renommer | `vat_number` → `matricule_fiscal` | VARCHAR(50) | VARCHAR(20) |
| Ajouter | `rne_number` | — | VARCHAR(20) |
| Ajouter | `gouvernorat` | — | VARCHAR(50) |
| Ajouter | `delegation` | — | VARCHAR(100) |
| Ajouter | `assujetti_tva` | — | BOOLEAN NOT NULL DEFAULT TRUE |
| Ajouter | `regime_fiscal` | — | VARCHAR(20) NOT NULL DEFAULT 'REEL' |
| Modifier | `currency` default | `EUR` | `TND` |
| Modifier | `country` default | `France` | `Tunisie` |
| Modifier | `default_vat_rate` default | `20.00` | `19.00` |

Mêmes changements appliqués à la table `suppliers`.

## Changements Backend (Java/Spring Boot)

### `Client.java` (entity)
- Supprimer champs : `siret`, `apeCode`
- Renommer : `vatNumber` → `matriculeFiscal` (colonne: `matricule_fiscal`)
- Ajouter : `rneNumber`, `gouvernorat`, `delegation`, `assujettiTva`, `regimeFiscal`
- Mettre à jour les valeurs par défaut

### `ClientRequest.java` (DTO)
- Restructurer en 4 sections :
  - `LegalDto` : name, legalForm, rneNumber, matriculeFiscal, regimeFiscal, assujettiTva, website
  - `ContactDto` : fullName, role, email, phone (inchangé)
  - `AddressDto` : streetNumber, streetName, complement, city, gouvernorat, delegation, postalCode, country
  - `FinancialDto` : currency, paymentTerms, maxCredit, defaultVatRate, discountRate

### `ClientResponse.java`
- Refléter la même structure que `ClientRequest`

### `ClientService.java`
- Mettre à jour `applyRequest()` pour mapper les nouveaux champs

## Changements Frontend (Angular 17)

### `client.model.ts`
- Mettre à jour les interfaces : `ClientLegal`, `ClientAddress`, `ClientFinancial`, `CreateClientDto`, `Client`
- Ajouter la liste des 24 gouvernorats tunisiens en dur

### `new-client.component.ts`
- Section 01 (Légal) : rneNumber, matriculeFiscal, regimeFiscal, assujettiTva
- Section 03 (Adresse) : gouvernorat (dropdown 24 options), delegation
- Defaults : currency=TND, country=Tunisie, defaultVatRate=19

### `new-client.component.html`
- Section 01 : remplacer champs SIRET/APE par RNE/matricule fiscal/régime fiscal/assujetti TVA
- Section 03 : ajouter dropdown gouvernorat + champ délégation

## Gouvernorats (24)

Tunis, Ariana, Ben Arous, Manouba, Nabeul, Zaghouan, Bizerte, Béja, Jendouba, Le Kef, Siliana, Sousse, Monastir, Mahdia, Sfax, Kairouan, Kasserine, Sidi Bouzid, Gabès, Medenine, Tataouine, Gafsa, Tozeur, Kébili
