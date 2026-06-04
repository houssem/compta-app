# Timbre Fiscal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `timbreFiscal` to sales invoices (1 TND, auto-computed for Tunisian clients) and purchase invoices (AI-extracted, variable amount), persisted in both backends and shown in the summary sidebar.

**Architecture:** Two independent data flows share the same UI pattern — a `@if (timbreFiscal() > 0)` row in the summary sidebar between the TVA block and TTC bar. Sales: computed signal driven by client country. Purchase: writable signal populated by AI extraction or edit-mode restore.

**Tech Stack:** Spring Boot 3, Java 17, Flyway, Angular 17 signals, Jackson deserialization.

---

## File Map

| File | Change |
|---|---|
| `db/migration/V13__sales_invoice_timbre_fiscal.sql` | CREATE |
| `db/migration/V14__purchase_invoice_timbre_fiscal.sql` | CREATE |
| `com/compta/invoice/entity/SalesInvoice.java` | MODIFY — add field |
| `com/compta/invoice/dto/SalesInvoiceRequest.java` | MODIFY — add record component |
| `com/compta/invoice/dto/SalesInvoiceResponse.java` | MODIFY — add record component + `from()` |
| `com/compta/invoice/service/SalesInvoiceService.java` | MODIFY — applyRequest totalTtc |
| `com/compta/purchaseinvoice/entity/PurchaseInvoice.java` | MODIFY — add field |
| `com/compta/purchaseinvoice/dto/PurchaseInvoiceRequest.java` | MODIFY — add record component |
| `com/compta/purchaseinvoice/dto/PurchaseInvoiceResponse.java` | MODIFY — add record component + `from()` |
| `com/compta/purchaseinvoice/service/PurchaseInvoiceService.java` | MODIFY — applyRequest totalTtc |
| `com/compta/purchaseinvoice/extraction/ExtractedInvoiceDto.java` | MODIFY — add field |
| `com/compta/purchaseinvoice/extraction/InvoiceExtractionService.java` | MODIFY — PROMPT |
| `com/compta/purchaseinvoice/extraction/InvoiceExtractionServiceTest.java` | MODIFY — update tests |
| `src/app/features/invoices/new-invoice/new-invoice.component.ts` | MODIFY — computed signal, totalTTC, save, StoredInvoice |
| `src/app/features/invoices/new-invoice/new-invoice.component.html` | MODIFY — summary row |
| `src/app/shared/models/purchase-invoice.model.ts` | MODIFY — three interfaces |
| `src/app/features/purchase-invoices/new-purchase-invoice/new-purchase-invoice.component.ts` | MODIFY — signal, totalTTC, applyExtractedData, patchFromInvoice, save |
| `src/app/features/purchase-invoices/new-purchase-invoice/new-purchase-invoice.component.html` | MODIFY — summary row |

---

### Task 1: Backend migrations + entities

**Files:**
- Create: `comptabilite-backend/src/main/resources/db/migration/V13__sales_invoice_timbre_fiscal.sql`
- Create: `comptabilite-backend/src/main/resources/db/migration/V14__purchase_invoice_timbre_fiscal.sql`
- Modify: `comptabilite-backend/src/main/java/com/compta/invoice/entity/SalesInvoice.java`
- Modify: `comptabilite-backend/src/main/java/com/compta/purchaseinvoice/entity/PurchaseInvoice.java`

- [ ] **Step 1: Create V13 migration**

File: `comptabilite-backend/src/main/resources/db/migration/V13__sales_invoice_timbre_fiscal.sql`
```sql
ALTER TABLE sales_invoices
  ADD COLUMN timbre_fiscal DECIMAL(15,2) NOT NULL DEFAULT 0;
```

- [ ] **Step 2: Create V14 migration**

File: `comptabilite-backend/src/main/resources/db/migration/V14__purchase_invoice_timbre_fiscal.sql`
```sql
ALTER TABLE purchase_invoices
  ADD COLUMN timbre_fiscal DECIMAL(15,2) NOT NULL DEFAULT 0;
```

- [ ] **Step 3: Add field to SalesInvoice entity**

In `SalesInvoice.java`, add after the `totalTtc` field:
```java
@Column(name = "timbre_fiscal", nullable = false, precision = 15, scale = 2)
private BigDecimal timbreFiscal = BigDecimal.ZERO;
```
Add getter/setter (or use Lombok `@Getter @Setter` if the class already uses it — check the class).

- [ ] **Step 4: Add field to PurchaseInvoice entity**

In `PurchaseInvoice.java`, add after the `totalTtc` field:
```java
@Column(name = "timbre_fiscal", nullable = false, precision = 15, scale = 2)
private BigDecimal timbreFiscal = BigDecimal.ZERO;
```
Add getter/setter (or Lombok — match existing class style).

- [ ] **Step 5: Start backend and verify migrations run**

```bash
cd comptabilite-backend
mvn spring-boot:run
```

Expected: Application starts on :8080 with no migration errors. H2 console at `http://localhost:8080/h2-console` should show `TIMBRE_FISCAL` column on both tables.

Stop the server (Ctrl+C) once confirmed.

- [ ] **Step 6: Commit**

```bash
git add comptabilite-backend/src/main/resources/db/migration/V13__sales_invoice_timbre_fiscal.sql
git add comptabilite-backend/src/main/resources/db/migration/V14__purchase_invoice_timbre_fiscal.sql
git add comptabilite-backend/src/main/java/com/compta/invoice/entity/SalesInvoice.java
git add comptabilite-backend/src/main/java/com/compta/purchaseinvoice/entity/PurchaseInvoice.java
git commit -m "feat(timbre-fiscal): add timbre_fiscal column to sales and purchase invoice tables"
```

---

### Task 2: Sales invoice — DTO and service

**Files:**
- Modify: `comptabilite-backend/src/main/java/com/compta/invoice/dto/SalesInvoiceRequest.java`
- Modify: `comptabilite-backend/src/main/java/com/compta/invoice/dto/SalesInvoiceResponse.java`
- Modify: `comptabilite-backend/src/main/java/com/compta/invoice/service/SalesInvoiceService.java`

- [ ] **Step 1: Add `timbreFiscal` to SalesInvoiceRequest**

In `SalesInvoiceRequest.java`, add one record component (nullable — treated as zero if absent):
```java
BigDecimal timbreFiscal,
```
Place it after the existing fields (before the closing parenthesis of the record). Exact position: after `termsAndConditions` or the last existing component.

- [ ] **Step 2: Add `timbreFiscal` to SalesInvoiceResponse**

In `SalesInvoiceResponse.java`:

1. Add to the record:
```java
BigDecimal timbreFiscal,
```
Place it after `totalTTC`.

2. In the `from(SalesInvoice inv)` factory method, add:
```java
inv.getTimbreFiscal(),
```
at the matching position.

- [ ] **Step 3: Update SalesInvoiceService.applyRequest()**

In `SalesInvoiceService.java`, inside `applyRequest()`:

Add this line to set timbreFiscal on the invoice (before computing `totalTtc`):
```java
invoice.setTimbreFiscal(req.timbreFiscal() != null ? req.timbreFiscal() : BigDecimal.ZERO);
```

Then update the `setTotalTtc` call to include timbreFiscal. Replace the existing line that sets `totalTtc` with:
```java
invoice.setTotalTtc(totalHt.add(totalVat).add(invoice.getTimbreFiscal()));
```

(Where `totalHt` and `totalVat` are the local variables computed from line items — match the exact variable names already in the method.)

- [ ] **Step 4: Run tests**

```bash
cd comptabilite-backend
mvn test
```

Expected: All tests pass (no sales invoice tests exist yet; extraction tests still pass).

- [ ] **Step 5: Commit**

```bash
git add comptabilite-backend/src/main/java/com/compta/invoice/dto/SalesInvoiceRequest.java
git add comptabilite-backend/src/main/java/com/compta/invoice/dto/SalesInvoiceResponse.java
git add comptabilite-backend/src/main/java/com/compta/invoice/service/SalesInvoiceService.java
git commit -m "feat(timbre-fiscal): wire timbreFiscal into sales invoice DTO and totalTtc"
```

---

### Task 3: Purchase invoice — DTO and service

**Files:**
- Modify: `comptabilite-backend/src/main/java/com/compta/purchaseinvoice/dto/PurchaseInvoiceRequest.java`
- Modify: `comptabilite-backend/src/main/java/com/compta/purchaseinvoice/dto/PurchaseInvoiceResponse.java`
- Modify: `comptabilite-backend/src/main/java/com/compta/purchaseinvoice/service/PurchaseInvoiceService.java`

- [ ] **Step 1: Add `timbreFiscal` to PurchaseInvoiceRequest**

In `PurchaseInvoiceRequest.java`, add one nullable record component:
```java
BigDecimal timbreFiscal,
```
Place it after `paymentMethod` (before `lineItems`).

- [ ] **Step 2: Add `timbreFiscal` to PurchaseInvoiceResponse**

In `PurchaseInvoiceResponse.java`:

1. Add to the record:
```java
BigDecimal timbreFiscal,
```
Place it after `totalTTC`.

2. In the `from(PurchaseInvoice inv)` factory method, add:
```java
inv.getTimbreFiscal(),
```
at the matching position.

- [ ] **Step 3: Update PurchaseInvoiceService.applyRequest()**

In `PurchaseInvoiceService.java`, inside `applyRequest()`:

Add before the `totalTtc` computation:
```java
invoice.setTimbreFiscal(req.timbreFiscal() != null ? req.timbreFiscal() : BigDecimal.ZERO);
```

Then update the `setTotalTtc` line to include timbreFiscal. The existing code computes `totalTtc` from line items and calls `invoice.setTotalTtc(totalTtc)`. Change the final `setTotalTtc` call to:
```java
invoice.setTotalTtc(totalHt.add(totalVat).add(invoice.getTimbreFiscal()));
```

(Match the exact local variable names already in the method — the variables that hold the sum of all line HT and VAT.)

- [ ] **Step 4: Run tests**

```bash
cd comptabilite-backend
mvn test
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add comptabilite-backend/src/main/java/com/compta/purchaseinvoice/dto/PurchaseInvoiceRequest.java
git add comptabilite-backend/src/main/java/com/compta/purchaseinvoice/dto/PurchaseInvoiceResponse.java
git add comptabilite-backend/src/main/java/com/compta/purchaseinvoice/service/PurchaseInvoiceService.java
git commit -m "feat(timbre-fiscal): wire timbreFiscal into purchase invoice DTO and totalTtc"
```

---

### Task 4: AI extraction — ExtractedInvoiceDto + prompt + tests

**Files:**
- Modify: `comptabilite-backend/src/main/java/com/compta/purchaseinvoice/extraction/ExtractedInvoiceDto.java`
- Modify: `comptabilite-backend/src/main/java/com/compta/purchaseinvoice/extraction/InvoiceExtractionService.java`
- Modify: `comptabilite-backend/src/test/java/com/compta/purchaseinvoice/extraction/InvoiceExtractionServiceTest.java`

- [ ] **Step 1: Write a failing test for `timbreFiscal` parsing**

In `InvoiceExtractionServiceTest.java`, add a new test method after the existing `parseAiResponse_shouldMapAllFields` test:

```java
@Test
void parseAiResponse_shouldExtractTimbreFiscal() throws Exception {
    String json = """
            {
              "supplierName": "Test SARL",
              "supplierInvoiceRef": null,
              "issueDate": null, "dueDate": null, "currency": null,
              "purchaseCategory": null, "paymentMethod": null,
              "timbreFiscal": 1.000,
              "lineItems": []
            }
            """;
    ExtractedInvoiceDto result = service.parseAiResponse(json);
    assertThat(result.timbreFiscal()).isEqualByComparingTo(new BigDecimal("1.000"));
}

@Test
void parseAiResponse_shouldHandleNullTimbreFiscal() throws Exception {
    String json = """
            {
              "supplierName": null, "supplierInvoiceRef": null,
              "issueDate": null, "dueDate": null, "currency": null,
              "purchaseCategory": null, "paymentMethod": null,
              "timbreFiscal": null,
              "lineItems": []
            }
            """;
    ExtractedInvoiceDto result = service.parseAiResponse(json);
    assertThat(result.timbreFiscal()).isNull();
}
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd comptabilite-backend
mvn test -Dtest=InvoiceExtractionServiceTest
```

Expected: FAIL — `result.timbreFiscal()` method does not exist.

- [ ] **Step 3: Add `timbreFiscal` field to ExtractedInvoiceDto**

Replace the record in `ExtractedInvoiceDto.java` with:

```java
public record ExtractedInvoiceDto(
        String supplierName,
        String supplierInvoiceRef,
        String issueDate,
        String dueDate,
        String currency,
        String purchaseCategory,
        String paymentMethod,
        BigDecimal timbreFiscal,
        List<LineItemDto> lineItems
) {
    public record LineItemDto(
            String description,
            BigDecimal qty,
            BigDecimal priceHT,
            BigDecimal discPct,
            BigDecimal vatPct
    ) {}
}
```

- [ ] **Step 4: Update the fallback return values in InvoiceExtractionService**

In `InvoiceExtractionService.java`, there are two catch blocks that return an empty `ExtractedInvoiceDto`. Both currently have 8 arguments. Add `null` as the 8th argument (before `List.of()`):

Find both occurrences of:
```java
return new ExtractedInvoiceDto(null, null, null, null, null, null, null, List.of());
```

Replace with:
```java
return new ExtractedInvoiceDto(null, null, null, null, null, null, null, null, List.of());
```

- [ ] **Step 5: Update the PROMPT to include timbreFiscal**

In `InvoiceExtractionService.java`, replace the `PROMPT` constant with:

```java
private static final String PROMPT = """
        You are an invoice data extractor. Extract the following fields from this invoice \
        and return ONLY a valid JSON object — no markdown, no extra text.

        Required structure (use null for missing fields, empty array for missing line items):
        {
          "supplierName": "supplier company name",
          "supplierInvoiceRef": "invoice reference or number",
          "issueDate": "YYYY-MM-DD or null",
          "dueDate": "YYYY-MM-DD or null",
          "currency": "3-letter code such as TND, EUR, USD — or null",
          "purchaseCategory": "accounting category or null",
          "paymentMethod": "payment method or null",
          "timbreFiscal": 1.000 or null if not present on the document,
          "lineItems": [
            { "description": "text", "qty": 1, "priceHT": 0.00, "discPct": 0, "vatPct": 19 }
          ]
        }
        """;
```

- [ ] **Step 6: Update the existing full-fields test to include timbreFiscal**

In `InvoiceExtractionServiceTest.java`, update `parseAiResponse_shouldMapAllFields` to add `"timbreFiscal": 1.000` to the JSON and assert:
```java
assertThat(result.timbreFiscal()).isEqualByComparingTo(new BigDecimal("1.000"));
```

Updated test:
```java
@Test
void parseAiResponse_shouldMapAllFields() throws Exception {
    String json = """
            {
              "supplierName": "Acme SARL",
              "supplierInvoiceRef": "FA-2026-001",
              "issueDate": "2026-05-15",
              "dueDate": "2026-06-15",
              "currency": "TND",
              "purchaseCategory": "401000",
              "paymentMethod": "Virement bancaire",
              "timbreFiscal": 1.000,
              "lineItems": [
                { "description": "Fournitures", "qty": 2, "priceHT": 150.00, "discPct": 0, "vatPct": 19 }
              ]
            }
            """;
    ExtractedInvoiceDto result = service.parseAiResponse(json);
    assertThat(result.supplierName()).isEqualTo("Acme SARL");
    assertThat(result.issueDate()).isEqualTo("2026-05-15");
    assertThat(result.timbreFiscal()).isEqualByComparingTo(new BigDecimal("1.000"));
    assertThat(result.lineItems()).hasSize(1);
    assertThat(result.lineItems().get(0).qty()).isEqualByComparingTo(new BigDecimal("2"));
}
```

- [ ] **Step 7: Run tests to verify they pass**

```bash
cd comptabilite-backend
mvn test -Dtest=InvoiceExtractionServiceTest
```

Expected: All 7 tests PASS.

- [ ] **Step 8: Run full test suite**

```bash
cd comptabilite-backend
mvn test
```

Expected: All tests pass.

- [ ] **Step 9: Commit**

```bash
git add comptabilite-backend/src/main/java/com/compta/purchaseinvoice/extraction/ExtractedInvoiceDto.java
git add comptabilite-backend/src/main/java/com/compta/purchaseinvoice/extraction/InvoiceExtractionService.java
git add comptabilite-backend/src/test/java/com/compta/purchaseinvoice/extraction/InvoiceExtractionServiceTest.java
git commit -m "feat(timbre-fiscal): add timbreFiscal to AI extraction DTO and prompt"
```

---

### Task 5: Frontend — sales invoice timbre fiscal

**Files:**
- Modify: `comptabilite-frontend/src/app/features/invoices/new-invoice/new-invoice.component.ts`
- Modify: `comptabilite-frontend/src/app/features/invoices/new-invoice/new-invoice.component.html`

- [ ] **Step 1: Add `timbreFiscal` computed signal**

In `new-invoice.component.ts`, after `totalVAT`:

```ts
timbreFiscal = computed(() =>
  this.selectedClient()?.address?.country === 'Tunisie' ? 1 : 0
)
```

- [ ] **Step 2: Update `totalTTC` to include timbre fiscal**

Replace the existing `totalTTC` line:
```ts
totalTTC = computed(() => this.totalHT() + this.totalVAT())
```
With:
```ts
totalTTC = computed(() => this.totalHT() + this.totalVAT() + this.timbreFiscal())
```

- [ ] **Step 3: Add `timbreFiscal` to `StoredInvoice` interface**

In the inline `StoredInvoice` interface (top of the file), add:
```ts
timbreFiscal?: number
```

- [ ] **Step 4: Add `timbreFiscal` to the `save()` payload**

In `save()`, inside the `payload` object, add:
```ts
timbreFiscal: this.timbreFiscal(),
```

- [ ] **Step 5: Add timbre fiscal row to summary sidebar HTML**

In `new-invoice.component.html`, insert between the `</div>` closing the `ni-summary__vat-block` div and the `<div class="ni-summary__ttc-bar">` line:

```html
@if (timbreFiscal() > 0) {
  <div class="ni-summary__row">
    <span class="ni-summary__label">Timbre fiscal</span>
    <span class="ni-summary__value">{{ formatAmount(timbreFiscal()) }}</span>
  </div>
}
```

- [ ] **Step 6: Verify in browser**

Start the stack:
```bash
# Terminal 1
cd comptabilite-backend && mvn spring-boot:run

# Terminal 2
cd comptabilite-frontend && npm start
```

1. Open `http://localhost:4200/invoice/create`
2. Select a client with country = `Tunisie` → summary sidebar should show "Timbre fiscal 1,00 TND" and TTC increases by 1
3. Select a client with a different country → no timbre fiscal row, TTC unchanged
4. Create the invoice → check H2 console: `SELECT timbre_fiscal FROM sales_invoices` shows `1.00`

- [ ] **Step 7: Commit**

```bash
git add comptabilite-frontend/src/app/features/invoices/new-invoice/new-invoice.component.ts
git add comptabilite-frontend/src/app/features/invoices/new-invoice/new-invoice.component.html
git commit -m "feat(timbre-fiscal): add timbre fiscal to sales invoice UI (computed from client country)"
```

---

### Task 6: Frontend — purchase invoice model + component

**Files:**
- Modify: `comptabilite-frontend/src/app/shared/models/purchase-invoice.model.ts`
- Modify: `comptabilite-frontend/src/app/features/purchase-invoices/new-purchase-invoice/new-purchase-invoice.component.ts`
- Modify: `comptabilite-frontend/src/app/features/purchase-invoices/new-purchase-invoice/new-purchase-invoice.component.html`

- [ ] **Step 1: Update `purchase-invoice.model.ts`**

Add `timbreFiscal?: number` to `StoredPurchaseInvoice`:
```ts
export interface StoredPurchaseInvoice {
  // ... existing fields ...
  timbreFiscal?: number
}
```

Add `timbreFiscal: number` to `CreatePurchaseInvoicePayload`:
```ts
export interface CreatePurchaseInvoicePayload {
  // ... existing fields ...
  timbreFiscal: number
}
```

Add `timbreFiscal?: number | null` to `ExtractedInvoice`:
```ts
export interface ExtractedInvoice {
  // ... existing fields ...
  timbreFiscal?: number | null
}
```

- [ ] **Step 2: Add `timbreFiscal` signal to the component**

In `new-purchase-invoice.component.ts`, after `totalVAT`:

```ts
timbreFiscal = signal(0)
```

- [ ] **Step 3: Update `totalTTC` computed signal**

Replace:
```ts
totalTTC = computed(() => this.totalHT() + this.totalVAT())
```
With:
```ts
totalTTC = computed(() => this.totalHT() + this.totalVAT() + this.timbreFiscal())
```

- [ ] **Step 4: Apply extracted timbre fiscal in `applyExtractedData()`**

In `applyExtractedData()`, add after the `paymentMethod` check:
```ts
if (extracted.timbreFiscal != null) { this.timbreFiscal.set(Number(extracted.timbreFiscal)); count++ }
```

- [ ] **Step 5: Restore timbre fiscal in `patchFromInvoice()`**

In `patchFromInvoice()`, add:
```ts
this.timbreFiscal.set(inv.timbreFiscal ?? 0)
```

- [ ] **Step 6: Add `timbreFiscal` to `save()` payload**

In `save()`, inside the payload object, add:
```ts
timbreFiscal: this.timbreFiscal(),
```

- [ ] **Step 7: Add timbre fiscal row to summary sidebar HTML**

In `new-purchase-invoice.component.html`, insert between the `</div>` closing the `ni-summary__vat-block` div and the `<div class="ni-summary__ttc-bar">` line:

```html
@if (timbreFiscal() > 0) {
  <div class="ni-summary__row">
    <span class="ni-summary__label">Timbre fiscal</span>
    <span class="ni-summary__value">{{ formatAmount(timbreFiscal()) }}</span>
  </div>
}
```

- [ ] **Step 8: Verify in browser**

1. Open `http://localhost:4200/purchase-invoice/create`
2. Upload an invoice PDF that contains a timbre fiscal line → after AI extraction the sidebar shows "Timbre fiscal X,XX TND" and TTC includes it
3. Upload a PDF without timbre fiscal → no timbre fiscal row
4. Create invoice, then edit it → timbre fiscal value is restored from backend (check via H2: `SELECT timbre_fiscal FROM purchase_invoices`)

- [ ] **Step 9: Commit**

```bash
git add comptabilite-frontend/src/app/shared/models/purchase-invoice.model.ts
git add comptabilite-frontend/src/app/features/purchase-invoices/new-purchase-invoice/new-purchase-invoice.component.ts
git add comptabilite-frontend/src/app/features/purchase-invoices/new-purchase-invoice/new-purchase-invoice.component.html
git commit -m "feat(timbre-fiscal): add timbre fiscal to purchase invoice (AI-extracted, persisted, shown in summary)"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| Sales V13 migration | Task 1 |
| SalesInvoice entity field | Task 1 |
| SalesInvoiceRequest + Response | Task 2 |
| SalesInvoiceService totalTtc | Task 2 |
| Purchase V14 migration | Task 1 |
| PurchaseInvoice entity field | Task 1 |
| PurchaseInvoiceRequest + Response | Task 3 |
| PurchaseInvoiceService totalTtc | Task 3 |
| ExtractedInvoiceDto field | Task 4 |
| InvoiceExtractionService PROMPT | Task 4 |
| `timbreFiscal` computed signal (sales) | Task 5 |
| `timbreFiscal` row in sales sidebar | Task 5 |
| `StoredInvoice.timbreFiscal` | Task 5 |
| Purchase model interfaces | Task 6 |
| `timbreFiscal` writable signal (purchase) | Task 6 |
| `applyExtractedData` populates it | Task 6 |
| `patchFromInvoice` restores it | Task 6 |
| Purchase sidebar row | Task 6 |

**Type consistency check:** `timbreFiscal` is `BigDecimal` in Java (entity, request, response, DTO); `number` in TypeScript (signals, payload); `BigDecimal` in Java tests. Consistent.

**Fallback return in InvoiceExtractionService:** Two catch blocks updated to 9 args in Task 4, step 4. ✓

**No placeholders found.** ✓
