# Purchase Invoice Extra Fields Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `supplierInvoiceRef` (required), `purchaseCategory` (optional), and `paymentMethod` (optional) to purchase invoices — backend persistence + duplicate detection + frontend form fields.

**Architecture:** Flyway migration adds three nullable columns; entity/DTO/service carry the fields; the Angular form gains two new rows in section 01 with the signals/computed pattern already used in the component.

**Tech Stack:** Spring Boot 3 / Java 17 / Flyway / H2 (dev) · Angular 17 standalone signals · Lombok records

---

### Task 1: Flyway migration — add three columns

**Files:**
- Create: `comptabilite-backend/src/main/resources/db/migration/V12__purchase_invoice_extra_fields.sql`

- [ ] **Step 1: Write the migration file**

```sql
ALTER TABLE purchase_invoices ADD COLUMN supplier_invoice_ref VARCHAR(100);
ALTER TABLE purchase_invoices ADD COLUMN purchase_category    VARCHAR(100);
ALTER TABLE purchase_invoices ADD COLUMN payment_method       VARCHAR(50);
```

- [ ] **Step 2: Start the backend and verify migration runs**

```bash
cd comptabilite-backend
mvn spring-boot:run
```

Expected in logs: `Successfully applied 1 migration to schema "PUBLIC"` (V12). No `FlywayException`.

- [ ] **Step 3: Commit**

```bash
git add comptabilite-backend/src/main/resources/db/migration/V12__purchase_invoice_extra_fields.sql
git commit -m "feat(db): V12 add supplier_invoice_ref, purchase_category, payment_method columns"
```

---

### Task 2: Backend — entity, DTOs, repository

**Files:**
- Modify: `comptabilite-backend/src/main/java/com/compta/purchaseinvoice/entity/PurchaseInvoice.java`
- Modify: `comptabilite-backend/src/main/java/com/compta/purchaseinvoice/dto/PurchaseInvoiceRequest.java`
- Modify: `comptabilite-backend/src/main/java/com/compta/purchaseinvoice/dto/PurchaseInvoiceResponse.java`
- Modify: `comptabilite-backend/src/main/java/com/compta/purchaseinvoice/repository/PurchaseInvoiceRepository.java`

- [ ] **Step 1: Add three fields to the entity**

In `PurchaseInvoice.java`, after the `internalNotes` field (line 51), add:

```java
    @Column(name = "supplier_invoice_ref", length = 100)
    private String supplierInvoiceRef;

    @Column(name = "purchase_category", length = 100)
    private String purchaseCategory;

    @Column(name = "payment_method", length = 50)
    private String paymentMethod;
```

- [ ] **Step 2: Add three components to the request record**

In `PurchaseInvoiceRequest.java`, after `AttachmentDto attachment,` (before `@NotEmpty @Valid List<LineDto> lineItems`), add:

```java
        @NotBlank(message = "La référence facture fournisseur est obligatoire")
        String supplierInvoiceRef,

        String purchaseCategory,

        String paymentMethod,
```

- [ ] **Step 3: Add three fields to the response record and populate them**

In `PurchaseInvoiceResponse.java`, add three record components after `String internalNotes,` (before `AttachmentDto attachment`):

```java
        String supplierInvoiceRef,
        String purchaseCategory,
        String paymentMethod,
```

Then in the `from(PurchaseInvoice inv)` factory method, add them to the constructor call (after `inv.getInternalNotes(),` and before `attachment,`):

```java
                inv.getSupplierInvoiceRef(),
                inv.getPurchaseCategory(),
                inv.getPaymentMethod(),
```

- [ ] **Step 4: Add two duplicate-detection queries to the repository**

In `PurchaseInvoiceRepository.java`, add after the existing methods:

```java
    boolean existsBySupplierInvoiceRefAndSupplierIdAndCompanyId(
            String supplierInvoiceRef, UUID supplierId, UUID companyId);

    boolean existsBySupplierInvoiceRefAndSupplierIdAndCompanyIdAndIdNot(
            String supplierInvoiceRef, UUID supplierId, UUID companyId, UUID id);
```

- [ ] **Step 5: Compile-check**

```bash
cd comptabilite-backend
mvn clean package -DskipTests
```

Expected: `BUILD SUCCESS`

- [ ] **Step 6: Commit**

```bash
git add comptabilite-backend/src/main/java/com/compta/purchaseinvoice/entity/PurchaseInvoice.java \
        comptabilite-backend/src/main/java/com/compta/purchaseinvoice/dto/PurchaseInvoiceRequest.java \
        comptabilite-backend/src/main/java/com/compta/purchaseinvoice/dto/PurchaseInvoiceResponse.java \
        comptabilite-backend/src/main/java/com/compta/purchaseinvoice/repository/PurchaseInvoiceRepository.java
git commit -m "feat(purchaseinvoice): add supplierInvoiceRef/purchaseCategory/paymentMethod to entity, DTOs, repo"
```

---

### Task 3: Backend — service duplicate detection + applyRequest

**Files:**
- Modify: `comptabilite-backend/src/main/java/com/compta/purchaseinvoice/service/PurchaseInvoiceService.java`
- Test: `comptabilite-backend/src/test/java/com/compta/purchaseinvoice/PurchaseInvoiceServiceTest.java`

- [ ] **Step 1: Write a failing unit test for duplicate detection on create**

Create `comptabilite-backend/src/test/java/com/compta/purchaseinvoice/PurchaseInvoiceServiceTest.java`:

```java
package com.compta.purchaseinvoice;

import com.compta.common.exception.ApiException;
import com.compta.purchaseinvoice.dto.PurchaseInvoiceRequest;
import com.compta.purchaseinvoice.dto.PurchaseInvoiceRequest.LineDto;
import com.compta.purchaseinvoice.entity.PurchaseInvoice;
import com.compta.purchaseinvoice.repository.PurchaseInvoiceRepository;
import com.compta.purchaseinvoice.service.PurchaseInvoiceService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PurchaseInvoiceServiceTest {

    @Mock PurchaseInvoiceRepository invoiceRepository;
    @Mock ObjectMapper objectMapper;
    @InjectMocks PurchaseInvoiceService service;

    private static final UUID COMPANY_ID  = UUID.randomUUID();
    private static final UUID SUPPLIER_ID = UUID.randomUUID();

    private PurchaseInvoiceRequest buildRequest(String ref) {
        return new PurchaseInvoiceRequest(
                SUPPLIER_ID,                   // supplierId
                "Fournisseur Test",            // supplierName
                "ACH-2026-0001",               // invoiceNumber
                LocalDate.now(),               // issueDate
                LocalDate.now().plusDays(30),  // dueDate
                "TND",                         // currency
                null,                          // status
                null,                          // internalNotes
                null,                          // attachment
                ref,                           // supplierInvoiceRef
                null,                          // purchaseCategory
                null,                          // paymentMethod
                List.of(new LineDto("Prestation", BigDecimal.ONE, BigDecimal.TEN, null, null, 1))
        );
    }

    @Test
    void create_shouldThrowConflict_whenSupplierInvoiceRefAlreadyExists() {
        when(invoiceRepository.existsBySupplierInvoiceRefAndSupplierIdAndCompanyId(
                "REF-001", SUPPLIER_ID, COMPANY_ID)).thenReturn(true);

        assertThatThrownBy(() -> service.create(buildRequest("REF-001"), COMPANY_ID))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("existe déjà");
    }

    @Test
    void create_shouldNotThrow_whenSupplierInvoiceRefIsUnique() {
        when(invoiceRepository.existsBySupplierInvoiceRefAndSupplierIdAndCompanyId(
                "REF-002", SUPPLIER_ID, COMPANY_ID)).thenReturn(false);
        PurchaseInvoice saved = new PurchaseInvoice();
        saved.setIssueDate(LocalDate.now());
        saved.setLines(List.of());
        when(invoiceRepository.save(any())).thenReturn(saved);

        // Should not throw
        service.create(buildRequest("REF-002"), COMPANY_ID);
    }
}
```

- [ ] **Step 2: Run the test to see it fail**

```bash
cd comptabilite-backend
mvn test -Dtest=PurchaseInvoiceServiceTest -q
```

Expected: compilation error or test failure (service doesn't call the new repo method yet).

- [ ] **Step 3: Update the service**

In `PurchaseInvoiceService.java`:

**In `create()`**, add a duplicate check before `applyRequest`:

```java
    @Transactional
    public PurchaseInvoiceResponse create(PurchaseInvoiceRequest req, UUID companyId) {
        if (invoiceRepository.existsBySupplierInvoiceRefAndSupplierIdAndCompanyId(
                req.supplierInvoiceRef(), req.supplierId(), companyId)) {
            throw ApiException.conflict("La référence facture fournisseur existe déjà pour ce fournisseur.");
        }
        PurchaseInvoice invoice = new PurchaseInvoice();
        invoice.setCompanyId(companyId);
        applyRequest(invoice, req);
        return PurchaseInvoiceResponse.from(invoiceRepository.save(invoice));
    }
```

**In `update()`**, add the duplicate check (exclude self) after fetching the invoice:

```java
    @Transactional
    public PurchaseInvoiceResponse update(UUID id, PurchaseInvoiceRequest req, UUID companyId) {
        PurchaseInvoice invoice = invoiceRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> ApiException.notFound("Facture d'achat introuvable"));
        if (invoiceRepository.existsBySupplierInvoiceRefAndSupplierIdAndCompanyIdAndIdNot(
                req.supplierInvoiceRef(), req.supplierId(), companyId, id)) {
            throw ApiException.conflict("La référence facture fournisseur existe déjà pour ce fournisseur.");
        }
        invoice.getLines().clear();
        applyRequest(invoice, req);
        return PurchaseInvoiceResponse.from(invoiceRepository.save(invoice));
    }
```

**In `applyRequest()`**, add the three new field setters after `invoice.setInternalNotes(req.internalNotes());`:

```java
        invoice.setSupplierInvoiceRef(req.supplierInvoiceRef());
        invoice.setPurchaseCategory(req.purchaseCategory());
        invoice.setPaymentMethod(req.paymentMethod());
```

- [ ] **Step 4: Check that `ApiException.conflict` exists**

```bash
grep -r "conflict" comptabilite-backend/src/main/java/com/compta/common/
```

If the method doesn't exist, add it to `ApiException.java`:

```java
    public static ApiException conflict(String message) {
        return new ApiException(HttpStatus.CONFLICT, message);
    }
```

- [ ] **Step 5: Run the test to see it pass**

```bash
cd comptabilite-backend
mvn test -Dtest=PurchaseInvoiceServiceTest -q
```

Expected: `Tests run: 2, Failures: 0, Errors: 0`

- [ ] **Step 6: Run all tests**

```bash
cd comptabilite-backend
mvn test -q
```

Expected: `BUILD SUCCESS`

- [ ] **Step 7: Commit**

```bash
git add comptabilite-backend/src/main/java/com/compta/purchaseinvoice/service/PurchaseInvoiceService.java \
        comptabilite-backend/src/test/java/com/compta/purchaseinvoice/PurchaseInvoiceServiceTest.java
git commit -m "feat(purchaseinvoice): duplicate detection on supplierInvoiceRef + applyRequest wiring"
```

---

### Task 4: Frontend — model types

**Files:**
- Modify: `comptabilite-frontend/src/app/shared/models/purchase-invoice.model.ts`

- [ ] **Step 1: Add three fields to all three interfaces**

In `purchase-invoice.model.ts`:

In `StoredPurchaseInvoice`, after `status: PurchaseInvoiceStatus`, add:
```ts
  supplierInvoiceRef: string
  purchaseCategory?: string
  paymentMethod?: string
```

In `CreatePurchaseInvoicePayload`, after `status: PurchaseInvoiceStatus`, add:
```ts
  supplierInvoiceRef: string
  purchaseCategory?: string
  paymentMethod?: string
```

(No change needed to `ApiPurchaseInvoice` — list view is out of scope.)

- [ ] **Step 2: Type-check**

```bash
cd comptabilite-frontend
npx tsc --noEmit
```

Expected: only errors about new fields not yet set in the component (those are fixed in the next task). Zero unexpected errors.

- [ ] **Step 3: Commit**

```bash
git add comptabilite-frontend/src/app/shared/models/purchase-invoice.model.ts
git commit -m "feat(purchaseinvoice): add supplierInvoiceRef/purchaseCategory/paymentMethod to TS models"
```

---

### Task 5: Frontend — component TS

**Files:**
- Modify: `comptabilite-frontend/src/app/features/purchase-invoices/new-purchase-invoice/new-purchase-invoice.component.ts`

- [ ] **Step 1: Add signals, error computed, options constants, update isFormValid, patchFromInvoice, save()**

Open `new-purchase-invoice.component.ts` and apply all five changes:

**A — Add signals** (after `status = signal<PurchaseInvoiceStatus>('reçue')`, around line 33):

```ts
  supplierInvoiceRef = signal('')
  purchaseCategory   = signal('')
  paymentMethod      = signal('')
```

**B — Add error computed** (after `dueDateError` computed, around line 93):

```ts
  supplierInvoiceRefError = computed(() => this.formSubmitted() && !this.supplierInvoiceRef().trim())
```

**C — Add options constants** (after `readonly vatRates = [0, 7, 13, 19]`, around line 57):

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

**D — Update `isFormValid`** — add `this.supplierInvoiceRef().trim() !== ''` to the AND chain:

```ts
  isFormValid = computed(() =>
    !!this.selectedSupplier() &&
    !!this.issueDate() &&
    !!this.dueDate() &&
    this.supplierInvoiceRef().trim() !== '' &&
    this.lineItems().length > 0 &&
    this.lineItems().every(i => i.description.trim() !== '' && i.qty > 0 && i.priceHT >= 0)
  )
```

**E — Update `patchFromInvoice`** — add after `this.status.set(inv.status)`:

```ts
    this.supplierInvoiceRef.set(inv.supplierInvoiceRef ?? '')
    this.purchaseCategory.set(inv.purchaseCategory ?? '')
    this.paymentMethod.set(inv.paymentMethod ?? '')
```

**F — Update `save()` payload** — add after `status: this.status()`:

```ts
      supplierInvoiceRef: this.supplierInvoiceRef(),
      purchaseCategory:   this.purchaseCategory() || undefined,
      paymentMethod:      this.paymentMethod() || undefined,
```

- [ ] **Step 2: Type-check**

```bash
cd comptabilite-frontend
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add comptabilite-frontend/src/app/features/purchase-invoices/new-purchase-invoice/new-purchase-invoice.component.ts
git commit -m "feat(purchaseinvoice): add supplierInvoiceRef/purchaseCategory/paymentMethod signals and form logic"
```

---

### Task 6: Frontend — HTML form fields

**Files:**
- Modify: `comptabilite-frontend/src/app/features/purchase-invoices/new-purchase-invoice/new-purchase-invoice.component.html`

- [ ] **Step 1: Add two new rows after the currency row in section 01**

The currency `</div>` closes at the end of the `ni-field--span2` div (around line 119), and then `</div>` closes the `ni-grid` at line 121. Insert the new fields **before** the closing `</div>` of the `ni-grid` (i.e. after the currency field div, before `</div>` at line 121):

```html
            <!-- Réf. facture fournisseur -->
            <div class="ni-field ni-field--span2">
              <label class="ni-label">Réf. facture fournisseur <span class="ni-required">*</span></label>
              <input
                class="ni-input"
                [class.ni-input--error]="supplierInvoiceRefError()"
                type="text"
                placeholder="Ex : FA-2026-00123"
                [ngModel]="supplierInvoiceRef()"
                (ngModelChange)="supplierInvoiceRef.set($event)"
              />
              @if (supplierInvoiceRefError()) {
                <p class="ni-field-error"><span class="material-symbols-outlined">error</span> La référence facture fournisseur est requise.</p>
              }
            </div>

            <!-- Catégorie achat -->
            <div class="ni-field ni-field--span2">
              <label class="ni-label">Catégorie achat</label>
              <select class="ni-select" [ngModel]="purchaseCategory()" (ngModelChange)="purchaseCategory.set($event)">
                <option value="">— Sélectionner —</option>
                @for (cat of purchaseCategoryOptions; track cat) {
                  <option [value]="cat">{{ cat }}</option>
                }
              </select>
            </div>

            <!-- Mode de paiement -->
            <div class="ni-field ni-field--span2">
              <label class="ni-label">Mode de paiement</label>
              <select class="ni-select" [ngModel]="paymentMethod()" (ngModelChange)="paymentMethod.set($event)">
                <option value="">— Sélectionner —</option>
                @for (pm of paymentMethodOptions; track pm) {
                  <option [value]="pm">{{ pm }}</option>
                }
              </select>
            </div>
```

- [ ] **Step 2: Build the frontend to verify no template errors**

```bash
cd comptabilite-frontend
npm run build 2>&1 | tail -20
```

Expected: `✔ Browser application bundle generation complete.` (or Angular build success). No template compilation errors.

- [ ] **Step 3: Commit**

```bash
git add comptabilite-frontend/src/app/features/purchase-invoices/new-purchase-invoice/new-purchase-invoice.component.html
git commit -m "feat(purchaseinvoice): add supplierInvoiceRef, purchaseCategory, paymentMethod fields to form"
```

---

### Task 7: End-to-end smoke test

- [ ] **Step 1: Start the backend**

```bash
cd comptabilite-backend
mvn spring-boot:run
```

Wait for: `Started ComptaApplication in X seconds`

- [ ] **Step 2: Start the frontend**

```bash
cd comptabilite-frontend
npm start
```

Wait for: `Local: http://localhost:4200/`

- [ ] **Step 3: Manual verification checklist**

Open `http://localhost:4200/purchase-invoice/create`:

1. **Réf. facture fournisseur** field is visible in section 01, after the currency row.
2. Clicking **Enregistrer** without filling it shows the "La référence facture fournisseur est requise." error.
3. Filling in a reference, selecting a supplier, adding a line item and saving → redirects to list with no error.
4. **Edit** the same invoice → the three fields are pre-filled correctly.
5. **Duplicate detection**: create a second invoice with the same supplier and same `supplierInvoiceRef` → a 409 error message appears in the topbar (`La référence facture fournisseur existe déjà pour ce fournisseur.`).
6. **Catégorie achat** and **Mode de paiement** dropdowns show all options; leaving them blank is allowed.

- [ ] **Step 4: Run all backend tests one final time**

```bash
cd comptabilite-backend
mvn test -q
```

Expected: `BUILD SUCCESS`
