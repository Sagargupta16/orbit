# orbit -- Frontend Design Reference

Single source of truth for orbit's visual language. Every frontend session builds to this spec. Derived from a CloseCRM-style dashboard reference (light, indigo-accented, floating white panels on a gray canvas) and the battle-tested token architecture in `apps/ledger-sync/frontend`.

Two things are separated on purpose:
- **Look** = the CloseCRM reference (what the UI should look like: light, airy, indigo).
- **Mechanism** = ledger-sync's `@theme` token system (how we implement it: CSS-first tokens, `data-theme` light/dark override, no raw Tailwind grays).

All color values below are WCAG 2.1 AA-verified. Where the raw reference color failed AA for normal text, the AA-safe value is used and the original is noted.

## 1. Architecture decision

Fork ledger-sync's token architecture, do not reinvent it:

- Tailwind v4 CSS-first config. Tokens live in a top-level `@theme { }` block in `frontend/src/index.css` (currently just `@import "tailwindcss";`). No JS theme config.
- Theme switching by a `data-theme` attribute on `<html>` (`light` | `dark`), NOT Tailwind's `dark:` class or a media query. Components reference tokens, so they flip automatically.
- **orbit is light-first** (the reference is light). ledger-sync is dark-first; we invert that: light tokens are the `:root` default, dark is the override. The dual-token mechanism is identical.
- Port `lib/theme.ts` (persist choice in localStorage `orbit-theme`, default to OS `prefers-color-scheme`, pre-paint inline script in `index.html` to avoid flash) and `constants/colors.ts` (resolve CSS vars to concrete hex at runtime -- needed only if/when charts/SVG land, since they can't read `var()`).
- Re-point the accent: ledger-sync's `--color-primary` is blue. orbit's primary is **indigo**. This is a token remap, not a rewrite.
- Prune ledger-only vocabulary (finance-semantic income/expense/savings tokens, KPI/chart typography tokens). orbit defines its own domain tokens for contacts / interactions / circles as needed.

## 2. Layout language (the signature look)

- **Sidebar**: fixed ~260px, solid white (`--surface`), full height. Logo top, grouped nav (primary items, then INSIGHT & CONTROL, SYSTEM, FAVORITES), user chip pinned bottom.
- **Canvas**: main area sits on a light gray page background (`--canvas` ~`#EAEBEE`).
- **Floating panels**: white content panels float on the gray canvas with a large-radius corner (`--radius-panel` 16px) and a soft, large-blur shadow. This "white panel floats on gray" treatment is the defining move -- do not flatten panels onto the canvas.
- **Content rhythm**: consistent 16px vertical spacing between sections; card padding 20-24px.
- **Safe-area insets** on the outer container (mobile notches).

## 3. Color tokens (AA-verified)

### Brand / accent -- indigo ramp

| Token | Hex | Use |
| --- | --- | --- |
| `--color-brand-50` | `#EEF2FF` | badge/tint backgrounds |
| `--color-brand-100` | `#E0E7FF` | hover tints |
| `--color-brand-400` | `#818CF8` | dark-mode accent |
| `--color-brand-500` | `#6366F1` | accent: toggles-on, selected radios, focus ring, links |
| `--color-brand-600` | `#4F46E5` | **primary button background** (white text = 6.29:1 AA; the reference `#6366F1` was 4.47, fails AA-normal) |
| `--color-brand-700` | `#4338CA` | button active/pressed |

### Neutrals & surfaces (flip per theme)

| Role | Light | Dark | Contrast on canvas |
| --- | --- | --- | --- |
| `--canvas` (page bg) | `#EAEBEE` | `#0A0F16` | - |
| `--surface` (panels/cards) | `#FFFFFF` | `#12181F` | - |
| `--surface-subtle` (inputs, row hover) | `#F5F6F8` | `#1A222C` | - |
| `--border-hairline` | `#EFF0F2` | `#232B36` | - |
| `--text-primary` | `#1F2430` | `#F2F6FB` | 15.52:1 on white -- pass |
| `--text-secondary` (muted, table headers) | `#6B7280` | `#93A1B3` | 4.83:1 -- pass (no margin) |
| `--text-placeholder` | `#727780` | `#7E8B9C` | 4.5:1 -- AA-safe (reference `#9AA1AC` was 2.6, fails) |
| `--sidebar-active-bg` | `#111114` | `#FFFFFF` | 18.85:1 -- pass |
| `--sidebar-active-fg` | `#FFFFFF` | `#111114` | - |

Note: the active sidebar item is a solid near-black pill (`#111114`) with white text -- **not** the indigo accent. Deliberate reference choice; keep it.

### Status badges (fully-rounded pills, soft tint bg + saturated text)

All values below pass AA-normal. Where the reference failed, the fixed value is shown.

| Badge | Text | Background | Ratio | Note |
| --- | --- | --- | --- | --- |
| Active | `#4F46E5` | `#EEF0FE` | 5.55 | pass |
| Paused | `#6A707E` | `#F3F4F6` | 4.5 | fixed (reference `#6B7280` = 4.39, failed) |
| Pending | `#2563EB` | `#EAF1FE` | 4.56 | pass (no margin) |
| Event / success (green) | `#067647` | `#E7F6EC` | 5.09 | use this, NOT `#16A34A` (2.95, fails) |
| Time / info (blue) | `#2563EB` | `#EAF1FE` | 4.56 | same as Pending |
| False / error (red) | `#C43E42` | `#FDEDEE` | 4.5 | fixed (reference `#E5484D` = 3.45, failed) |

## 4. Shape & type tokens

| Token | Value | Applies to |
| --- | --- | --- |
| `--radius-panel` | `1rem` (16px) | floating content panels |
| `--radius-card` | `0.875rem` (14px) | cards, table container |
| `--radius-control` | `0.5rem` (8px) | buttons, inputs, search |
| `--radius-badge` | `9999px` | status pills, toggles |
| `--font-sans` | `"Inter", ui-sans-serif, system-ui, sans-serif` | everything |

Type: semibold, tight-tracking (`tracking-tight`) headings; regular body; smaller muted labels for table headers (uppercase-ish, `--text-secondary`). Font weight via `font-semibold` / `font-medium`, not custom tokens.

## 5. Component specs

**DataTable** (the core pattern -- port ledger-sync's `DataTable` with `mobileCards`):
- Row height ~68px, generous. Hairline row separators (`--border-hairline`), no vertical grid lines.
- Header row: `--text-secondary`, medium weight, title-case. Sortable columns.
- Leading checkbox column, trailing 3-dot actions column.
- 32px circular avatars in owner/person columns; small line-icons in relational columns.
- Inline toggle switch = `--color-brand-500` on, gray track off; `--radius-badge`.
- Below 640px: each row collapses to a stacked label/value card (per-column `mobileLabel` / `mobilePrimary`). This satisfies the repo's mobile-first table rule.

**Toolbar**: segmented view-switcher (list/board/grid/chart), search input with `⌘K` hint aligned right, then Filters / Import / Template / Create actions.

**Primary button**: `--color-brand-600` bg, white text, `--radius-control`, medium weight, small leading `+` icon for create actions.

**Sidebar nav item**: default = `--text-secondary` + line icon; active = `--sidebar-active-bg` pill, white text, subtle inner contrast.

## 6. Mobile-first (non-negotiable -- most users are on phones)

- Sidebar collapses to a bottom `MobileTabBar` (port ledger-sync's) below the `md` breakpoint.
- Tables degrade to stacked cards (see DataTable).
- Floating panels go edge-to-edge (reduce canvas margin) on narrow viewports.
- Respect `prefers-reduced-motion` only for the theme cross-fade transition; do NOT tone down intentional UI motion elsewhere.

## 7. Paste-ready `@theme` starter for `index.css`

Not yet applied to the live file. Append after the existing `@import "tailwindcss";`.

```css
@import "tailwindcss";

@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));

@theme {
  /* Brand -- indigo */
  --color-brand-50: #eef2ff;
  --color-brand-100: #e0e7ff;
  --color-brand-400: #818cf8;
  --color-brand-500: #6366f1;
  --color-brand-600: #4f46e5;
  --color-brand-700: #4338ca;

  /* Font */
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;

  /* Radius */
  --radius-control: 0.5rem;
  --radius-card: 0.875rem;
  --radius-panel: 1rem;
  --radius-badge: 9999px;
}

/* Semantic tokens that flip by theme: raw values here, bridged into utilities via @theme inline */
:root,
[data-theme="light"] {
  --canvas: #eaebee;
  --surface: #ffffff;
  --surface-subtle: #f5f6f8;
  --border-hairline: #eff0f2;
  --text-primary: #1f2430;
  --text-secondary: #6b7280;
  --text-placeholder: #727780;
  --sidebar-active-bg: #111114;
  --sidebar-active-fg: #ffffff;
}

[data-theme="dark"] {
  --canvas: #0a0f16;
  --surface: #12181f;
  --surface-subtle: #1a222c;
  --border-hairline: #232b36;
  --text-primary: #f2f6fb;
  --text-secondary: #93a1b3;
  --text-placeholder: #7e8b9c;
  --sidebar-active-bg: #ffffff;
  --sidebar-active-fg: #111114;
}

@theme inline {
  --color-canvas: var(--canvas);
  --color-surface: var(--surface);
  --color-surface-subtle: var(--surface-subtle);
  --color-border-hairline: var(--border-hairline);
  --color-text-primary: var(--text-primary);
  --color-text-secondary: var(--text-secondary);
  --color-text-placeholder: var(--text-placeholder);
  --color-sidebar-active: var(--sidebar-active-bg);
  --color-sidebar-active-fg: var(--sidebar-active-fg);
}
```

`@theme inline` is required for the flip-by-theme tokens: it inlines the referenced value into the generated utility so overriding the underlying `:root` var in a `[data-theme="dark"]` scope actually repaints `bg-surface`, `text-primary`, etc. Without `inline`, the utility would point at the wrapper var and not respond.

## 8. Open decisions

- **Light-first vs dark-first default**: spec assumes light default (reference is light) with dark available via the same mechanism. Confirm before shipping the toggle.
- **Font**: reference reads as Inter. Confirm before wiring `@fontsource/inter` or a CDN link (no new dep without asking, per repo rules).
- Badge backgrounds listed are light-theme; dark-theme badge tints to be derived when dark is built.

## Provenance

- Reference aesthetic: CloseCRM-style dashboard screens (Gr8r Studio), supplied 2026-07-21.
- Tailwind v4 `@theme` syntax verified against current Tailwind docs via context7.
- Contrast ratios: WCAG 2.1 relative-luminance, computed 2026-07-21.
- Architecture source: `apps/ledger-sync/frontend/src/index.css`, `lib/theme.ts`, `constants/colors.ts`.
