# Purchase Invoice Upload Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge section 04 (Pièce jointe) into section 00 (Import & extraction automatique) — one upload zone, optional AI extraction via checkbox, download always available.

**Architecture:** Frontend-only change. `ExtractionState` gains an `'attached'` value. A new `autoExtract` signal (defaults `true`) drives a checkbox; `processExtraction` branches on it. Section 04 HTML and its dedicated TS handlers are deleted. The `attachment` signal is fed exclusively from section 00.

**Tech Stack:** Angular 17 standalone signals · TypeScript strict · SCSS

---

### Task 1: TS — expand ExtractionState, add autoExtract signal, update patchFromInvoice

**Files:**
- Modify: `comptabilite-frontend/src/app/features/purchase-invoices/new-purchase-invoice/new-purchase-invoice.component.ts`

- [ ] **Step 1: Expand the ExtractionState type (line 11)**

Replace:
```ts
type ExtractionState = 'idle' | 'loading' | 'success' | 'error'
```
With:
```ts
type ExtractionState = 'idle' | 'loading' | 'success' | 'error' | 'attached'
```

- [ ] **Step 2: Add the autoExtract signal after extractDragOver (line 78)**

After `extractDragOver = signal(false)`, add:
```ts
  autoExtract = signal(true)
```

- [ ] **Step 3: Update patchFromInvoice to set 'attached' when attachment exists**

In `patchFromInvoice()`, after the line `this.attachment.set(inv.attachment ?? null)` (line 149), add:
```ts
    if (inv.attachment) this.extractionState.set('attached')
```

- [ ] **Step 4: Type-check**

```bash
cd comptabilite-frontend
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 5: Commit**

```bash
git add comptabilite-frontend/src/app/features/purchase-invoices/new-purchase-invoice/new-purchase-invoice.component.ts
git commit -m "feat(upload): add 'attached' state, autoExtract signal, patch edit-mode init"
```

---

### Task 2: TS — update processExtraction, remove section 04 dead code

**Files:**
- Modify: `comptabilite-frontend/src/app/features/purchase-invoices/new-purchase-invoice/new-purchase-invoice.component.ts`

- [ ] **Step 1: Replace the entire processExtraction method (lines 246–275)**

```ts
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
      if (this.autoExtract()) {
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
      } else {
        this.extractionState.set('attached')
      }
    }
    reader.readAsDataURL(file)
  }
```

- [ ] **Step 2: Remove the dragOver and fileError signals (lines 72–73)**

Delete these two lines:
```ts
  dragOver   = signal(false)
  fileError  = signal('')
```

- [ ] **Step 3: Remove the six section 04 methods**

Delete entirely (currently around lines 199–228):
- `onDragOver(event: DragEvent)`
- `onDragLeave()`
- `onDrop(event: DragEvent)`
- `onFileSelected(event: Event)`
- `private processFile(file: File)`
- `removeAttachment()`

- [ ] **Step 4: Type-check**

```bash
cd comptabilite-frontend
npx tsc --noEmit
```

Expected: zero errors from the TS file itself. Template errors referencing the deleted methods will surface in the build — resolved by Task 3.

- [ ] **Step 5: Commit**

```bash
git add comptabilite-frontend/src/app/features/purchase-invoices/new-purchase-invoice/new-purchase-invoice.component.ts
git commit -m "feat(upload): branch processExtraction on autoExtract, remove section-04 TS dead code"
```

---

### Task 3: HTML — update section 00, remove section 04

**Files:**
- Modify: `comptabilite-frontend/src/app/features/purchase-invoices/new-purchase-invoice/new-purchase-invoice.component.html`

- [ ] **Step 1: Add checkbox in the idle state block**

Replace the entire idle `@if` block (currently lines 53–70):
```html
            @if (extractionState() === 'idle') {
              <div
                class="ni-upload-zone ni-extract-zone"
                ...
              >
```

With:
```html
            @if (extractionState() === 'idle') {
              <label class="ni-extract-toggle">
                <input type="checkbox" [ngModel]="autoExtract()" (ngModelChange)="autoExtract.set($event)" />
                <span>Extraire automatiquement avec l'IA</span>
              </label>
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
```

- [ ] **Step 2: Add attachment card to the success state block**

Replace the entire success `@if` block (currently lines 82–95):
```html
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
              @if (attachment(); as att) {
                <div class="ni-attachment" style="margin-top: 12px;">
                  @if (isImage(att.type)) {
                    <img class="ni-attachment__thumb" [src]="att.data" [alt]="att.name" />
                  } @else {
                    <div class="ni-attachment__pdf-icon">
                      <span class="material-symbols-outlined">picture_as_pdf</span>
                    </div>
                  }
                  <div class="ni-attachment__info">
                    <span class="ni-attachment__name">{{ att.name }}</span>
                    <span class="ni-attachment__size">{{ formatFileSize(att.size) }}</span>
                  </div>
                  <a class="ni-attachment__download" [href]="att.data" [download]="att.name" title="Télécharger">
                    <span class="material-symbols-outlined">download</span>
                  </a>
                </div>
              }
            }
```

Note: no remove button in the success state — "Recommencer" serves that purpose.

- [ ] **Step 3: Add the 'attached' state block after the error block (after line 107)**

After the closing `}` of the error `@if` block, insert:
```html
            @if (extractionState() === 'attached') {
              @if (attachment(); as att) {
                <div class="ni-attachment">
                  @if (isImage(att.type)) {
                    <img class="ni-attachment__thumb" [src]="att.data" [alt]="att.name" />
                  } @else {
                    <div class="ni-attachment__pdf-icon">
                      <span class="material-symbols-outlined">picture_as_pdf</span>
                    </div>
                  }
                  <div class="ni-attachment__info">
                    <span class="ni-attachment__name">{{ att.name }}</span>
                    <span class="ni-attachment__size">{{ formatFileSize(att.size) }}</span>
                  </div>
                  <a class="ni-attachment__download" [href]="att.data" [download]="att.name" title="Télécharger">
                    <span class="material-symbols-outlined">download</span>
                  </a>
                  <button type="button" class="ni-attachment__remove" (click)="resetExtraction()" title="Supprimer la pièce jointe">
                    <span class="material-symbols-outlined">delete</span>
                  </button>
                </div>
              }
            }
```

- [ ] **Step 4: Remove section 04 entirely**

Delete the entire section 04 block (currently lines 332–382):
```html
      <!-- 04 — Pièce jointe -->
      <section class="ni-section ni-anim-4">
        ...
      </section>
```

Delete everything from `<!-- 04 — Pièce jointe -->` through its closing `</section>`.

- [ ] **Step 5: Build to verify no template errors**

```bash
cd comptabilite-frontend
npm run build 2>&1 | tail -30
```

Expected: `✔ Browser application bundle generation complete.` — no template compilation errors.

- [ ] **Step 6: Commit**

```bash
git add comptabilite-frontend/src/app/features/purchase-invoices/new-purchase-invoice/new-purchase-invoice.component.html
git commit -m "feat(upload): merge section 04 into section 00, add checkbox and attachment card"
```

---

### Task 4: SCSS — add checkbox style

**Files:**
- Modify: `comptabilite-frontend/src/app/features/purchase-invoices/new-purchase-invoice/new-purchase-invoice.component.scss`

No section 04 SCSS needs removal — all upload/attachment classes (`.ni-upload-zone`, `.ni-attachment`, etc.) are shared with section 00 and remain in use.

- [ ] **Step 1: Add .ni-extract-toggle at the end of the SECTION 00 — EXTRACTION IA block (after line 1567)**

```scss
.ni-extract-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  font-weight: 500;
  color: var(--color-on-surface);
  cursor: pointer;
  margin-bottom: 12px;
  user-select: none;

  input[type='checkbox'] {
    width: 16px;
    height: 16px;
    accent-color: var(--color-primary);
    cursor: pointer;
    flex-shrink: 0;
  }
}
```

- [ ] **Step 2: Build to verify**

```bash
cd comptabilite-frontend
npm run build 2>&1 | tail -10
```

Expected: `✔ Browser application bundle generation complete.`

- [ ] **Step 3: Commit**

```bash
git add comptabilite-frontend/src/app/features/purchase-invoices/new-purchase-invoice/new-purchase-invoice.component.scss
git commit -m "feat(upload): add ni-extract-toggle checkbox style"
```

---

### Task 5: Smoke test

- [ ] **Step 1: Start the backend**

```bash
cd comptabilite-backend && mvn spring-boot:run
```

Wait for: `Started ComptaApplication in X seconds`

- [ ] **Step 2: Start the frontend**

```bash
cd comptabilite-frontend && npm start
```

Wait for: `Local: http://localhost:4200/`

- [ ] **Step 3: Create mode — checkbox ON (default)**

Open `http://localhost:4200/purchase-invoice/create`:

1. Section 00 shows checkbox "Extraire automatiquement avec l'IA" ticked, upload zone below it.
2. Section 04 (Pièce jointe) is gone.
3. Drop a PDF/image → spinner appears → on success: green banner + attachment card with download link below it.
4. Click "Recommencer" → resets to idle (checkbox + empty upload zone).

- [ ] **Step 4: Create mode — checkbox OFF**

1. Uncheck "Extraire automatiquement avec l'IA".
2. Drop a file → no spinner, attachment card appears immediately with download link and remove (trash) button.
3. Click remove → resets to idle.
4. Fill form and save → redirects to list with no error, attachment stored.

- [ ] **Step 5: Edit mode**

Open an existing invoice that has an attachment:

1. Section 00 shows the attachment card immediately (download button present).
2. Download link works (file opens/downloads).
3. Save again → no error, attachment preserved.
