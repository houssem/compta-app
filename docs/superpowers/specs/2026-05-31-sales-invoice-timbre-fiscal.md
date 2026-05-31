# Timbre Fiscal — Sales & Purchase Invoices

**Date:** 2026-05-31

## Goal

Add "Timbre fiscal" support to both sales and purchase invoices:

- **Sales invoices:** automatically applied (1 TND) when the client's country is `'Tunisie'`, persisted, shown in summary sidebar, included in `totalTtc`.
- **Purchase invoices:** extracted from the uploaded document by AI (value may vary), persisted, shown in summary sidebar, included in `totalTtc`.

---

## Part 1 — Sales Invoices

### Backend

#### Migration V13

```sql
ALTER TABLE sales_invoices
  ADD COLUMN timbre_fiscal DECIMAL(15,2) NOT NULL DEFAULT 0;
```

#### Entity — `SalesInvoice.java`

Add after `totalTtc`:

```java
@Column(name = "timbre_fiscal", nullable = false, precision = 15, scale = 2)
private BigDecimal timbreFiscal = BigDecimal.ZERO;
```

#### Request — `SalesInvoiceRequest.java`

Add one record component (nullable — treated as zero if absent):

```java
BigDecimal timbreFiscal,
```

#### Response — `SalesInvoiceResponse.java`

Add `timbreFiscal` to the record and populate it in `from(SalesInvoice inv)`.

#### Service — `SalesInvoiceService.java`

In `applyRequest()`:

```java
invoice.setTimbreFiscal(req.timbreFiscal() != null ? req.timbreFiscal() : BigDecimal.ZERO);
invoice.setTotalTtc(totalHt.add(totalVat).add(invoice.getTimbreFiscal()));
```

### Frontend

#### Detection

```ts
selectedClient()?.address?.country === 'Tunisie'
```

#### `new-invoice.component.ts`

New computed signal:
```ts
timbreFiscal = computed(() =>
  this.selectedClient()?.address?.country === 'Tunisie' ? 1 : 0
)
```

Updated `totalTTC`:
```ts
totalTTC = computed(() => this.totalHT() + this.totalVAT() + this.timbreFiscal())
```

`save()` payload: add `timbreFiscal: this.timbreFiscal()`

`patchFromInvoice()`: no change needed — recomputed from selected client.

`StoredInvoice` interface: add `timbreFiscal?: number`

#### Summary sidebar — `new-invoice.component.html`

Insert between the TVA block and the TTC bar:

```html
@if (timbreFiscal() > 0) {
  <div class="ni-summary__row">
    <span class="ni-summary__label">Timbre fiscal</span>
    <span class="ni-summary__value">{{ formatAmount(timbreFiscal()) }}</span>
  </div>
}
```

No new SCSS needed — reuses `.ni-summary__row`.

---

## Part 2 — Purchase Invoices (field + AI extraction)

### Backend

#### Migration V14

```sql
ALTER TABLE purchase_invoices
  ADD COLUMN timbre_fiscal DECIMAL(15,2) NOT NULL DEFAULT 0;
```

#### Entity — `PurchaseInvoice.java`

Add after the existing extra-fields block:

```java
@Column(name = "timbre_fiscal", nullable = false, precision = 15, scale = 2)
private BigDecimal timbreFiscal = BigDecimal.ZERO;
```

#### Request — `PurchaseInvoiceRequest.java`

Add one record component (nullable):

```java
BigDecimal timbreFiscal,
```

#### Response — `PurchaseInvoiceResponse.java`

Add `timbreFiscal` to the record and populate it in `from(PurchaseInvoice inv)`.

#### Service — `PurchaseInvoiceService.java`

In `applyRequest()`:

```java
invoice.setTimbreFiscal(req.timbreFiscal() != null ? req.timbreFiscal() : BigDecimal.ZERO);
```

Update `totalTtc` to include timbre fiscal:
```java
invoice.setTotalTtc(totalHt.add(totalVat).add(invoice.getTimbreFiscal()));
```

#### AI Extraction — `ExtractedInvoiceDto.java`

Add one field:

```java
public record ExtractedInvoiceDto(
        String supplierName,
        String supplierInvoiceRef,
        String issueDate,
        String dueDate,
        String currency,
        String purchaseCategory,
        String paymentMethod,
        BigDecimal timbreFiscal,   // ← new: null if not found on the document
        List<LineItemDto> lineItems
) { ... }
```

#### AI Extraction — `InvoiceExtractionService.java`

Update the `PROMPT` constant to include `timbreFiscal` in the JSON structure:

```
"timbreFiscal": 1.000 or null if not present on the document,
```

Full updated required structure in the prompt:
```json
{
  "supplierName": "...",
  "supplierInvoiceRef": "...",
  "issueDate": "YYYY-MM-DD or null",
  "dueDate": "YYYY-MM-DD or null",
  "currency": "TND, EUR, USD or null",
  "purchaseCategory": "... or null",
  "paymentMethod": "... or null",
  "timbreFiscal": 1.000,
  "lineItems": [...]
}
```

### Frontend

#### Model — `purchase-invoice.model.ts`

`StoredPurchaseInvoice`: add `timbreFiscal?: number`

`CreatePurchaseInvoicePayload`: add `timbreFiscal: number`

`ExtractedInvoice`: add `timbreFiscal?: number | null`

#### `new-purchase-invoice.component.ts`

New signal (not computed — can be set by AI extraction or default to 0):
```ts
timbreFiscal = signal(0)
```

Updated `totalTTC`:
```ts
totalTTC = computed(() => this.totalHT() + this.totalVAT() + this.timbreFiscal())
```

`applyExtractedData()`: if extracted value is present, apply it:
```ts
if (extracted.timbreFiscal != null) { this.timbreFiscal.set(Number(extracted.timbreFiscal)); count++ }
```

`patchFromInvoice()`: restore persisted value on edit load:
```ts
this.timbreFiscal.set(inv.timbreFiscal ?? 0)
```

`save()` payload: add `timbreFiscal: this.timbreFiscal()`

#### Summary sidebar — `new-purchase-invoice.component.html`

Insert between TVA block and TTC bar (same as sales invoice):

```html
@if (timbreFiscal() > 0) {
  <div class="ni-summary__row">
    <span class="ni-summary__label">Timbre fiscal</span>
    <span class="ni-summary__value">{{ formatAmount(timbreFiscal()) }}</span>
  </div>
}
```

---

## Out of scope

- No manual override — timbre fiscal value is computed (sales) or extracted (purchase).
- No change to `ApiPurchaseInvoice` list view (out of scope for the list page).
- No new SCSS classes needed in either component.
