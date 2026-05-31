# Timbre Fiscal on Sales Invoices — Design Spec

**Date:** 2026-05-31

## Goal

Add "Timbre fiscal" (1 TND) to Tunisian sales invoices. It is applied automatically when the selected client's country is `'Tunisie'`, not applied for international clients. It is persisted on the backend and included in `totalTtc`. It is shown as a line in the summary sidebar on the frontend.

---

## Backend

### Migration — V13

```sql
ALTER TABLE sales_invoices
  ADD COLUMN timbre_fiscal DECIMAL(15,2) NOT NULL DEFAULT 0;
```

### Entity — `SalesInvoice.java`

Add one field after `totalTtc`:

```java
@Column(name = "timbre_fiscal", nullable = false, precision = 15, scale = 2)
private BigDecimal timbreFiscal = BigDecimal.ZERO;
```

### Request — `SalesInvoiceRequest.java`

Add one record component (nullable — treated as zero if absent):

```java
BigDecimal timbreFiscal,
```

### Response — `SalesInvoiceResponse.java`

Add `timbreFiscal` to the record and populate it in `from(SalesInvoice inv)`.

### Service — `SalesInvoiceService.java`

In `applyRequest()`:

1. Set timbre fiscal on the entity:
   ```java
   invoice.setTimbreFiscal(req.timbreFiscal() != null ? req.timbreFiscal() : BigDecimal.ZERO);
   ```

2. Include it when computing `totalTtc`:
   ```java
   invoice.setTotalTtc(totalHt.add(totalVat).add(invoice.getTimbreFiscal()));
   ```

---

## Frontend

### Detection

Timbre fiscal applies when:
```ts
selectedClient()?.address?.country === 'Tunisie'
```

### New computed signal — `new-invoice.component.ts`

```ts
timbreFiscal = computed(() =>
  this.selectedClient()?.address?.country === 'Tunisie' ? 1 : 0
)
```

### Updated `totalTTC`

```ts
totalTTC = computed(() => this.totalHT() + this.totalVAT() + this.timbreFiscal())
```

### `save()` payload

Add to the payload object:
```ts
timbreFiscal: this.timbreFiscal(),
```

### `patchFromInvoice()`

No change needed — `timbreFiscal` is recomputed from the selected client on every load.

### Summary sidebar — `new-invoice.component.html`

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

## Out of scope

- No change to purchase invoices (timbre fiscal is a sales invoice concept in Tunisia).
- No manual override checkbox — the value is always 0 or 1 based on client country.
- `StoredInvoice` interface in the frontend should add `timbreFiscal?: number` for completeness, but the computed signal drives the UI regardless.
