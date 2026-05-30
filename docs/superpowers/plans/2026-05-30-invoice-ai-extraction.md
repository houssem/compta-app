# Invoice AI Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a section "00" to the purchase invoice create form that extracts structured invoice data from an uploaded PDF/image via Claude API and auto-fills the form.

**Architecture:** A new Spring Boot endpoint `POST /api/purchase-invoices/extract` receives a base64 file, calls the Claude REST API via RestTemplate, and returns structured JSON. The Angular create form adds a new section with 4 states (idle/loading/success/error) and applies extracted fields to existing signals. No new dependencies required — RestTemplate is included in spring-boot-starter-web.

**Tech Stack:** Spring Boot RestTemplate → Claude API (claude-sonnet-4-5-20251001), Angular 17 signals, Levenshtein distance for supplier fuzzy matching.

---

## File Map

### Backend — new files
| File | Responsibility |
|------|---------------|
| `extraction/InvoiceFileDto.java` | Request record: name, type, data (base64 data URL) |
| `extraction/ExtractedInvoiceDto.java` | Response record: all nullable extracted fields + nested LineItemDto |
| `extraction/InvoiceExtractionService.java` | Calls Claude API, parses JSON response |
| `extraction/InvoiceExtractionController.java` | `POST /api/purchase-invoices/extract` |
| `config/AppConfig.java` | RestTemplate bean with 30s timeout |

### Backend — modified files
| File | Change |
|------|--------|
| `src/main/resources/application-dev.yml` | Add `anthropic.api-key` property |

### Backend — test files
| File | Tests |
|------|-------|
| `InvoiceExtractionServiceTest.java` | Unit tests for parsing helpers (no HTTP calls) |

### Frontend — modified files
| File | Change |
|------|--------|
| `shared/models/purchase-invoice.model.ts` | Add `ExtractedInvoice`, `ExtractedLineItem` interfaces |
| `purchase-invoice.service.ts` | Add `extract()` method |
| `new-purchase-invoice.component.ts` | Add extraction signals, 4 methods, fuzzy matching |
| `new-purchase-invoice.component.html` | Add section 00 with 4 states |
| `new-purchase-invoice.component.scss` | Add `.ni-extract-*` styles |

---

### Task 1: Backend config

**Files:**
- Modify: `comptabilite-backend/src/main/resources/application-dev.yml`
- Create: `comptabilite-backend/src/main/java/com/compta/config/AppConfig.java`

- [ ] **Step 1: Add anthropic property to application-dev.yml**

Add at the end of the file:
```yaml
anthropic:
  api-key: ${ANTHROPIC_API_KEY:changeme-set-ANTHROPIC_API_KEY-env-var}
```

- [ ] **Step 2: Create AppConfig with RestTemplate bean (30s timeout)**

```java
package com.compta.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@Configuration
public class AppConfig {

    @Bean
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10_000);
        factory.setReadTimeout(30_000);
        return new RestTemplate(factory);
    }
}
```

- [ ] **Step 3: Build to verify compilation**

```bash
cd comptabilite-backend
mvn clean package -DskipTests -q
```

Expected: `BUILD SUCCESS`

- [ ] **Step 4: Commit**

```bash
git add comptabilite-backend/src/main/resources/application-dev.yml \
        comptabilite-backend/src/main/java/com/compta/config/AppConfig.java
git commit -m "config: add anthropic api-key property and RestTemplate bean with 30s timeout"
```

---

### Task 2: Backend DTOs

**Files:**
- Create: `comptabilite-backend/src/main/java/com/compta/purchaseinvoice/extraction/InvoiceFileDto.java`
- Create: `comptabilite-backend/src/main/java/com/compta/purchaseinvoice/extraction/ExtractedInvoiceDto.java`

- [ ] **Step 1: Create InvoiceFileDto**

```java
package com.compta.purchaseinvoice.extraction;

public record InvoiceFileDto(
        String name,
        String type,
        String data   // full base64 data URL: "data:application/pdf;base64,..."
) {}
```

- [ ] **Step 2: Create ExtractedInvoiceDto**

```java
package com.compta.purchaseinvoice.extraction;

import java.math.BigDecimal;
import java.util.List;

public record ExtractedInvoiceDto(
        String supplierName,
        String supplierInvoiceRef,
        String issueDate,
        String dueDate,
        String currency,
        String purchaseCategory,
        String paymentMethod,
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

- [ ] **Step 3: Build to verify**

```bash
mvn clean package -DskipTests -q
```

Expected: `BUILD SUCCESS`

- [ ] **Step 4: Commit**

```bash
git add comptabilite-backend/src/main/java/com/compta/purchaseinvoice/extraction/
git commit -m "feat(extraction): add InvoiceFileDto and ExtractedInvoiceDto records"
```

---

### Task 3: Backend InvoiceExtractionService (TDD)

**Files:**
- Create: `comptabilite-backend/src/test/java/com/compta/purchaseinvoice/InvoiceExtractionServiceTest.java`
- Create: `comptabilite-backend/src/main/java/com/compta/purchaseinvoice/extraction/InvoiceExtractionService.java`

- [ ] **Step 1: Write failing tests**

```java
package com.compta.purchaseinvoice;

import com.compta.purchaseinvoice.extraction.ExtractedInvoiceDto;
import com.compta.purchaseinvoice.extraction.InvoiceExtractionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class InvoiceExtractionServiceTest {

    private InvoiceExtractionService service;

    @BeforeEach
    void setUp() {
        service = new InvoiceExtractionService(new ObjectMapper(), new RestTemplate(), "test-key");
    }

    @Test
    void stripBase64Prefix_shouldReturnRawBase64() {
        assertThat(service.stripBase64Prefix("data:application/pdf;base64,JVBERi0="))
                .isEqualTo("JVBERi0=");
    }

    @Test
    void extractMediaType_shouldReturnMimeType() {
        assertThat(service.extractMediaType("data:image/jpeg;base64,/9j/abc"))
                .isEqualTo("image/jpeg");
    }

    @Test
    void contentBlockType_shouldReturnDocumentForPdf() {
        assertThat(service.contentBlockType("application/pdf")).isEqualTo("document");
    }

    @Test
    void contentBlockType_shouldReturnImageForJpeg() {
        assertThat(service.contentBlockType("image/jpeg")).isEqualTo("image");
    }

    @Test
    void parseClaudeResponse_shouldMapAllFields() throws Exception {
        String json = """
                {
                  "supplierName": "Acme SARL",
                  "supplierInvoiceRef": "FA-2026-001",
                  "issueDate": "2026-05-15",
                  "dueDate": "2026-06-15",
                  "currency": "TND",
                  "purchaseCategory": "401000",
                  "paymentMethod": "Virement bancaire",
                  "lineItems": [
                    { "description": "Fournitures", "qty": 2, "priceHT": 150.00, "discPct": 0, "vatPct": 19 }
                  ]
                }
                """;
        ExtractedInvoiceDto result = service.parseClaudeResponse(json);
        assertThat(result.supplierName()).isEqualTo("Acme SARL");
        assertThat(result.issueDate()).isEqualTo("2026-05-15");
        assertThat(result.lineItems()).hasSize(1);
        assertThat(result.lineItems().get(0).qty()).isEqualByComparingTo(new BigDecimal("2"));
    }

    @Test
    void parseClaudeResponse_shouldHandleNullFields() throws Exception {
        String json = """
                {
                  "supplierName": null, "supplierInvoiceRef": null,
                  "issueDate": null, "dueDate": null, "currency": null,
                  "purchaseCategory": null, "paymentMethod": null, "lineItems": []
                }
                """;
        ExtractedInvoiceDto result = service.parseClaudeResponse(json);
        assertThat(result.supplierName()).isNull();
        assertThat(result.lineItems()).isEmpty();
    }

    @Test
    void parseClaudeResponse_shouldStripMarkdownCodeBlock() throws Exception {
        String json = """
                ```json
                {
                  "supplierName": "Test SARL",
                  "supplierInvoiceRef": null, "issueDate": null, "dueDate": null,
                  "currency": null, "purchaseCategory": null, "paymentMethod": null,
                  "lineItems": []
                }
                ```
                """;
        ExtractedInvoiceDto result = service.parseClaudeResponse(json);
        assertThat(result.supplierName()).isEqualTo("Test SARL");
    }
}
```

- [ ] **Step 2: Run tests — confirm they fail (class not found)**

```bash
cd comptabilite-backend
mvn test -Dtest=InvoiceExtractionServiceTest -q 2>&1 | tail -5
```

Expected: compilation error — `InvoiceExtractionService` does not exist yet.

- [ ] **Step 3: Create InvoiceExtractionService**

```java
package com.compta.purchaseinvoice.extraction;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class InvoiceExtractionService {

    private static final String CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
    private static final String MODEL = "claude-sonnet-4-5-20251001";
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
              "lineItems": [
                { "description": "text", "qty": 1, "priceHT": 0.00, "discPct": 0, "vatPct": 19 }
              ]
            }
            """;

    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;
    private final String apiKey;

    public InvoiceExtractionService(ObjectMapper objectMapper,
                                    RestTemplate restTemplate,
                                    @Value("${anthropic.api-key:}") String apiKey) {
        this.objectMapper = objectMapper;
        this.restTemplate = restTemplate;
        this.apiKey = apiKey;
    }

    public ExtractedInvoiceDto extract(InvoiceFileDto file) {
        String mediaType = extractMediaType(file.data());
        String base64Data = stripBase64Prefix(file.data());

        Map<String, Object> contentBlock = Map.of(
                "type", contentBlockType(mediaType),
                "source", Map.of(
                        "type", "base64",
                        "media_type", mediaType,
                        "data", base64Data
                )
        );

        Map<String, Object> requestBody = Map.of(
                "model", MODEL,
                "max_tokens", 1024,
                "messages", List.of(Map.of(
                        "role", "user",
                        "content", List.of(
                                contentBlock,
                                Map.of("type", "text", "text", PROMPT)
                        )
                ))
        );

        HttpHeaders headers = new HttpHeaders();
        headers.set("x-api-key", apiKey);
        headers.set("anthropic-version", "2023-06-01");
        headers.setContentType(MediaType.APPLICATION_JSON);

        ResponseEntity<Map> response = restTemplate.postForEntity(
                CLAUDE_API_URL,
                new HttpEntity<>(requestBody, headers),
                Map.class
        );

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> content =
                (List<Map<String, Object>>) response.getBody().get("content");
        String text = (String) content.get(0).get("text");

        try {
            return parseClaudeResponse(text);
        } catch (Exception e) {
            return new ExtractedInvoiceDto(null, null, null, null, null, null, null, List.of());
        }
    }

    // Package-private for testing
    String stripBase64Prefix(String dataUrl) {
        return dataUrl.substring(dataUrl.indexOf(',') + 1);
    }

    String extractMediaType(String dataUrl) {
        return dataUrl.substring(5, dataUrl.indexOf(';'));
    }

    String contentBlockType(String mediaType) {
        return "application/pdf".equals(mediaType) ? "document" : "image";
    }

    ExtractedInvoiceDto parseClaudeResponse(String text) throws Exception {
        String cleaned = text.trim();
        if (cleaned.startsWith("```")) {
            cleaned = cleaned
                    .replaceAll("^```(?:json)?\\s*", "")
                    .replaceAll("```\\s*$", "")
                    .trim();
        }
        return objectMapper.readValue(cleaned, ExtractedInvoiceDto.class);
    }
}
```

- [ ] **Step 4: Run tests — all must pass**

```bash
mvn test -Dtest=InvoiceExtractionServiceTest -q
```

Expected: `Tests run: 7, Failures: 0, Errors: 0`

- [ ] **Step 5: Commit**

```bash
git add comptabilite-backend/src/test/java/com/compta/purchaseinvoice/InvoiceExtractionServiceTest.java \
        comptabilite-backend/src/main/java/com/compta/purchaseinvoice/extraction/InvoiceExtractionService.java
git commit -m "feat(extraction): add InvoiceExtractionService with Claude API call and parsing helpers"
```

---

### Task 4: Backend InvoiceExtractionController

**Files:**
- Create: `comptabilite-backend/src/main/java/com/compta/purchaseinvoice/extraction/InvoiceExtractionController.java`

- [ ] **Step 1: Create controller**

```java
package com.compta.purchaseinvoice.extraction;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/purchase-invoices")
@RequiredArgsConstructor
public class InvoiceExtractionController {

    private final InvoiceExtractionService extractionService;

    @PostMapping("/extract")
    public ResponseEntity<ExtractedInvoiceDto> extract(
            @RequestBody InvoiceFileDto file,
            Authentication auth
    ) {
        if (file == null || file.data() == null || file.data().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(extractionService.extract(file));
    }
}
```

- [ ] **Step 2: Build and run all tests**

```bash
mvn clean package -DskipTests -q && mvn test -q
```

Expected: `BUILD SUCCESS`, all tests pass.

- [ ] **Step 3: Commit**

```bash
git add comptabilite-backend/src/main/java/com/compta/purchaseinvoice/extraction/InvoiceExtractionController.java
git commit -m "feat(extraction): add POST /api/purchase-invoices/extract endpoint"
```

---

### Task 5: Frontend model types

**Files:**
- Modify: `comptabilite-frontend/src/app/shared/models/purchase-invoice.model.ts`

- [ ] **Step 1: Append ExtractedInvoice interfaces at end of file**

```typescript
export interface ExtractedLineItem {
  description: string | null
  qty: number | null
  priceHT: number | null
  discPct: number | null
  vatPct: number | null
}

export interface ExtractedInvoice {
  supplierName: string | null
  supplierInvoiceRef: string | null
  issueDate: string | null
  dueDate: string | null
  currency: string | null
  purchaseCategory: string | null
  paymentMethod: string | null
  lineItems: ExtractedLineItem[]
}
```

- [ ] **Step 2: Commit**

```bash
git add comptabilite-frontend/src/app/shared/models/purchase-invoice.model.ts
git commit -m "feat(extraction): add ExtractedInvoice model interfaces"
```

---

### Task 6: Frontend service extract() method

**Files:**
- Modify: `comptabilite-frontend/src/app/features/purchase-invoices/purchase-invoice.service.ts`

- [ ] **Step 1: Add import and extract() method**

Add `ExtractedInvoice` to the existing import:
```typescript
import { ApiPurchaseInvoice, StoredPurchaseInvoice, CreatePurchaseInvoicePayload, ExtractedInvoice } from '../../shared/models/purchase-invoice.model'
```

Add method inside `PurchaseInvoiceService`:
```typescript
extract(file: { name: string; type: string; data: string }): Observable<ExtractedInvoice> {
  return this.http.post<ExtractedInvoice>('/api/purchase-invoices/extract', file)
}
```

- [ ] **Step 2: Commit**

```bash
git add comptabilite-frontend/src/app/features/purchase-invoices/purchase-invoice.service.ts
git commit -m "feat(extraction): add extract() method to PurchaseInvoiceService"
```

---

### Task 7: Frontend component — extraction signals and logic

**Files:**
- Modify: `comptabilite-frontend/src/app/features/purchase-invoices/new-purchase-invoice/new-purchase-invoice.component.ts`

- [ ] **Step 1: Add ExtractedInvoice import**

Update the model import line to include `ExtractedInvoice`:
```typescript
import { LineItem, StoredPurchaseInvoice, PurchaseInvoiceStatus, InvoiceAttachment, ExtractedInvoice } from '../../../shared/models/purchase-invoice.model'
```

- [ ] **Step 2: Add ExtractionState type and signals**

Add the type alias just before the `@Component` decorator:
```typescript
type ExtractionState = 'idle' | 'loading' | 'success' | 'error'
```

Add these three signals inside the class body, after `fileError = signal('')`:
```typescript
extractionState  = signal<ExtractionState>('idle')
extractionError  = signal('')
extractedCount   = signal(0)
extractDragOver  = signal(false)
```

- [ ] **Step 3: Add extraction methods**

Add after `removeAttachment()`:

```typescript
onExtractDragOver(event: DragEvent): void { event.preventDefault(); this.extractDragOver.set(true) }
onExtractDragLeave(): void { this.extractDragOver.set(false) }

onExtractDrop(event: DragEvent): void {
  event.preventDefault()
  this.extractDragOver.set(false)
  const file = event.dataTransfer?.files?.[0]
  if (file) this.processExtraction(file)
}

onExtractUpload(event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0]
  ;(event.target as HTMLInputElement).value = ''
  if (file) this.processExtraction(file)
}

private processExtraction(file: File): void {
  if (!this.ACCEPTED_TYPES.includes(file.type)) {
    this.extractionError.set('Format non supporté. Utilisez PDF, JPG, PNG ou WEBP.')
    this.extractionState.set('error')
    return
  }
  if (file.size > this.MAX_SIZE) {
    this.extractionError.set('Le fichier dépasse la limite de 10 Mo.')
    this.extractionState.set('error')
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    const data = reader.result as string
    this.attachment.set({ name: file.name, type: file.type, size: file.size, data })
    this.extractionState.set('loading')
    this.extractionError.set('')
    this.service.extract({ name: file.name, type: file.type, data }).subscribe({
      next: (extracted) => {
        this.applyExtractedData(extracted)
        this.extractionState.set('success')
      },
      error: () => {
        this.extractionError.set('L\'analyse a échoué. Vérifiez votre connexion et réessayez.')
        this.extractionState.set('error')
      }
    })
  }
  reader.readAsDataURL(file)
}

resetExtraction(): void {
  this.extractionState.set('idle')
  this.extractionError.set('')
  this.extractedCount.set(0)
  this.attachment.set(null)
}

private applyExtractedData(extracted: ExtractedInvoice): void {
  let count = 0
  if (extracted.supplierInvoiceRef) { this.supplierInvoiceRef.set(extracted.supplierInvoiceRef); count++ }
  if (extracted.issueDate)          { this.issueDate.set(extracted.issueDate); count++ }
  if (extracted.dueDate)            { this.dueDate.set(extracted.dueDate); count++ }
  if (extracted.currency)           { this.currency.set(extracted.currency); count++ }
  if (extracted.purchaseCategory)   { this.purchaseCategory.set(extracted.purchaseCategory); count++ }
  if (extracted.paymentMethod)      { this.paymentMethod.set(extracted.paymentMethod); count++ }

  if (extracted.lineItems?.length) {
    this.lineItems.set(extracted.lineItems.map(item => ({
      id: this.nextId++,
      description: item.description ?? '',
      qty: item.qty ?? 1,
      priceHT: item.priceHT ?? 0,
      discPct: item.discPct ?? 0,
      vatPct: item.vatPct ?? 19
    })))
    count++
  }

  if (extracted.supplierName) {
    const match = this.fuzzyMatchSupplier(extracted.supplierName)
    if (match) { this.selectedSupplier.set(match); count++ }
  }

  this.extractedCount.set(count)
}

private fuzzyMatchSupplier(name: string): import('../../../shared/models/supplier.model').Supplier | null {
  if (!name) return null
  const normalize = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  const needle = normalize(name)

  const exact = this.allSuppliers().find(s => {
    const hay = normalize(s.companyName)
    return hay === needle || hay.includes(needle) || needle.includes(hay)
  })
  if (exact) return exact

  const best = this.allSuppliers()
    .map(s => ({ supplier: s, score: this.stringSimilarity(needle, normalize(s.companyName)) }))
    .reduce((a, b) => a.score > b.score ? a : b, { supplier: null as any, score: 0 })
  return best.score >= 0.75 ? best.supplier : null
}

private stringSimilarity(a: string, b: string): number {
  const longer = a.length >= b.length ? a : b
  const shorter = a.length >= b.length ? b : a
  if (longer.length === 0) return 1.0
  return (longer.length - this.editDistance(longer, shorter)) / longer.length
}

private editDistance(a: string, b: string): number {
  const m = a.length, n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0)
  )
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i][j - 1], dp[i - 1][j])
  return dp[m][n]
}
```

- [ ] **Step 4: Verify TypeScript compilation**

```bash
cd comptabilite-frontend
npm run build -- --configuration development 2>&1 | grep -E "^.*(error TS|Error)" | head -20
```

Expected: no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add comptabilite-frontend/src/app/features/purchase-invoices/new-purchase-invoice/new-purchase-invoice.component.ts
git commit -m "feat(extraction): add extraction state signals and auto-fill logic with fuzzy supplier matching"
```

---

### Task 8: Frontend section 00 HTML

**Files:**
- Modify: `comptabilite-frontend/src/app/features/purchase-invoices/new-purchase-invoice/new-purchase-invoice.component.html`

- [ ] **Step 1: Insert section 00 before `<!-- 01 — Informations générales -->`**

```html
<!-- 00 — Import & extraction IA (create mode only) -->
@if (!editMode()) {
  <section class="ni-section ni-extract-section ni-anim-0">
    <div class="ni-section__head">
      <span class="ni-section__num">00</span>
      <div class="ni-section__icon-wrap"><span class="material-symbols-outlined">auto_awesome</span></div>
      <div class="ni-section__meta">
        <h2 class="ni-section__title">Import &amp; extraction automatique</h2>
        <p class="ni-section__desc">Importez la facture fournisseur — le formulaire se remplit par IA</p>
      </div>
      <span class="ni-extract-badge">IA</span>
    </div>
    <div class="ni-section__body">

      @if (extractionState() === 'idle') {
        <div
          class="ni-upload-zone ni-extract-zone"
          [class.ni-upload-zone--drag]="extractDragOver()"
          (dragover)="onExtractDragOver($event)"
          (dragleave)="onExtractDragLeave()"
          (drop)="onExtractDrop($event)"
          (click)="extractInput.click()"
        >
          <input #extractInput type="file" accept="image/*,application/pdf"
                 style="display:none" (change)="onExtractUpload($event)" />
          <span class="material-symbols-outlined ni-upload-zone__icon">upload_file</span>
          <p class="ni-upload-zone__title">
            Glissez la facture ici ou <span class="ni-upload-zone__link">parcourir</span>
          </p>
          <p class="ni-upload-zone__hint">PDF, JPG, PNG, WEBP — 10 Mo max</p>
        </div>
      }

      @if (extractionState() === 'loading') {
        <div class="ni-extract-loading">
          <span class="material-symbols-outlined ni-spin ni-extract-loading__icon">progress_activity</span>
          <div>
            <p class="ni-extract-loading__title">Analyse de la facture en cours…</p>
            <p class="ni-extract-loading__sub">Extraction des informations par IA · ~10 secondes</p>
          </div>
        </div>
      }

      @if (extractionState() === 'success') {
        <div class="ni-extract-result ni-extract-result--success">
          <span class="material-symbols-outlined ni-extract-result__icon">check_circle</span>
          <div class="ni-extract-result__body">
            <p class="ni-extract-result__title">
              Extraction réussie — {{ extractedCount() }} champ{{ extractedCount() > 1 ? 's' : '' }} rempli{{ extractedCount() > 1 ? 's' : '' }}
            </p>
            <p class="ni-extract-result__sub">Vérifiez et corrigez les champs ci-dessous si nécessaire</p>
          </div>
          <button type="button" class="ni-btn ni-btn--ghost ni-extract-result__reset"
                  (click)="resetExtraction()">Recommencer</button>
        </div>
      }

      @if (extractionState() === 'error') {
        <div class="ni-extract-result ni-extract-result--error">
          <span class="material-symbols-outlined ni-extract-result__icon">error</span>
          <div class="ni-extract-result__body">
            <p class="ni-extract-result__title">Extraction échouée</p>
            <p class="ni-extract-result__sub">{{ extractionError() }}</p>
          </div>
          <button type="button" class="ni-btn ni-btn--ghost ni-extract-result__reset"
                  (click)="resetExtraction()">Réessayer</button>
        </div>
      }

    </div>
  </section>
}
```

- [ ] **Step 2: Verify no template errors**

```bash
cd comptabilite-frontend
npm run build -- --configuration development 2>&1 | grep -E "error" | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add comptabilite-frontend/src/app/features/purchase-invoices/new-purchase-invoice/new-purchase-invoice.component.html
git commit -m "feat(extraction): add section 00 import/extraction UI (4 states)"
```

---

### Task 9: Frontend SCSS

**Files:**
- Modify: `comptabilite-frontend/src/app/features/purchase-invoices/new-purchase-invoice/new-purchase-invoice.component.scss`

- [ ] **Step 1: Append extraction styles at end of file**

```scss
/* =====================================================
   SECTION 00 — EXTRACTION IA
   ===================================================== */

.ni-extract-section {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.04), rgba(139, 92, 246, 0.02));
  border-color: rgba(99, 102, 241, 0.25);
}

.ni-extract-badge {
  background: rgba(99, 102, 241, 0.2);
  color: var(--color-primary, #818cf8);
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  letter-spacing: 0.05em;
  margin-left: auto;
}

.ni-extract-zone {
  border-color: rgba(99, 102, 241, 0.3);
  &:hover { border-color: rgba(99, 102, 241, 0.6); }
}

.ni-extract-loading {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: rgba(99, 102, 241, 0.05);
  border: 1px solid rgba(99, 102, 241, 0.15);
  border-radius: 10px;

  &__icon { font-size: 32px; color: var(--color-primary, #818cf8); flex-shrink: 0; }
  &__title { font-size: 14px; font-weight: 600; color: var(--color-on-surface, #e2e8f0); margin: 0 0 4px; }
  &__sub   { font-size: 12px; color: var(--color-on-surface-variant, #94a3b8); margin: 0; }
}

.ni-extract-result {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  border-radius: 10px;
  border: 1px solid;

  &--success {
    background: rgba(16, 185, 129, 0.06);
    border-color: rgba(16, 185, 129, 0.25);
    .ni-extract-result__icon  { color: #6ee7b7; }
    .ni-extract-result__title { color: #6ee7b7; }
  }

  &--error {
    background: rgba(239, 68, 68, 0.06);
    border-color: rgba(239, 68, 68, 0.25);
    .ni-extract-result__icon  { color: #fca5a5; }
    .ni-extract-result__title { color: #fca5a5; }
  }

  &__icon  { font-size: 26px; flex-shrink: 0; }
  &__body  { flex: 1; }
  &__title { font-size: 13px; font-weight: 600; margin: 0 0 3px; }
  &__sub   { font-size: 12px; color: var(--color-on-surface-variant, #94a3b8); margin: 0; }
  &__reset { flex-shrink: 0; }
}
```

- [ ] **Step 2: Final build check**

```bash
cd comptabilite-frontend
npm run build -- --configuration development 2>&1 | tail -5
```

Expected: `Compiled successfully`

- [ ] **Step 3: Commit**

```bash
git add comptabilite-frontend/src/app/features/purchase-invoices/new-purchase-invoice/new-purchase-invoice.component.scss
git commit -m "feat(extraction): add .ni-extract-* styles for section 00"
```

---

### Task 10: Manual end-to-end test + CLAUDE.md

- [ ] **Step 1: Set env var and start backend**

```bash
cd comptabilite-backend
ANTHROPIC_API_KEY=sk-ant-YOUR_KEY mvn spring-boot:run
```

- [ ] **Step 2: Start frontend**

```bash
cd comptabilite-frontend
npm start
```

- [ ] **Step 3: Manual test checklist**

Navigate to `http://localhost:4200/purchase-invoice/create`:
- [ ] Section 00 visible above section 01 with "IA" badge
- [ ] Drag a real PDF invoice onto section 00 → spinner "Analyse en cours…"
- [ ] After ~10s: green success badge shows "X champs remplis"
- [ ] Section 04 shows the file preview (attachment set)
- [ ] Fournisseur auto-sélectionné si nom trouvé dans la liste
- [ ] Réf. facture, dates, devise, lignes pré-remplis
- [ ] All pre-filled fields remain editable
- [ ] "Recommencer" resets section 00 and clears attachment

Navigate to `http://localhost:4200/purchase-invoice/edit/{id}`:
- [ ] Section 00 NOT visible (edit mode)

- [ ] **Step 4: Update backend CLAUDE.md**

Add to the Key Decisions & Gotchas section:
```
- **Invoice AI extraction**: `POST /api/purchase-invoices/extract` calls Claude API via RestTemplate (no SDK). Requires `ANTHROPIC_API_KEY` env var. Base64 data URL sent in body; PDFs use `"type":"document"` block, images use `"type":"image"`. Partial extraction (null fields) returns 200. 30s read timeout configured in AppConfig RestTemplate bean.
```

- [ ] **Step 5: Commit**

```bash
git add comptabilite-backend/CLAUDE.md
git commit -m "docs: document invoice AI extraction endpoint and config"
```
