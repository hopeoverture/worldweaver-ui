You are my senior UI/UX engineer. Make the UI cohesive, consistent, and aligned with modern best practices—then produce diffs and a report. You may create/edit files.

## Context
- Stack: Next.js (App Router, TypeScript). Styling may be Tailwind/CSS Modules/Styled Components—detect and adapt.
- Goals: Design tokens, consistent components, accessible patterns, responsive layout, dark mode, robust states, and automated checks.

## Deliverables
1) A unified **design token source** with CSS variables (and Tailwind bridge if applicable).
2) A **base component library** (Buttons, Inputs, Selects, Textarea, Checkbox/Radio, Toggle, Badge, Alert, Card, Modal/Drawer, Tooltip, Tabs, Accordion, Breadcrumbs, Pagination, Navbar/Sidebar/Footer, Skeleton/Spinner).
3) **Accessible patterns** (labels, roles, aria-*, keyboard navigation, focus rings, color contrast ≥ WCAG AA).
4) **Responsive system** (breakpoints, container widths, grid, clamp() typography).
5) **Complete state coverage** (hover/focus/active/disabled/loading/success/error/empty).
6) **Documentation**: `UI_GUIDE.md` with usage, dos/don’ts, and code examples.
7) **Automation**: lint rules, Storybook (or equivalent), a11y tests, visual tests, and scripts to run them.
8) A final **UI Cohesion Report** summarizing what changed, open issues, and how to keep it consistent.

## Required Tasks (perform all)
### 1) Inventory & Audit
- Crawl `app/`, `components/`, `styles/` to list components, variants, utilities, and ad-hoc styles.
- Detect duplicated colors, spacing, typography, radii, shadows, motion, and icon usage. Record in `reports/ui-inventory.json`.
- Flag anti-patterns: inline hex/RGB, inconsistent paddings, magic numbers, one-off font sizes, missing focus states, low contrast, non-semantic elements.

### 2) Design Tokens (single source of truth)
- Create `styles/tokens.css` with CSS variables:
  - Color: `--bg`, `--fg`, `--muted`, `--primary`, `--primary-contrast`, `--border`, semantic success/warn/danger.
  - Surface/elevation: `--elev-0..4` shadows.
  - Radius: `--radius-0..3`.
  - Spacing scale: `--space-0..8` (0,2,4,8,12,16,24,32,48,64px).
  - Typography: `--font-sans`, `--font-mono`, `--text-xs..3xl`, line-heights.
  - Motion: `--ease-standard`, `--ease-emphasized`, `--dur-1..4`.
- Add **dark mode** via `[data-theme="dark"]` overrides and respect `prefers-color-scheme`.
- If Tailwind is present, update `tailwind.config.ts` to map theme colors/spacing/rounded/shadow to the variables.
- Replace hardcoded styles with tokens across components/pages.

### 3) Base Components & Variants
- Create `src/components/ui/*` with composable, accessible primitives (prefer headless patterns; if Radix/Headless UI exists, standardize on it).
- Each component:
  - Accepts `className` for composition.
  - Exposes size variants (`sm/md/lg`), tone variants (default/primary/ghost/destructive), and loading/disabled props.
  - Keyboard and screen-reader support (aria-pressed, aria-expanded, role attributes, `aria-describedby` for inputs).
  - Focus-visible ring that meets or exceeds contrast guidelines.
- Add empty/loading/error **page states** and **Skeleton** components.

### 4) Forms & Validation
- Standardize `FormField` with `<label for>` + `id`, `required`, `aria-invalid`, `aria-describedby` for errors/hints.
- Provide input masks, async loading states, and debounced validation where needed.
- Ensure **error, help, and success** messages are consistently styled and announced (ARIA live region).

### 5) Layout & Responsiveness
- Define container widths and gutters; add responsive grid helpers.
- Use `clamp()` for fluid type and spacing on hero titles and large headings.
- Fix Cumulative Layout Shift (CLS): reserve image/cover aspect ratios, predefine container heights for skeletons.

### 6) Accessibility & Motion
- Install/enable `eslint-plugin-jsx-a11y` and fix all violations.
- Ensure all interactive targets meet **44×44** tap size on mobile.
- Respect `prefers-reduced-motion`: disable non-essential animation and provide reduced-motion variants.

### 7) Navigation & Overlays
- Add a **Skip to content** link.
- Ensure modals/drawers have focus trap, aria-modal, labelledby/ describedby, and ESC/overlay dismissal patterns.
- Ensure menu/combobox/listbox patterns follow WAI-ARIA Authoring Practices.

### 8) Icons & Images
- Consolidate to one icon set; wrap with `<Icon name="...">`.
- Use Next.js `<Image>` with width/height or `fill` + sizes; add `alt` everywhere; avoid decorative alt text.

### 9) Performance Hygiene
- Tree-shake icons, code-split heavy UI, avoid reflow-heavy effects.
- Preload critical fonts; use `font-display: swap`.
- Prefer CSS for simple animations; limit JS where possible.

### 10) Tooling & Automation
- Add/enable: ESLint + Prettier; (Tailwind plugin if applicable); Stylelint if using CSS files.
- Add **Storybook** with:
  - a11y addon (axe),
  - interactions addon,
  - viewport presets.
- Write stories for all UI primitives with states/variants.
- Add `@testing-library/react` tests for interactive components (focus/keyboard).
- Optional: set up Chromatic or local Playwright visual tests.

### 11) Docs
- Create `UI_GUIDE.md` covering:
  - Design tokens, color usage, spacing scale, type ramp.
  - Component API tables and examples.
  - Accessibility checklist and patterns.
  - Theming (light/dark) and how to add a new tone/variant.
  - Review checklist for PRs.

### 12) Migrate & Refactor
- Replace ad-hoc styles with tokens and shared components.
- Remove duplicated components; add deprecation comments where needed.
- Provide codemods or scripted replacements for common className fixes (if Tailwind).

## Acceptance Criteria (all must pass)
- **A11y**: No `eslint-plugin-jsx-a11y` errors; Storybook a11y passes for all components; color contrast ≥ AA.
- **Consistency**: No hardcoded colors/spacing outside `tokens.css` (exceptions documented).
- **States**: All interactive components display consistent hover/focus/active/disabled/loading states.
- **Responsiveness**: Layout holds for mobile/tablet/desktop breakpoints; images have stable aspect ratios (no CLS).
- **Docs**: `UI_GUIDE.md` present and accurate; every public component documented with examples.
- **Automation**: The following succeed:
  - `npm run lint`
  - `npm run test`
  - `npm run storybook` (stories render; a11y addon reports no critical issues)

## Outputs
- File diffs for all changes.
- `reports/ui-inventory.json` and a human-readable `reports/ui-cohesion-report.md` listing:
  - Issues found → actions taken.
  - Token scales and mapping decisions.
  - Components added/removed/refactored.
  - Remaining TODOs with pointers.

## Starter snippets (adapt as needed)

--- styles/tokens.css ---
:root{
  --bg:#0b0c0f; --fg:#0f1115; /* replace with your actual palette */
  --surface: #ffffff; --surface-2:#f6f7f9;
  --primary:#3b82f6; --primary-contrast:#ffffff;
  --muted:#6b7280; --border:#e5e7eb;
  --success:#16a34a; --warning:#f59e0b; --danger:#ef4444;

  --radius-0:0; --radius-1:6px; --radius-2:10px; --radius-3:16px;
  --space-0:0; --space-1:2px; --space-2:4px; --space-3:8px; --space-4:12px;
  --space-5:16px; --space-6:24px; --space-7:32px; --space-8:48px;

  --text-xs:0.75rem; --text-sm:0.875rem; --text-md:1rem;
  --text-lg:1.125rem; --text-xl:1.25rem; --text-2xl:1.5rem; --text-3xl:1.875rem;

  --ease-standard:cubic-bezier(.2,.0,.0,1);
  --ease-emphasized:cubic-bezier(.2,.0,.0,1);
  --dur-1:120ms; --dur-2:200ms; --dur-3:300ms; --dur-4:500ms;
}
[data-theme="dark"]{
  --surface:#0b0c0f; --surface-2:#111317;
  --fg:#e5e7eb; --muted:#9aa3af; --border:#23262d;
}

--- src/components/ui/button.tsx ---
import * as React from "react";
type Variant = "default" | "primary" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";
export function Button({
  as:Comp="button",
  variant="default",
  size="md",
  loading=false,
  disabled,
  className="",
  ...props
}: React.ComponentProps<any> & {variant?:Variant; size?:Size; loading?:boolean}) {
  const base = "relative inline-flex items-center justify-center rounded-[var(--radius-1)] outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
  const sizes = { sm:"h-8 px-3 text-sm", md:"h-10 px-4 text-sm", lg:"h-12 px-5 text-base" };
  const tones = {
    default:"bg-[var(--surface-2)] text-black hover:opacity-95",
    primary:"bg-[var(--primary)] text-[var(--primary-contrast)] hover:opacity-95",
    ghost:"bg-transparent hover:bg-black/5",
    destructive:"bg-[var(--danger)] text-white hover:opacity-95"
  };
  return (
    <Comp
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={`${base} ${sizes[size]} ${tones[variant]} ${className}`}
      {...props}
    />
  );
}

--- package.json additions ---
{
  "scripts": {
    "lint": "next lint",
    "test": "vitest run",
    "storybook": "storybook dev -p 6006"
  }
}

Proceed now. When done, print:
1) A diff summary of files changed.
2) Any remaining a11y or cohesion TODOs with file paths.
3) Commands for me to run: `npm run lint`, `npm run test`, `npm run storybook`.
