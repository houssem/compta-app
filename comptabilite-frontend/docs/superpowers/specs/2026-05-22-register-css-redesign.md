# Design Spec — Registration Page CSS Redesign

**Date:** 2026-05-22
**Scope:** SCSS-only reskin of `register.component.scss` — no HTML changes
**Approach:** Option B — Mirror new-client light theme

---

## 1. Goal

The registration page currently uses a custom dark glassmorphism theme (hardcoded dark colors, backdrop-filter, blue #3b7ff6 glow) that is inconsistent with every other page in the app. This spec replaces it with the light design system used by `new-client` and `login`, using CSS custom properties throughout.

---

## 2. Design Tokens Used

All values come from `src/styles.scss` `:root` — no new tokens introduced.

| Token | Value | Usage |
|---|---|---|
| `--color-background` | #f9f9fe | Page background |
| `--color-surface-container-lowest` | #fff | Card background |
| `--color-surface-container-low` | #f4f3f8 | Summary sections, footer bg |
| `--color-border-subtle` | #E2E8F0 | Borders, dividers |
| `--color-primary` | #001e40 | Active stepper, buttons, focus |
| `--color-on-primary` | #fff | Button text |
| `--color-on-surface` | #1a1c1f | Card title, input text |
| `--color-on-surface-variant` | #43474f | Labels, placeholders, ghost btn |
| `--color-outline-variant` | #c3c6d1 | Ghost button hover border |
| `--color-status-paid` | #10B981 | Done stepper circle, pending banner |

---

## 3. Component-by-Component Rules

### Page & Host
- `:host` background: `var(--color-background)`
- Remove dark radial gradient from `.rg-page`
- Keep `min-height: 100vh` flex column

### Card (`.rg-card`)
- Background: `var(--color-surface-container-lowest)` (#fff)
- Border: `1px solid var(--color-border-subtle)`
- Border-radius: `12px`
- Box-shadow: `0 2px 16px rgba(0, 30, 64, 0.06)`
- Remove `backdrop-filter`, `rgba(255,255,255,0.028)` background

### Stepper
| State | Circle bg | Circle color | Line |
|---|---|---|---|
| Inactive | `var(--color-border-subtle)` | `var(--color-on-surface-variant)` | `var(--color-border-subtle)` |
| Active | `var(--color-primary)` | `#fff` | — |
| Done | `var(--color-status-paid)` | `#fff` | green tint |

- Remove `glow-pulse` animation on active circle
- Label: 11px uppercase, `var(--color-on-surface-variant)` / active: `var(--color-primary)`

### Inputs & Selects
- Height: `42px`
- Background: `#fff`
- Border: `1.5px solid var(--color-border-subtle)`
- Border-radius: `8px`
- Font-size: `14px`
- Color: `var(--color-on-surface)`
- Placeholder: `var(--color-on-surface-variant)` at 45% opacity
- Focus: border `var(--color-primary)` + shadow `0 0 0 3px rgba(0,30,64,0.09)`
- Error: border `#ef4444` + shadow `0 0 0 3px rgba(239,68,68,0.1)`
- Icons: `var(--color-on-surface-variant)` at 55% opacity; turn `var(--color-primary)` on focus-within

### Buttons
- **Primary** (`--primary`): bg `var(--color-primary)`, color `#fff`, hover darkens to `#002d5c` + shadow
- **Ghost** (`--ghost`): transparent, `1.5px solid var(--color-border-subtle)`, text `var(--color-on-surface-variant)`, hover bg `var(--color-surface-container-low)`
- **Submit** (step 3): use `--primary` variant — remove separate `--success` green variant
- Height: `42px`, border-radius: `8px`, font-size: `14px`

### Labels
- Font-size: `11px`, weight `600`, uppercase, letter-spacing `0.07em`
- Color: `var(--color-on-surface-variant)`
- Required `*`: `#ef4444`

### Card Title & Subtitle
- Title: `22px` Syne 700, `var(--color-on-surface)`
- Subtitle: `14px`, `var(--color-on-surface-variant)`, line-height 1.6

### Summary (Step 4)
- Section bg: `var(--color-surface-container-low)`
- Section border: `1px solid var(--color-border-subtle)`
- Heading: 10px uppercase, `var(--color-primary)`, Syne 700
- Key: `var(--color-on-surface-variant)`, 12px
- Value: `var(--color-on-surface)`, 13px, weight 500

### Pending Banner
- Background: `rgba(16, 185, 129, 0.07)`
- Border: `1px solid rgba(16, 185, 129, 0.25)`
- Icon color: `var(--color-status-paid)`
- Text: `var(--color-on-surface-variant)` (replace current green-tinted text)

### Login Hint
- Color: `var(--color-on-surface-variant)`
- Link: `var(--color-primary)`, weight 700

### Footer
- Background: `var(--color-surface-container-low)`
- Top border: `1px solid var(--color-border-subtle)`
- Brand heading: Syne 800, `var(--color-primary)`
- Column headings: 11px uppercase, `var(--color-primary)`
- Links & text: `var(--color-on-surface-variant)`
- Bottom bar: same border-subtle separator, 11px, opacity 0.7

---

## 4. What Is Removed

- `backdrop-filter` / `-webkit-backdrop-filter`
- Dark radial gradient background
- `glow-pulse` keyframe animation on active stepper
- `--success` green button variant (use `--primary` for submit)
- All hardcoded dark rgba colors (replaced by CSS variables)
- Google Fonts import for DM Sans (app already loads Inter globally)
- Syne import can stay (already used by login/new-client)

---

## 5. What Is NOT Changed

- HTML template (`register.component.html`) — zero changes
- TypeScript (`register.component.ts`) — zero changes
- All class names (`.rg-*`) stay the same
- Animation keyframes `fadeUp`, `spin` — keep them
- Responsive breakpoints — keep existing media queries

---

## 6. Testing with Puppeteer

After implementation, use Puppeteer to screenshot all 4 steps at 1280×800 and 375×812 (mobile) to verify:
- Stepper active/done states render correctly on light background
- Input focus rings visible
- Error states visible
- Step 4 summary and pending banner readable
