# Register CSS Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the registration page's dark glassmorphism SCSS with the app's standard light design system so it looks consistent with the new-client and login pages.

**Architecture:** Pure SCSS rewrite of `register.component.scss` — all class names (`.rg-*`) stay the same, HTML and TypeScript are untouched. Every color/spacing value is replaced with CSS custom properties from `src/styles.scss`. Puppeteer screenshots verify all 4 steps render correctly.

**Tech Stack:** Angular 17 SCSS, CSS custom properties, Puppeteer (npx), `npm start` dev server on port 4200.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/app/features/register/register.component.scss` | **Rewrite** | All visual styling for the registration page |
| `src/app/features/register/register.component.html` | **No change** | — |
| `src/app/features/register/register.component.ts` | **No change** | — |

---

### Task 1: Replace page shell, card and animations

**Files:**
- Modify: `src/app/features/register/register.component.scss`

- [ ] **Step 1: Start the dev server in the background**

```bash
npm start &
```

Wait ~10s for it to be ready on http://localhost:4200/register.

- [ ] **Step 2: Replace the file header, host, keyframes, page and card blocks**

Replace the entire content of `src/app/features/register/register.component.scss` with the following (the rest of the tasks will append to this base):

```scss
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&display=swap');

:host {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--color-background);
  color: var(--color-on-surface);
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes spin { to { transform: rotate(360deg); } }

.rg-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--color-background);
}

/* ── MAIN ────────────────────────────────────────────────── */
.rg-main {
  flex: 1;
  padding: 52px 24px 72px;
  max-width: 700px;
  width: 100%;
  margin: 0 auto;

  @media (max-width: 560px) { padding: 32px 16px 52px; }
}

/* ── CARD ────────────────────────────────────────────────── */
.rg-card {
  background: var(--color-surface-container-lowest);
  border: 1px solid var(--color-border-subtle);
  border-radius: 12px;
  padding: 36px 40px;
  box-shadow: 0 2px 16px rgba(0, 30, 64, 0.06);

  @media (max-width: 560px) { padding: 24px 20px; }
}

.rg-anim { animation: fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both; }

.rg-card__title {
  font-family: 'Syne', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: var(--color-on-surface);
  margin-bottom: 6px;
  letter-spacing: -0.02em;
}

.rg-card__sub {
  font-size: 14px;
  color: var(--color-on-surface-variant);
  margin-bottom: 28px;
  line-height: 1.6;
}
```

- [ ] **Step 3: Verify in browser**

Open http://localhost:4200/register — the page should now have a light (#f9f9fe) background and a white card with a subtle border. The stepper will look broken (still dark) — that is expected, it will be fixed in Task 2.

- [ ] **Step 4: Commit**

```bash
git add src/app/features/register/register.component.scss
git commit -m "style(register): replace dark shell and card with light theme"
```

---

### Task 2: Rewrite the stepper

**Files:**
- Modify: `src/app/features/register/register.component.scss` (append)

- [ ] **Step 1: Append stepper styles**

Add the following block at the end of `register.component.scss`:

```scss
/* ── STEPPER ─────────────────────────────────────────────── */
.rg-stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 44px;
}

.rg-stepper__step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.rg-stepper__circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Syne', sans-serif;
  font-size: 14px;
  font-weight: 700;
  background: var(--color-border-subtle);
  border: 1.5px solid var(--color-border-subtle);
  color: var(--color-on-surface-variant);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  .material-symbols-outlined { font-size: 18px; }

  &--active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-on-primary);
    box-shadow: 0 4px 14px rgba(0, 30, 64, 0.28);
  }

  &--done {
    background: var(--color-status-paid);
    border-color: var(--color-status-paid);
    color: #fff;
    box-shadow: 0 2px 10px rgba(16, 185, 129, 0.28);
  }
}

.rg-stepper__label {
  font-size: 10px;
  font-weight: 600;
  color: var(--color-on-surface-variant);
  opacity: 0.55;
  white-space: nowrap;
  letter-spacing: 0.07em;
  text-transform: uppercase;

  &--active {
    color: var(--color-primary);
    opacity: 1;
    font-weight: 700;
  }
}

.rg-stepper__line {
  flex: 1;
  height: 1.5px;
  margin: 0 12px;
  margin-bottom: 22px;
  background: var(--color-border-subtle);
  transition: background 0.4s ease;

  &--done { background: rgba(16, 185, 129, 0.45); }
}
```

- [ ] **Step 2: Verify in browser**

Open http://localhost:4200/register — step 1 circle should be navy (#001e40), steps 2/3/4 circles light grey. Labels should be readable on the white background. Navigate to step 2 to see step 1 turn green with a checkmark.

- [ ] **Step 3: Commit**

```bash
git add src/app/features/register/register.component.scss
git commit -m "style(register): rewrite stepper for light theme"
```

---

### Task 3: Rewrite inputs, selects and labels

**Files:**
- Modify: `src/app/features/register/register.component.scss` (append)

- [ ] **Step 1: Append grid, field, label and input styles**

Add the following block at the end of `register.component.scss`:

```scss
/* ── GRID ────────────────────────────────────────────────── */
.rg-grid {
  display: grid;
  gap: 18px;
  margin-bottom: 24px;
  &--2 { grid-template-columns: 1fr 1fr; }
  @media (max-width: 560px) { &--2 { grid-template-columns: 1fr; } }
}

.rg-field { display: flex; flex-direction: column; gap: 6px; }
.rg-field--span2 { grid-column: span 2; @media (max-width: 560px) { grid-column: span 1; } }

/* ── LABELS ──────────────────────────────────────────────── */
.rg-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-on-surface-variant);
  text-transform: uppercase;
  letter-spacing: 0.07em;
}

.rg-req { color: #ef4444; margin-left: 2px; }

/* ── INPUTS ──────────────────────────────────────────────── */
.rg-input-wrap { position: relative; display: flex; align-items: center; }

.rg-input-icon {
  position: absolute;
  left: 12px;
  font-size: 17px;
  color: var(--color-on-surface-variant);
  opacity: 0.55;
  pointer-events: none;
  transition: color 0.18s, opacity 0.18s;
}

.rg-input {
  width: 100%;
  height: 42px;
  background: #fff;
  border: 1.5px solid var(--color-border-subtle);
  border-radius: 8px;
  padding: 0 14px;
  font-family: inherit;
  font-size: 14px;
  color: var(--color-on-surface);
  transition: border-color 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
  outline: none;

  &::placeholder {
    color: var(--color-on-surface-variant);
    opacity: 0.45;
  }

  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(0, 30, 64, 0.09);
  }

  &--icon { padding-left: 40px; }

  &--error {
    border-color: #ef4444;
    &:focus { border-color: #ef4444; box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1); }
  }
}

/* Focus-within: icon follows input focus */
.rg-input-wrap:focus-within .rg-input-icon {
  color: var(--color-primary);
  opacity: 1;
}

.rg-eye-btn {
  position: absolute;
  right: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  background: transparent;
  border: none;
  border-radius: 7px;
  cursor: pointer;
  color: var(--color-on-surface-variant);
  transition: background 0.15s, color 0.15s;

  .material-symbols-outlined { font-size: 18px; }

  &:hover {
    background: rgba(0, 30, 64, 0.06);
    color: var(--color-primary);
  }
}

/* ── SELECT ──────────────────────────────────────────────── */
.rg-select {
  width: 100%;
  height: 42px;
  background: #fff;
  border: 1.5px solid var(--color-border-subtle);
  border-radius: 8px;
  padding: 0 36px 0 14px;
  font-family: inherit;
  font-size: 14px;
  color: var(--color-on-surface);
  cursor: pointer;
  box-sizing: border-box;
  transition: border-color 0.15s, box-shadow 0.15s;
  appearance: none;
  outline: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='%2343474f'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 18px;

  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(0, 30, 64, 0.09);
  }

  &--error { border-color: #ef4444; }

  option { background: #fff; color: var(--color-on-surface); }
}

/* ── FILE UPLOAD ─────────────────────────────────────────── */
.rg-upload {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--color-surface-container-low);
  border: 1.5px dashed var(--color-border-subtle);
  border-radius: 8px;
  padding: 16px 18px;
  font-size: 13px;
  color: var(--color-on-surface-variant);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background: rgba(0, 30, 64, 0.03);
  }
}
.rg-upload-input { display: none; }

/* ── FIELD ERROR ─────────────────────────────────────────── */
.rg-field-error {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 500;
  color: #ef4444;
  margin-top: -2px;
  animation: fadeUp 0.2s ease both;

  .material-symbols-outlined { font-size: 14px; flex-shrink: 0; }
}
```

- [ ] **Step 2: Verify in browser**

Open http://localhost:4200/register step 1. Inputs should be white with a light grey border. Clicking an input should show a navy focus ring. The email icon should turn navy when the field is focused. The required `*` should be red.

- [ ] **Step 3: Commit**

```bash
git add src/app/features/register/register.component.scss
git commit -m "style(register): rewrite inputs, selects and labels for light theme"
```

---

### Task 4: Rewrite nav buttons and submit error

**Files:**
- Modify: `src/app/features/register/register.component.scss` (append)

- [ ] **Step 1: Append button and nav styles**

Add the following block at the end of `register.component.scss`:

```scss
/* ── NAV ─────────────────────────────────────────────────── */
.rg-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 24px;
  border-top: 1px solid var(--color-border-subtle);
  &--end { justify-content: flex-end; }
}

/* ── BUTTONS ─────────────────────────────────────────────── */
.rg-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 42px;
  padding: 0 20px;
  border-radius: 8px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
  text-decoration: none;
  letter-spacing: -0.01em;

  .material-symbols-outlined { font-size: 17px; }

  &:disabled { opacity: 0.45; cursor: not-allowed; }

  &--ghost {
    background: transparent;
    border: 1.5px solid var(--color-border-subtle);
    color: var(--color-on-surface-variant);

    &:hover:not(:disabled) {
      background: var(--color-surface-container-low);
      border-color: var(--color-outline-variant);
      color: var(--color-on-surface);
    }
  }

  &--primary {
    background: var(--color-primary);
    color: var(--color-on-primary);
    box-shadow: 0 4px 14px rgba(0, 30, 64, 0.22);

    &:hover:not(:disabled) {
      background: #002d5c;
      box-shadow: 0 6px 20px rgba(0, 30, 64, 0.32);
    }

    &:active:not(:disabled) { transform: scale(0.98); }
  }

  /* --success is removed; step 3 submit button now uses --primary */
}

.rg-spin { animation: spin 1s linear infinite; }

.rg-submit-error {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #dc2626;
  margin-bottom: 16px;
  padding: 11px 14px;
  background: rgba(239, 68, 68, 0.07);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;

  .material-symbols-outlined { font-size: 16px; flex-shrink: 0; }
}
```

- [ ] **Step 2: Update step 3 submit button class in HTML**

Open `src/app/features/register/register.component.html` and find line ~308:

```html
<button type="button" class="rg-btn rg-btn--success" (click)="next()" [disabled]="submitting()">
```

Change `rg-btn--success` to `rg-btn--primary`:

```html
<button type="button" class="rg-btn rg-btn--primary" (click)="next()" [disabled]="submitting()">
```

- [ ] **Step 3: Verify in browser**

Steps 1–3: "Next" button should be navy. "Back" button should be the ghost style (transparent with border). On step 3 the submit button should also be navy (not green).

- [ ] **Step 4: Commit**

```bash
git add src/app/features/register/register.component.scss src/app/features/register/register.component.html
git commit -m "style(register): rewrite buttons and nav for light theme"
```

---

### Task 5: Rewrite summary, pending banner and login hint

**Files:**
- Modify: `src/app/features/register/register.component.scss` (append)

- [ ] **Step 1: Append step 4 styles**

Add the following block at the end of `register.component.scss`:

```scss
/* ── SUMMARY (Step 4) ────────────────────────────────────── */
.rg-summary { margin-bottom: 24px; display: flex; flex-direction: column; gap: 10px; }

.rg-summary__section {
  padding: 16px 18px;
  background: var(--color-surface-container-low);
  border-radius: 10px;
  border: 1px solid var(--color-border-subtle);
  transition: border-color 0.15s;

  &:hover { border-color: var(--color-outline-variant); }
}

.rg-summary__heading {
  font-family: 'Syne', sans-serif;
  font-size: 10px;
  font-weight: 700;
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 12px;
}

.rg-summary__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid var(--color-border-subtle);
  &:last-child { border-bottom: none; padding-bottom: 0; }
}

.rg-summary__key {
  font-size: 12px;
  color: var(--color-on-surface-variant);
}

.rg-summary__val {
  font-size: 13px;
  color: var(--color-on-surface);
  font-weight: 500;
  max-width: 60%;
  text-align: right;
}

/* ── PENDING BANNER ──────────────────────────────────────── */
.rg-pending-banner {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  background: rgba(16, 185, 129, 0.07);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 10px;
  padding: 16px 18px;
  margin-bottom: 24px;
}

.rg-pending-banner__icon {
  color: var(--color-status-paid);
  font-size: 22px;
  flex-shrink: 0;
  margin-top: 1px;
}

.rg-pending-banner__text {
  font-size: 13px;
  color: var(--color-on-surface-variant);
  line-height: 1.65;
  strong { color: var(--color-on-surface); font-weight: 600; }
}

/* ── LOGIN HINT ──────────────────────────────────────────── */
.rg-login-hint {
  text-align: center;
  font-size: 13.5px;
  color: var(--color-on-surface-variant);
  margin-top: 24px;
}

.rg-login-hint__link {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 700;
  margin-left: 4px;
  transition: opacity 0.15s;
  &:hover { text-decoration: underline; }
}
```

- [ ] **Step 2: Verify in browser**

Navigate to step 4 (fill in and submit steps 1–3 with any values). The summary sections should have a light grey background with navy section headings. The pending banner should be light green-tinted with a readable dark text body.

- [ ] **Step 3: Commit**

```bash
git add src/app/features/register/register.component.scss
git commit -m "style(register): rewrite summary, pending banner and login hint"
```

---

### Task 6: Rewrite the footer

**Files:**
- Modify: `src/app/features/register/register.component.scss` (append)

- [ ] **Step 1: Append footer styles**

Add the following block at the end of `register.component.scss`:

```scss
/* ── FOOTER ──────────────────────────────────────────────── */
.rg-footer {
  background: var(--color-surface-container-low);
  border-top: 1px solid var(--color-border-subtle);
  padding: 40px 40px 0;

  @media (max-width: 560px) { padding: 28px 20px 0; }
}

.rg-footer__inner {
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 40px;
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 48px;

  @media (max-width: 640px) { grid-template-columns: 1fr; gap: 28px; }
}

.rg-footer__brand h3 {
  font-family: 'Syne', sans-serif;
  font-size: 18px;
  font-weight: 800;
  color: var(--color-primary);
  letter-spacing: -0.01em;
  margin-bottom: 8px;
}

.rg-footer__brand p {
  font-size: 13px;
  color: var(--color-on-surface-variant);
  line-height: 1.65;
}

.rg-footer__col h5 {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-primary);
  margin-bottom: 14px;
}

.rg-footer__col ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rg-footer__col ul li,
.rg-footer__col ul li a {
  font-size: 13px;
  color: var(--color-on-surface-variant);
  text-decoration: none;
  transition: color 0.15s;

  &:hover { color: var(--color-primary); }
}

.rg-footer__bottom {
  max-width: 1200px;
  margin: 0 auto;
  padding: 18px 0;
  border-top: 1px solid var(--color-border-subtle);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;

  @media (max-width: 560px) { flex-direction: column; align-items: flex-start; }
}

.rg-footer__bottom p {
  font-size: 11.5px;
  color: var(--color-on-surface-variant);
  opacity: 0.7;
}

.rg-footer__links { display: flex; gap: 24px; }

.rg-footer__links a {
  font-size: 11.5px;
  color: var(--color-on-surface-variant);
  opacity: 0.7;
  text-decoration: none;
  transition: opacity 0.15s, color 0.15s;

  &:hover { opacity: 1; color: var(--color-primary); }
}
```

- [ ] **Step 2: Verify in browser**

Scroll to the bottom of the page. The footer should have a light grey (#f4f3f8) background, navy headings ("Precision Ledger", column titles), and muted grey link text. It should match the login page footer visually.

- [ ] **Step 3: Commit**

```bash
git add src/app/features/register/register.component.scss
git commit -m "style(register): rewrite footer for light theme"
```

---

### Task 7: Puppeteer screenshot verification

**Files:**
- Create (temp): `stitch/screenshot-register.mjs`

- [ ] **Step 1: Ensure the dev server is running**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:4200
```

Expected: `200`. If not, run `npm start &` and wait 10s.

- [ ] **Step 2: Create the Puppeteer script**

Create `stitch/screenshot-register.mjs`:

```js
import puppeteer from 'puppeteer';
import { mkdir } from 'fs/promises';

const OUT = 'stitch/screenshots/register';
await mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage();

// Desktop: all 4 steps
await page.setViewport({ width: 1280, height: 800 });
await page.goto('http://localhost:4200/register', { waitUntil: 'networkidle2' });
await page.screenshot({ path: `${OUT}/step1-desktop.png`, fullPage: true });

// Fill step 1 and advance
await page.type('input[placeholder="Jean Dupont"]', 'Test User');
await page.type('input[placeholder="nom@entreprise.com"]', 'test@example.com');
const pwds = await page.$$('input[type="password"]');
await pwds[0].type('password123');
await pwds[1].type('password123');
await page.click('button.rg-btn--primary');
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/step2-desktop.png`, fullPage: true });

// Fill step 2 and advance
await page.select('select', 'Technologie');
await page.type('input[placeholder="Acme Corp SAS"]', 'Acme SAS');
await page.type('input[placeholder="Rue de la Paix"]', 'Rue de la Paix');
await page.type('input[placeholder="Paris"]', 'Paris');
await page.type('input[placeholder="75001"]', '75001');
const selects = await page.$$('select');
await selects[1].select('France');
await page.click('button.rg-btn--primary');
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/step3-desktop.png`, fullPage: true });

// Fill step 3 and advance
const inputs = await page.$$('input.rg-input');
await inputs[0].type('Test User');
await inputs[1].type('BNP Paribas');
await inputs[2].type('FR76 3000 6000 0112 3456 7890 189');
await inputs[3].type('BNPAFRPPXXX');
await page.click('button.rg-btn--primary');
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/step4-desktop.png`, fullPage: true });

// Mobile: step 1 only
await page.setViewport({ width: 375, height: 812 });
await page.goto('http://localhost:4200/register', { waitUntil: 'networkidle2' });
await page.screenshot({ path: `${OUT}/step1-mobile.png`, fullPage: true });

await browser.close();
console.log(`Screenshots saved to ${OUT}/`);
```

- [ ] **Step 3: Run the script**

```bash
npx puppeteer@24.43.1 node stitch/screenshot-register.mjs
```

Expected output: `Screenshots saved to stitch/screenshots/register/`

- [ ] **Step 4: Review the screenshots**

Open each PNG and verify:
- `step1-desktop.png` — light background, white card, navy stepper circle on step 1, white inputs with visible labels
- `step2-desktop.png` — step 1 circle is green ✓, step 2 circle is navy, white inputs
- `step3-desktop.png` — step 1+2 circles green ✓, step 3 is navy, submit button is navy (not green)
- `step4-desktop.png` — all 3 circles green ✓, light grey summary sections, green-tinted pending banner with dark text
- `step1-mobile.png` — single column layout, no horizontal overflow

- [ ] **Step 5: Commit the script (optional — keep for future CI use)**

```bash
git add stitch/screenshot-register.mjs
git commit -m "chore: add Puppeteer screenshot script for register page"
```
