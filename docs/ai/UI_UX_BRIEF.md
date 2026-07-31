# UI/UX DESIGN BRIEF — The UniERP Design Language

> **Colour, type, spacing, motion, and the rules that keep 45 modules looking like one product.**
> One file. Amended, never replaced. Established 2026-07-30 · Read `README.md` § 0 before editing.

---

## 1. Design thesis

> **Enterprise software should feel like a good tool, not like a compliance obligation.**

Every incumbent ERP loses on interface. SAP is dense and hostile. NetSuite looks like 2009.
Odoo is friendly but visually inconsistent between modules. ERPNext is constrained by its
framework. **UX is our most winnable competitive front**, and it is won by consistency far more
than by decoration.

### The five design laws

| Law                             | Meaning in practice                                                                                                                          |
| :------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Clarity beats cleverness** | A user should never wonder what a control does. No mystery-meat icons, no ambiguous labels, no invented metaphors.                           |
| **2. Density with air**         | Professionals need data on screen. We achieve it with a tight type scale and disciplined spacing — not by removing whitespace.               |
| **3. Consistency is a feature** | Learning one module must teach you all 45. Identical patterns, identical positions, identical vocabulary.                                    |
| **4. Calm by default**          | Colour carries meaning, never decoration. A screen with nothing wrong is quiet. Saturation is reserved for things that need attention.       |
| **5. Speed is design**          | Perceived performance is a design property. Skeletons match the final layout; optimistic updates are the default; nothing shifts after load. |

### Applied HCI principles

- **Hick's Law** — fewer visible choices. Primary action prominent, secondary actions in an
  overflow menu, tertiary actions in the command palette only.
- **Fitts's Law** — the most frequent target is the largest and closest. Mobile targets ≥ 44 px.
- **Miller's Law** — group into 5–7 items. Long forms become sections; long menus become groups.
- **Jakob's Law** — behave like the software users already know. Standard conventions beat
  original ones every time.
- **Progressive disclosure** — the common path is on screen; the advanced path is one click away.

---

## 2. Tokens are the law

**Every visual value comes from a token.** A literal hex colour, a literal pixel value, or a
literal font size in application code is a **build failure**, enforced by a CI gate.

```
❌  color: #6366f1;      padding: 16px;      font-size: 14px;
✅  color: var(--color-primary);  padding: var(--space-4);  font-size: var(--text-sm);
```

Tokens live in `@unerp/ui-tokens` and ship as CSS custom properties. Themes swap the values;
component code never changes.

**Themes:** `light` (default) · `dark` · `enterprise` · `modern` · `minimal` · `classic` ·
`high-contrast`.
**Density:** `comfortable` (default) · `compact` — orthogonal to theme, applied via
`[data-density]`, and a user preference.

---

## 3. Colour

### 3.1 Semantic surfaces (light theme — the reference)

| Token                 | Value              | Use                                                                                 |
| :-------------------- | :----------------- | :---------------------------------------------------------------------------------- |
| `--color-bg`          | `#fafbfc`          | Page background. Deliberately off-white — pure white fatigues in an 8-hour workday. |
| `--color-bg-elevated` | `#ffffff`          | Cards, modals, dropdowns, table surfaces                                            |
| `--color-bg-sunken`   | `#f1f3f5`          | Wells, table headers, inset regions                                                 |
| `--color-bg-hover`    | `#f1f3f5`          | Row and control hover                                                               |
| `--color-bg-active`   | `#e9ecef`          | Pressed / selected                                                                  |
| `--color-bg-overlay`  | `rgb(0 0 0 / 0.5)` | Modal scrim                                                                         |

### 3.2 Borders and text

| Token                    | Value     | Use                                                        |
| :----------------------- | :-------- | :--------------------------------------------------------- |
| `--color-border`         | `#e2e8f0` | Default separators — **soft, never harsh**                 |
| `--color-border-strong`  | `#cbd5e1` | Inputs, emphasised boundaries                              |
| `--color-border-focus`   | `#6366f1` | Focus ring (always visible, never removed)                 |
| `--color-text`           | `#1a1a2e` | Primary. Near-black with a blue cast — softer than `#000`. |
| `--color-text-secondary` | `#555b67` | Labels, supporting copy                                    |
| `--color-text-tertiary`  | `#6b7280` | Metadata, timestamps, placeholders                         |
| `--color-text-link`      | `#6366f1` | Links                                                      |

### 3.3 Brand and status

| Role        | Token             | Value              | Meaning — used for nothing else                                                                                                                              |
| :---------- | :---------------- | :----------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Primary** | `--color-primary` | `#6366f1` (indigo) | The single brand accent. Primary actions, active nav, focus. Chosen because indigo reads as trustworthy and technical without the "every SaaS product" blue. |
| **Success** | `--color-success` | `#10b981`          | Completed, approved, posted, paid, in stock                                                                                                                  |
| **Warning** | `--color-warning` | `#f59e0b`          | Pending, expiring, low stock, needs attention                                                                                                                |
| **Danger**  | `--color-danger`  | `#f43f5e`          | Failed, rejected, overdue, destructive action                                                                                                                |
| **Info**    | `--color-info`    | `#0ea5e9`          | Neutral system information, tips                                                                                                                             |

Each status carries a four-part ramp: `-light` (background fill), base (border/icon),
`-hover`, and `-text` (accessible foreground on the light fill). **Status pills always use the
`-light` background with `-text` foreground** — never a saturated fill with white text, which
makes a busy list page shout.

### 3.4 Charts

Ten sequential tokens `--chart-1` … `--chart-10`, ordered so that adjacent series are
distinguishable in both light and dark themes **and under deuteranopia and protanopia**. Never
hand-pick a chart colour; never re-order the ramp per chart. Semantic status colours may be
used in a chart only when the series genuinely means that status.

### 3.5 Colour rules

1. Colour is never the sole carrier of meaning — always pair with an icon, label, or position.
2. Contrast: **4.5:1** for body text, **3:1** for large text and UI boundaries (WCAG 2.2 AA).
   `high-contrast` theme targets AAA.
3. No gradients in functional UI. Marketing surfaces may use them; the product does not.
4. A screen in a normal state uses primary + neutrals only. If a page is full of colour,
   something is wrong with the design, not the data.

---

## 4. Typography

| Token         | Size | Line height | Use                                             |
| :------------ | :--- | :---------- | :---------------------------------------------- |
| `--text-xs`   | 12px | 1.5         | Metadata, table captions, badges                |
| `--text-sm`   | 14px | 1.5         | **The workhorse.** Body, tables, forms, labels. |
| `--text-base` | 16px | 1.6         | Long-form reading, empty-state copy             |
| `--text-lg`   | 18px | 1.5         | Card titles, section headings                   |
| `--text-xl`   | 20px | 1.4         | Page subsections                                |
| `--text-2xl`  | 24px | 1.3         | Page titles                                     |
| `--text-3xl`  | 30px | 1.2         | Dashboard KPI figures                           |
| `--text-4xl`  | 36px | 1.1         | Marketing hero only — not used in the product   |

**Families**

- `--font-sans`: `Inter` → `Segoe UI` → `system-ui` → `-apple-system`. Inter is chosen for its
  tall x-height (legible at 14px), its **tabular figures**, and its open-source SIL licence.
- `--font-mono`: `JetBrains Mono` → `Fira Code` → `Consolas`. Codes, IDs, hashes, JSON.

**Rules**

1. **All numerals in tables, ledgers, and totals use `font-variant-numeric: tabular-nums`.**
   Non-aligned digits in a financial column is a defect, not a preference.
2. Weights: 400 body · 500 labels and table headers · 600 headings · 700 KPI figures only.
   Never 300 or lighter — it fails at 14px on a low-DPI office monitor.
3. Sentence case everywhere. Not Title Case, never ALL CAPS except a ≤ 4-character badge.
4. Measure: 60–75 characters for prose. Full width for tables.
5. Never centre body text. Never justify.

---

## 5. Spacing and layout

### 5.1 The 4px grid

Every dimension is a multiple of 4. `--space-1` = 4px through `--space-24` = 96px, with half
steps at `--space-0.5` (2px), `--space-1.5` (6px), and `--space-2.5` (10px) for fine control.

| Context                | Token                     | Value    |
| :--------------------- | :------------------------ | :------- |
| Icon ↔ label           | `--space-2`               | 8px      |
| Inside a form field    | `--space-2` / `--space-3` | 8 / 12px |
| Between fields         | `--space-4`               | 16px     |
| Card padding           | `--space-6`               | 24px     |
| Between cards          | `--space-4`               | 16px     |
| Between sections       | `--space-8`               | 32px     |
| Page padding (desktop) | `--space-6`               | 24px     |
| Page padding (mobile)  | `--space-4`               | 16px     |

Compact density scales these down one step; it does not change the grid.

### 5.2 Structure

| Element           | Value                                                           |
| :---------------- | :-------------------------------------------------------------- |
| Sidebar           | 260px expanded · 64px collapsed                                 |
| Top bar           | 56px, sticky                                                    |
| Content max width | 1440px for forms and reading; full-bleed for data tables        |
| Breakpoints       | `sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280 · `2xl` 1536        |
| Table row         | 44px comfortable · 36px compact                                 |
| Control height    | 36px default · 32px small · 44px large (and all mobile targets) |

### 5.3 Radius and elevation

Radii: `sm` 4px (badges, small controls) · `md` 6px (**inputs and buttons — the default**) ·
`lg` 8px (cards) · `xl` 12px (modals) · `2xl` 16px (marketing) · `full` (avatars, pills).

Elevation is a five-step scale (`--elevation-1` … `--elevation-5`) built from low-opacity
slate shadows — **soft, never dark**. Rule: resting cards use elevation 1–2; hovering a card
raises it to `--elevation-hover`; dropdowns 3; modals 4; toasts 5. Never stack a border and a
heavy shadow on the same element.

---

## 6. Motion

| Token               | Value                          | Use                                            |
| :------------------ | :----------------------------- | :--------------------------------------------- |
| `--duration-fast`   | 100ms                          | Hover, focus, colour change                    |
| `--duration-normal` | 200ms                          | **Default.** Dropdowns, tooltips, tab switches |
| `--duration-slow`   | 300ms                          | Modals, drawers, page transitions              |
| `--duration-slower` | 500ms                          | Celebratory / onboarding moments only          |
| `--ease-default`    | `cubic-bezier(.4,0,.2,1)`      | Almost everything                              |
| `--ease-out`        | `cubic-bezier(0,0,.2,1)`       | Entering the screen                            |
| `--ease-in`         | `cubic-bezier(.4,0,1,1)`       | Leaving the screen                             |
| `--ease-spring`     | `cubic-bezier(.34,1.56,.64,1)` | Toast entry, success confirmation — sparingly  |

**Rules:** motion communicates _where something came from_, nothing else. Animate only
`transform` and `opacity`. Never animate layout properties. Never animate a data table's rows.
**`prefers-reduced-motion: reduce` disables all non-essential motion** — this is mandatory,
not optional.

---

## 7. Component conventions

### Buttons

| Variant   | Use                        | Rule                                                                      |
| :-------- | :------------------------- | :------------------------------------------------------------------------ |
| Primary   | The one main action        | **Exactly one per view.** Two primaries means the hierarchy is undecided. |
| Secondary | Alternative actions        | Bordered, transparent background                                          |
| Ghost     | Toolbar and inline actions | No border until hover                                                     |
| Danger    | Destructive                | Always paired with a typed confirmation                                   |
| Link      | Navigation styled as text  | —                                                                         |

Order is always `[Cancel] [Confirm]` — destructive never gets the default focus. A button that
triggers async work shows an inline spinner _and_ stays disabled until resolution.

### Forms

Labels above fields, always (never placeholder-as-label). Required marked with `*` plus an
`aria-required`. Help text below the field in `--text-xs`/tertiary. Errors below, in danger
colour, **with an icon**, and stated as what to do (`"Enter a date on or after the invoice
date"`) — not what went wrong. Validate on blur, re-validate on change once errored.

### Tables

The shared `DataTable` from `@unerp/ui` is mandatory — hand-rolled `<table>` markup in a page
is a review rejection. Sticky header. Zebra striping off by default (borders are enough at our
row height). Numeric columns right-aligned with tabular figures. Sort via the shared
`.dt-sort-th` / `.dt-sort-arrow` convention only. Server-side pagination always.

### Status pills

`--radius-full`, `--text-xs`, weight 500, `-light` background, `-text` foreground, a 6px dot in
the base colour. Always the same colour for the same status **across every module**.

### Feedback

| Type         | Use                                                                                          |
| :----------- | :------------------------------------------------------------------------------------------- |
| Toast        | Transient success/failure. Top-right, 4s, stackable, with Undo where reversible.             |
| Inline alert | Persistent, contextual, in the flow of the page                                              |
| Modal        | Only when the user must decide before continuing. Never for information.                     |
| Drawer       | Detail or edit without losing list context. Preferred over a modal for anything with a form. |
| Banner       | Page- or system-level state (trial expiring, degraded service, offline)                      |

### Empty states

Always: a light illustration, a one-sentence explanation of what belongs here, and the primary
action. Never a bare "No data".

---

## 8. Accessibility — non-negotiable

Target: **WCAG 2.2 AA on every shipped screen.**

- Every interactive element is keyboard reachable, in a logical order, with a **visible focus
  ring** (`--color-border-focus`, 2px, 2px offset). Removing focus outlines is forbidden.
- Semantic HTML first; ARIA only where semantics genuinely fall short.
- Every icon-only button has an `aria-label`. Every image has meaningful `alt` or `alt=""`.
- Modals trap focus, close on `Esc`, and return focus to the trigger.
- Live regions announce async results (toasts, validation summaries, save confirmations).
- Forms: `<label for>` on every input; errors linked with `aria-describedby`;
  `aria-invalid` on failure.
- Colour contrast verified automatically in CI (axe) and manually per release.
- Fully usable at 200% browser zoom and at 320px viewport width.

---

## 9. Responsive and platform

| Surface                 | Approach                                                                                 |
| :---------------------- | :--------------------------------------------------------------------------------------- |
| Desktop web ≥ 1024      | Full sidebar, multi-column, dense tables                                                 |
| Tablet 768–1023         | Collapsed sidebar, 2-column forms, tables scroll horizontally in their own container     |
| Mobile web < 768        | Bottom nav, single column, **tables become card lists** — never a pinch-zoomed table     |
| Native mobile (Flutter) | Same tokens, platform-native navigation and gestures. Offline-first. Targets ≥ 44px.     |
| Desktop (Tauri)         | The web app plus native menus, keyboard shortcuts, notifications, and file-system access |

**Rule:** the page body never scrolls horizontally. Wide content (tables, charts, code) scrolls
inside its own `overflow-x: auto` container.

---

## 10. What we do not do

- ❌ Copy any incumbent ERP's visual language. We are not a Frappe/SAP/Odoo skin.
- ❌ Decorative icons. Every icon earns its place by aiding recognition.
- ❌ Hardcoded colours or pixel values in application code.
- ❌ Inline styles for layout or form structure.
- ❌ Ad-hoc components. If it does not exist in `@unerp/ui-*`, add it _there_ — with a
  Storybook entry — rather than locally in a page.
- ❌ Custom scrollbars, custom selects, custom date pickers built from scratch. Use the
  accessible Radix primitive and style it with tokens.
- ❌ Modal-on-modal. Ever.
- ❌ Animated skeletons that do not match the shape of the content they replace.

---

## 11. Amendment log

| Date       | Change                                                                                       | By          |
| :--------- | :------------------------------------------------------------------------------------------- | :---------- |
| 2026-07-30 | Document established; codifies the existing `@unerp/ui-tokens` system as the canonical brief | Claude Code |
