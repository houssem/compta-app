---
name: Precision Ledger
colors:
  surface: '#f9f9fe'
  surface-dim: '#dad9de'
  surface-bright: '#f9f9fe'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f8'
  surface-container: '#eeedf2'
  surface-container-high: '#e8e8ed'
  surface-container-highest: '#e2e2e7'
  on-surface: '#1a1c1f'
  on-surface-variant: '#43474f'
  inverse-surface: '#2f3034'
  inverse-on-surface: '#f1f0f5'
  outline: '#737780'
  outline-variant: '#c3c6d1'
  surface-tint: '#3a5f94'
  primary: '#001e40'
  on-primary: '#ffffff'
  primary-container: '#003366'
  on-primary-container: '#799dd6'
  inverse-primary: '#a7c8ff'
  secondary: '#515f74'
  on-secondary: '#ffffff'
  secondary-container: '#d5e3fc'
  on-secondary-container: '#57657a'
  tertiary: '#381300'
  on-tertiary: '#ffffff'
  tertiary-container: '#592300'
  on-tertiary-container: '#d8885c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d5e3ff'
  primary-fixed-dim: '#a7c8ff'
  on-primary-fixed: '#001b3c'
  on-primary-fixed-variant: '#1f477b'
  secondary-fixed: '#d5e3fc'
  secondary-fixed-dim: '#b9c7df'
  on-secondary-fixed: '#0d1c2e'
  on-secondary-fixed-variant: '#3a485b'
  tertiary-fixed: '#ffdbca'
  tertiary-fixed-dim: '#ffb690'
  on-tertiary-fixed: '#341100'
  on-tertiary-fixed-variant: '#723610'
  background: '#f9f9fe'
  on-background: '#1a1c1f'
  surface-variant: '#e2e2e7'
  status-paid: '#10B981'
  status-pending: '#F59E0B'
  status-overdue: '#EF4444'
  status-sent: '#3B82F6'
  status-draft: '#94A3B8'
  status-canceled: '#334155'
  surface-muted: '#F8FAFC'
  border-subtle: '#E2E8F0'
typography:
  display-kpi:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm-tabular:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
  table-row-height: 48px
  input-height: 40px
---

## Brand & Style

The brand personality is **authoritative, efficient, and unwavering.** This design system is built for professionals who handle high-stakes financial data, where clarity is a functional requirement rather than a stylistic choice. The UI must evoke a sense of **absolute reliability** and **systematic order**.

The chosen design style is **Corporate / Modern Minimalism**. It prioritizes extreme information density without visual clutter. The interface uses high-contrast typography and a rigid grid system to ensure that complex data tables and financial reports are scanned with zero cognitive friction. Decorative elements are removed in favor of functional signals like semantic color coding and crisp structural dividers.

## Colors

The palette is rooted in a **Deep Corporate Blue** primary, used for core navigation and primary actions to establish trust. The background logic relies on a "Clean White" workspace with "Slate Gray" accents for structural elements.

**Semantic Logic:**
- **Primary (#003366):** Reserved for global navigation, primary buttons (e.g., "Create Invoice"), and active states.
- **Surface Muted (#F8FAFC):** Used for table headers, sidebar backgrounds, and secondary card surfaces to create subtle depth.
- **Functional Spectrum:** Status colors are high-chroma to ensure they stand out against the neutral data grid. 
  - **Success (Paid):** Forest Green.
  - **Warning (Pending):** Amber Orange.
  - **Danger (Overdue):** Crimson Red.
  - **Info (Sent):** Royal Blue.
  - **Neutral (Draft/Canceled):** Slate and Dark Grays.

## Typography

The typography system utilizes **Inter** for its exceptional legibility and support for diverse character sets. 

**Numerical Readability:**
A critical requirement of the system is the use of **Tabular Figures (`tnum`)** and **Lining Figures (`lnum`)** for all financial data. This ensures that decimal points align perfectly in tables, allowing users to compare currency values at a glance.

**Hierarchy:**
- **Display KPI:** Used for top-level dashboard metrics (e.g., Total Turnover).
- **Body SM Tabular:** The workhorse for data tables. It balances high density with legibility.
- **Label Caps:** Used exclusively for table headers and form labels to provide a distinct visual anchor for data points.

## Layout & Spacing

This design system uses a **12-column Fixed-Fluid Hybrid Grid**. On desktop, the main content area has a maximum width of 1440px to prevent excessive line lengths in data tables, while the dashboard metrics row is fluid.

**Rhythm:**
A strict 4px baseline grid governs all vertical spacing. 
- **KPI Row:** Uses a 4-column horizontal distribution with 24px gutters.
- **Data Tables:** High-density vertical rhythm with 48px row heights to maximize information per screen.
- **Form Layouts:** Stacked labels with 8px spacing between label and input; 24px spacing between form groups.

**Adaptability:**
- **Mobile:** Reflows KPI cards into a single-column scroll; tables transition to a "card-list" format where each row becomes a standalone card with labeled data points.
- **RTL Support:** The layout is mirrored for Arabic localization, with icons and progress bars flipping orientation while numerical values maintain Western Arabic numerals where legally required.

## Elevation & Depth

To maintain a "Professional & Utilitarian" feel, the system avoids heavy shadows. Hierarchy is established through **Tonal Layering** and **Low-Contrast Outlines**.

- **Level 0 (Canvas):** The base background layer (#F8FAFC).
- **Level 1 (Card/Surface):** White surfaces (#FFFFFF) with a 1px border (#E2E8F0). No shadow. Used for data tables and main content containers.
- **Level 2 (Modals/Overlays):** White surfaces with a soft, 10% opacity neutral shadow (0px 4px 12px) to denote focus for email composition or configuration windows.
- **Dividers:** 1px solid lines (#E2E8F0) are used extensively to separate line items in invoices and columns in tables, replacing the need for depth-based separation.

## Shapes

The shape language is **geometric and precise**. 

- **UI Elements:** A "Soft" 4px radius (0.25rem) is applied to buttons, input fields, and checkboxes to prevent the interface from feeling aggressive while maintaining a serious, professional tone.
- **Large Components:** Dashboard cards and modals utilize an 8px radius (0.5rem) to provide a clear container edge.
- **Data Visualizations:** 
  - **Donut Charts:** Use clean, circular cuts for status repartition.
  - **Bar Charts:** Sharp or 2px rounded corners on bars to emphasize the "grid" nature of financial data.

## Components

**Data Tables:**
- Table headers must use `label-caps` typography with a `surface-muted` background.
- Financial columns (Amounts, VAT) must be right-aligned with `body-sm-tabular`.
- Status columns must use high-contrast text badges.

**Status Badges:**
- Subtle background tint (10% opacity of the semantic color) with high-contrast text.
- No borders on badges; 2px rounded corners.

**Form Inputs:**
- Standard height of 40px.
- Use `border-subtle` for default states; `primary_color` for active/focus states.
- Error states must use a 1px `status-overdue` border and helper text.

**Buttons:**
- **Primary:** Solid `primary_color` with white text.
- **Secondary:** Transparent background with `secondary_color` border and text.
- **Tertiary/Ghost:** Text only, used for "Cancel" actions or row-level actions like "Download PDF".

**KPI Cards:**
- Large `display-kpi` numbers.
- A vertical "status bar" on the left edge (4px wide) using the semantic color code to represent the category (e.g., Green for Monthly Turnover).