# Purchase Invoice Upload Redesign

**Date:** 2026-05-31
**Branch:** feat/FACT-3-invoice-ai-extraction (or next feature branch)

## Goal

Merge the two file-upload areas on the "Nouvelle facture d'achat" page into one. Remove section 04 (Pièce jointe). Section 00 becomes the single place to attach a document, with an opt-in checkbox to trigger AI extraction.

## Motivation

Currently the page has two upload zones:
- Section 00 — AI extraction only (file not stored as invoice attachment)
- Section 04 — Attachment only (no AI)

This is confusing: users must upload the same document twice if they want both. The redesign gives one upload zone that optionally runs AI extraction, and always stores the file as the invoice attachment.

---

## Design

### Section 04 — Removed

The entire section 04 (Pièce jointe) is deleted from the HTML, along with its associated TS logic and SCSS classes (where not shared).

Removed from the component TS:
- `dragOver` signal
- `onDragOver`, `onDragLeave`, `onDrop` handlers
- `onFileSelected` handler
- `fileInput` template ref
- `fileError` signal
- `removeAttachment()` method (replaced by `resetExtraction()`)

The `attachment` signal itself stays — it is now populated from section 00.

---

### Section 00 — Merged upload + optional AI extraction

**Header:** unchanged — title "Import & extraction automatique", `auto_awesome` icon, "IA" badge.

**New signal:** `autoExtract = signal(true)` — drives the checkbox, defaults to ON.

**`extractionState`** gains a fifth value: `'attached'` — file uploaded with checkbox OFF.

#### State machine

| State | Trigger | What renders |
|---|---|---|
| `'idle'` | initial / after reset | Checkbox + upload zone |
| `'loading'` | file dropped/selected with checkbox ON | Loading spinner |
| `'success'` | extraction API returned data | Green success banner + attachment preview card |
| `'error'` | extraction API failed | Red error banner (no attachment card — user retries) |
| `'attached'` | file dropped/selected with checkbox OFF | Attachment preview card only |

#### Checkbox placement

Rendered at the top of the section body, above the upload zone, in `'idle'` state only:

```
☑ Extraire automatiquement avec l'IA
```

Standard HTML checkbox + label. Bound to `autoExtract` signal.

#### Upload logic (`onExtractUpload`)

```
read file → set attachment signal
if autoExtract():
    extractionState → 'loading'
    call extraction API → 'success' or 'error'
else:
    extractionState → 'attached'
```

#### Attachment preview card

The existing `.ni-attachment` card (currently in section 04) is reused in section 00 for two states:
- **`'attached'`** — shows the card alone
- **`'success'`** — shows the green success banner, then the card below it

The card always includes:
- File thumbnail (image) or PDF icon
- File name + size
- **Download button** — `<a [href]="att.data" [download]="att.name">` (base64 data URL)
- **Remove button** — calls `resetExtraction()` → back to `'idle'`, clears `attachment` signal

#### Edit mode

`patchFromInvoice()` sets `extractionState` to `'attached'` when the loaded invoice has an attachment. This ensures the attachment card (with download button) renders immediately on load.

The checkbox appears whenever `extractionState` is `'idle'` — including in edit mode if the user removes the current attachment and the zone resets to idle. This is correct: they may then upload a new file and choose whether to run extraction.

#### `resetExtraction()`

Resets `extractionState` to `'idle'` and clears the `attachment` signal. Handles both paths (attached-only and extraction).

---

## Out of scope

- Backend changes: none. The `attachment` field on `PurchaseInvoice` is unchanged.
- The `autoExtract` checkbox state is not persisted anywhere — it defaults to ON on every page load.
- No changes to the extraction API call itself.

---

## Files changed

| File | Change |
|---|---|
| `new-purchase-invoice.component.html` | Remove section 04 block; add checkbox + `'attached'`/`'success'` attachment card to section 00 |
| `new-purchase-invoice.component.ts` | Add `autoExtract` signal; add `'attached'` state; update `onExtractUpload`, `resetExtraction`, `patchFromInvoice`; remove section 04 handlers |
| `new-purchase-invoice.component.scss` | Remove section 04-only styles (if any are not shared with section 00) |
