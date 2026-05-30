# Design: Purchase Invoice — Extra Fields (FACT-1 alignment)

**Date:** 2026-05-28
**Branch:** feat/FACT-1-Facture-achat
**Scope:** Add `supplierInvoiceRef` (required), `purchaseCategory` (optional), and `paymentMethod` (optional) to the create/edit purchase invoice form and backend, with duplicate detection on `supplierInvoiceRef`.

---

## Context

The existing "create facture d'achat" screen is missing three fields defined in the FACT-2.md product spec (§5.2):

| Field | Spec label | Required |
|---|---|---|
| `supplierInvoiceRef` | Réf. facture fournisseur | Yes |
| `purchaseCategory` | Catégorie achat | No |
| `paymentMethod` | Mode de paiement | No |

The auto-generated internal reference (`invoiceNumber`, format `ACH-YYYY-XXXX`) is kept as-is. `supplierInvoiceRef` is a separate field for the number printed on the supplier's paper invoice — used for reconciliation and required by the spec.

The spec explicitly warns against duplicate supplier invoice numbers ("Une facture en double provoque une erreur de TVA et un solde fournisseur incorrect"), so duplicate detection is included.

Status values (`reçue`, `validée`, `payée`, `en retard`) and `dueDate` required validation are unchanged.

---

## Data Model

### Flyway migration `V12__purchase_invoice_extra_fields.sql`

```sql
ALTER TABLE purchase_invoices ADD COLUMN supplier_invoice_ref VARCHAR(100);
ALTER TABLE purchase_invoices ADD COLUMN purchase_category    VARCHAR(100);
ALTER TABLE purchase_invoices ADD COLUMN payment_method       VARCHAR(50);
```

All columns are nullable (existing rows have no value). Uniqueness is enforced at the application layer (per `supplierId + companyId`), not via a DB unique constraint, to allow flexibility.

---

## Backend Changes

### Entity — `PurchaseInvoice.java`
Add three fields:
- `supplierInvoiceRef` — `@Column(name = "supplier_invoice_ref", length = 100)`
- `purchaseCategory` — `@Column(name = "purchase_category", length = 100)`
- `paymentMethod` — `@Column(name = "payment_method", length = 50)`

### Request DTO — `PurchaseInvoiceRequest.java`
Add three record components:
- `@NotBlank String supplierInvoiceRef` — validated as required on all create/update calls
- `String purchaseCategory` — optional
- `String paymentMethod` — optional

### Response DTO — `PurchaseInvoiceResponse.java`
Add three fields to the record and populate them in `from(PurchaseInvoice)`.

### Repository — `PurchaseInvoiceRepository.java`
Add two derived queries for duplicate detection:
```java
boolean existsBySupplierInvoiceRefAndSupplierIdAndCompanyId(
    String ref, UUID supplierId, UUID companyId);

boolean existsBySupplierInvoiceRefAndSupplierIdAndCompanyIdAndIdNot(
    String ref, UUID supplierId, UUID companyId, UUID excludeId);
```

### Service — `PurchaseInvoiceService.java`

**Duplicate check:**
- On **create**: call `existsBySupplierInvoiceRefAndSupplierIdAndCompanyId`
- On **update**: call `existsBySupplierInvoiceRefAndSupplierIdAndCompanyIdAndIdNot` (excludes self)
- Both throw `ApiException.conflict("La référence facture fournisseur existe déjà pour ce fournisseur.")` if a duplicate is found

**`applyRequest`** sets the 3 new fields from the DTO.

---

## Frontend Changes

### Model — `purchase-invoice.model.ts`
Add to `StoredPurchaseInvoice`, `ApiPurchaseInvoice`, and `CreatePurchaseInvoicePayload`:
```ts
supplierInvoiceRef: string
purchaseCategory?: string
paymentMethod?: string
```

### Component TS — `new-purchase-invoice.component.ts`
- Add signals: `supplierInvoiceRef = signal('')`, `purchaseCategory = signal('')`, `paymentMethod = signal('')`
- Add error computed: `supplierInvoiceRefError = computed(() => this.formSubmitted() && !this.supplierInvoiceRef().trim())`
- Update `isFormValid` to require `supplierInvoiceRef().trim() !== ''`
- Update `patchFromInvoice` to set the 3 signals from the loaded invoice
- Update `save()` payload to include the 3 fields
- Add constants:

```ts
readonly purchaseCategoryOptions = [
  'Achats de marchandises',
  'Achats de matières et fournitures',
  'Matériel informatique',
  'Matériel de transport',
  'Locations',
  'Honoraires',
  'Frais de déplacement',
  'Publicité et communication',
  'Charges financières',
  'Achat étranger',
  'Autre',
]

readonly paymentMethodOptions = [
  'Virement bancaire',
  'Chèque',
  'Traite',
  'Prélèvement',
]
```

### Component HTML — `new-purchase-invoice.component.html`
In section 01 "Informations générales", add after the existing `issueDate/dueDate/currency` row:

```
Row: [supplierInvoiceRef (span2)] [purchaseCategory (span2)]
Row: [paymentMethod (span2)]
```

- `supplierInvoiceRef` — text input, required, shows `ni-field-error` on `supplierInvoiceRefError()`
- `purchaseCategory` — `<select>` with a blank first option, then `purchaseCategoryOptions`
- `paymentMethod` — `<select>` with a blank first option, then `paymentMethodOptions`

**Error handling:** 409 conflict from the backend surfaces via the existing `saveError` signal — no extra frontend logic needed.

---

## Out of Scope

- Surfacing `supplierInvoiceRef` as a column in the purchase invoice list view
- Changing status values
- Making `dueDate` optional
