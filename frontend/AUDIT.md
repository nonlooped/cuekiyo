# Frontend Technical Quality Audit

**Project**: Anime MV Pipeline — Frontend (`frontend/src/`)
**Date**: 2026-05-22
**Scope**: All source files under `frontend/src/`

---

## Audit Health Score

| # | Dimension | Score | Key Finding |
|---|-----------|-------|-------------|
| 1 | Accessibility | **2** | Custom keyboard nav exists but a nested `<a>` inside `<button>` blocks screen-reader/keyboard access to the Source link in CandidateSelection. |
| 2 | Performance | **2** | Unconditional polling every 3s even in background tabs; no code-splitting; missing memoization on filtered lists. |
| 3 | Theming | **2** | Core OKLCH tokens present, but semantic colors (danger, warning, success) are hard-coded across 10+ files. No semantic token system. |
| 4 | Responsive Design | **3** | Mobile-first layouts with adaptive nav and timeline, but several touch targets fall below 44×44px. |
| 5 | Anti-Patterns | **3** | Clean overall, but `bg-black/60` dim overlays violate the Not-Pure-Black rule; uppercase tracking-wider labels in CommandPalette echo admin-dashboard style. |
| **Total** | | **12/20** | **Acceptable** (significant work needed in a11y, perf, and theming) |

**Rating band**: 10–13 Acceptable (significant work needed)

---

## Anti-Patterns Verdict

**Pass.** This does not read as AI-generated. The design choices are intentional: an OKLCH-tinted dark studio palette, sparse lime accent restricted to action/selection/progress states, choreographed `motion.dev` transitions with `useReducedMotion` gates, and custom keyboard navigation for both song lists and candidate grids. There are no gradient-text hero metrics, no identical feature-card grids, no decorative glass cards, and no bounce/elastic easing.

**Specific tells avoided**: Side-stripe borders, gradient text, generic glassmorphism-as-default, the hero-metric template, identical card grids, modals-as-first-thought.

**Minor tells present**:
- `bg-black/60` overlay dimming on CommandPalette and KeyboardShortcutsHelp — pure black instead of a tinted neutral (`bg-studio/70` or similar).
- CommandPalette category headers use `uppercase tracking-wider` — a subtle Bootstrap/admin-dashboard tell that clashes with the otherwise calm Apple-ish restraint.

---

## Executive Summary

- **Audit Health Score**: **12/20** (Acceptable)
- **Total issues found**: 14 (P0: 0, P1: 6, P2: 6, P3: 2)
- **Top 3 critical issues**:
  1. **Nested interactive element** (`<a>` inside `<button>`) in CandidateSelection blocks keyboard and screen-reader access to the Source link.
  2. **Unconditional polling** in ProjectPage and ProgressPanel hits the API every 3 seconds even when the tab is hidden (waste + background battery drain).
  3. **Hard-coded semantic colors** (`text-red-200`, `bg-amber-300/10`, etc.) repeated in 10+ files create inconsistency and make theme-wide changes impossible.
- **Recommended next steps**:
  1. Run `impeccable harden` to fix accessibility gaps (nested interactive, missing labels, touch targets, skip link).
  2. Run `impeccable optimize` to fix performance issues (polling visibility, memoization, code-splitting).
  3. Run `impeccable colorize` or `impeccable extract` to build semantic color tokens and replace hard-coded Tailwind colors.

---

## Detailed Findings by Severity

### P1 — Major (fix before release)

#### [P1] Nested `<a>` inside `<button>` prevents keyboard access to Source link
- **Location**: `components/CandidateSelection.tsx`, lines 235–244 (inside `<motion.button>`)
- **Category**: Accessibility
- **Impact**: Screen-reader and keyboard users cannot reach the "Source" link independently. Activating it with Enter/Space triggers the outer button (selects the candidate). The `stopPropagation()` workaround does not affect keyboard navigation.
- **WCAG/Standard**: WCAG 2.1 4.1.2 Name, Role, Value; 2.1 Keyboard Accessible
- **Recommendation**: Move the `<a>` outside the `<button>`, or make the card a non-interactive container with two separate focusable children (select candidate button + source link).
- **Suggested command**: `impeccable harden CandidateSelection`

#### [P1] No skip-to-content link
- **Location**: `components/AppShell.tsx`
- **Category**: Accessibility
- **Impact**: Keyboard users must tab through the entire navigation rail (3+ items) on every page load before reaching main content.
- **WCAG/Standard**: WCAG 2.1 2.4.1 Bypass Blocks (Level A)
- **Recommendation**: Add a visually hidden "Skip to content" link that becomes visible on focus and targets `<main>`.
- **Suggested command**: `impeccable harden AppShell`

#### [P1] Progress bar is not exposed as a progressbar to assistive tech
- **Location**: `components/ProgressPanel.tsx`
- **Category**: Accessibility
- **Impact**: Screen-reader users hear only the percentage text. They get no role, no min/max, and no programmatic value updates.
- **WCAG/Standard**: WCAG 2.1 4.1.2 Name, Role, Value
- **Recommendation**: Add `role="progressbar"`, `aria-valuenow={pct}`, `aria-valuemin="0"`, `aria-valuemax="100"`, and `aria-label="{stage.label}"` to the progress track.
- **Suggested command**: `impeccable harden ProgressPanel`

#### [P1] Unconditional background polling
- **Location**: `pages/ProjectPage.tsx` (line ~70); `components/ProgressPanel.tsx` (line ~46)
- **Category**: Performance
- **Impact**: API calls fire every 3 seconds even when the user has switched tabs or minimized the browser. Wastes local backend resources and increases battery drain.
- **Recommendation**: Use `document.visibilityState` to pause polling when hidden, or wrap intervals in `requestAnimationFrame` / a visibility-aware hook.
- **Suggested command**: `impeccable optimize ProjectPage`

#### [P1] No code-splitting / lazy loading for routes
- **Location**: `src/App.tsx`
- **Category**: Performance
- **Impact**: Every page component is bundled into the initial chunk. The dashboard bundle grows with the full app surface.
- **Recommendation**: Wrap page imports in `React.lazy()` and add a `<Suspense>` boundary in `AppShell`.
- **Suggested command**: `impeccable optimize App.tsx`

#### [P1] Semantic colors hard-coded across the codebase
- **Location**: `StatusBadge.tsx`, `Toast.tsx`, `ProjectPage.tsx`, `Dashboard.tsx`, `ProjectSetup.tsx`, `SongSelection.tsx`, `ProgressPanel.tsx`, `SettingsPage.tsx`
- **Category**: Theming
- **Impact**: Changing the warning or error color requires touching 10+ files. No single source of truth. Inconsistent opacity variants (`/10`, `/30`, `/35`, `/40`) are scattered.
- **Recommendation**: Add semantic tokens to `@theme`: `--color-danger`, `--color-danger-bg`, `--color-warning`, `--color-warning-bg`, `--color-success`, `--color-success-bg`. Replace all Tailwind semantic colors with these tokens.
- **Suggested command**: `impeccable extract` (to pull tokens) then `impeccable colorize`

---

### P2 — Minor (fix in next pass)

#### [P2] Multiple touch targets below 44×44px
- **Location**:
  - `Dashboard.tsx` line ~154: delete button `size-8` (32px)
  - `Dashboard.tsx` line ~140: clear-search button (icon-only, ~16px hit area)
  - `ProjectSetup.tsx` line ~159: anime-remove button (icon-only)
  - `SongSelection.tsx` line ~137: clear-search button (icon-only)
  - `CandidateSelection.tsx` line ~117: clear-search button (icon-only)
  - `KeyboardShortcutsHelp.tsx` line ~65: close button `size-7` (28px)
- **Category**: Responsive / Accessibility
- **Impact**: Mobile and motor-impaired users may miss or fail to activate the control.
- **WCAG/Standard**: WCAG 2.1 2.5.5 Target Size (AAA)
- **Recommendation**: Wrap icon-only buttons in `grid size-10` (or at least `size-9`) or add explicit padding to reach 44×44px.
- **Suggested command**: `impeccable adapt` (to audit and fix touch targets)

#### [P2] Form inputs without proper labels
- **Location**: `pages/ProjectSetup.tsx` ("Songs" `<input type="number">`, "Clip length" `<input type="number">`)
- **Category**: Accessibility
- **Impact**: Screen-reader users cannot determine what these number fields control. They only hear "spin button" without a name.
- **WCAG/Standard**: WCAG 2.1 1.3.1 Info and Relationships; 3.3.2 Labels or Instructions
- **Recommendation**: Add `htmlFor` + `id` pairs, or `aria-label` / `aria-labelledby`.
- **Suggested command**: `impeccable harden ProjectSetup`

#### [P2] No route-level `<title>` updates
- **Location**: `src/App.tsx`
- **Category**: Accessibility
- **Impact**: Screen-reader users always hear "Anime MV Pipeline" regardless of whether they are on Dashboard, a project, or Settings.
- **WCAG/Standard**: WCAG 2.1 2.4.2 Page Titled (Level A)
- **Recommendation**: Use `react-helmet-async` (or a simple `useEffect` that sets `document.title`) to update titles: "Projects — Anime MV Pipeline", "Project: {title} — Anime MV Pipeline", etc.
- **Suggested command**: `impeccable harden App.tsx`

#### [P2] `aria-live` on ProgressPanel is noisy
- **Location**: `components/ProgressPanel.tsx` line ~70
- **Category**: Accessibility
- **Impact**: Every progress tick (every 3s) causes the live region to announce the new percentage, potentially interrupting screen-reader users.
- **Recommendation**: Remove `aria-live` from the progress wrapper, or move it to a polite region that only announces on stage changes (not every percentage tick). Ensure the progressbar role handles value changes instead.
- **Suggested command**: `impeccable harden ProgressPanel`

#### [P2] Scrollable `<pre>` blocks not keyboard-focusable
- **Location**: `pages/SettingsPage.tsx` line ~62 (install hints)
- **Category**: Accessibility
- **Impact**: Keyboard users cannot scroll horizontally or vertically through the code/command blocks.
- **WCAG/Standard**: WCAG 2.1 2.1.1 Keyboard
- **Recommendation**: Add `tabIndex={0}` only when content overflows (use `Element.scrollWidth > Element.clientWidth`), or wrap in a focusable container.
- **Suggested command**: `impeccable harden SettingsPage`

#### [P2] Missing memoization on derived/filtered lists
- **Location**: `pages/Dashboard.tsx` (`filteredProjects`), `components/SongSelection.tsx` (`grouped`), `components/CandidateSelection.tsx` (`filteredSongs`)
- **Category**: Performance
- **Impact**: Typing in search boxes triggers full list re-renders and re-groups on every keystroke. With moderate data size this causes jank.
- **Recommendation**: Wrap with `useMemo`.
- **Suggested command**: `impeccable optimize Dashboard` (and other pages)

---

### P3 — Polish (fix if time permits)

#### [P3] Overlay dimming uses `bg-black/60` (pure black)
- **Location**: `components/CommandPalette.tsx`, `components/KeyboardShortcutsHelp.tsx`
- **Category**: Anti-Pattern / Theming
- **Impact**: Minor deviation from the design principle that "the interface may read as black and white, but implementation must tint the extremes."
- **Recommendation**: Replace with `bg-studio/70` or a dedicated overlay token.
- **Suggested command**: `impeccable colorize`

#### [P3] CommandPalette category headers use `uppercase tracking-wider`
- **Location**: `components/CommandPalette.tsx` line ~248
- **Category**: Anti-Pattern
- **Impact**: Creates an admin-dashboard micro-aesthetic that conflicts with the calm Apple-ish restraint described in DESIGN.md.
- **Recommendation**: Use sentence-case `type-label` without uppercase transformation, or drop tracking-wider.
- **Suggested command**: `impeccable distil CommandPalette`

---

## Patterns & Systemic Issues

1. **Hard-coded semantic colors in 10+ components** — The project has a centralized `@theme` block but only defines aesthetic tokens (`studio`, `panel`, `lime`, `soft`, `muted`). Semantic status colors (`danger`, `warning`, `success`) are absent, so developers fallback to raw Tailwind colors (`red-200`, `amber-300/10`, `emerald-200`). This should be a one-time token extraction, not a per-file fix.

2. **Polling patterns are duplicated** — Both `ProjectPage` and `ProgressPanel` poll for jobs and logs with their own `setInterval`. A shared visibility-aware polling hook (`usePolling`) would consolidate this, respect `document.visibilityState`, and reduce API pressure.

3. **Search inputs lack debouncing** — All search boxes (Dashboard projects, SongSelection themes, CandidateSelection songs) update React state on every keystroke without `useDeferredValue` or debounce. This compounds with the missing memoization issue.

4. **Focus management on route changes is absent** — When navigating between routes (e.g., Dashboard → Project), focus remains on the nav link instead of moving to the new page content. A focus-management utility (or `focus-trap` + route-change focus reset) would improve keyboard flow.

---

## Positive Findings

1. **Focus-visible ring system** — `index.css` implements a global `focus-visible` style with `ring-2 ring-lime ring-offset-2 ring-offset-studio`. Every interactive element gets clear, non-color-only focus indication.

2. **Reduced motion** — All motion uses `useReducedMotion()` from `motion/react` and the CSS `@media (prefers-reduced-motion: reduce)` block zeroes out transitions. This is thorough and respectful.

3. **Custom keyboard navigation for lists** — `SongSelection` and `CandidateSelection` implement arrow-key, Enter/Space, and focus-roving behavior manually. This is rare and demonstrates real accessibility intent.

4. **Command palette ARIA** — Role (`listbox`/`option`), `aria-activedescendant`, `aria-autocomplete`, `aria-selected`, and `aria-label` are all correctly implemented. The palette is a reference-quality modal for keyboard users.

5. **Responsive navigation** — The bottom-sheet nav on mobile (`fixed inset-x-3 bottom-3`) is a thoughtful adaptation that preserves the floating-studio feel without cramming a sidebar onto a phone screen.

6. **Copy quality** — Status descriptions and action labels are creator-facing ("Review candidates", "Rendering final video") rather than backend-pipeline jargon. The PRODUCT.md principle is followed.

7. **No `dangerouslySetInnerHTML` or raw HTML injection** — All rendered content is safe React JSX. Even logs are rendered as text children.

---

## Recommended Actions (Priority Order)

1. **[P1] `impeccable harden CandidateSelection`**: Fix the nested `<a>` inside `<button>` accessibility blocker.
2. **[P1] `impeccable optimize ProjectPage`**: Pause polling when tab is hidden; add `React.lazy` code-splitting for routes.
3. **[P1] `impeccable harden AppShell`**: Add skip-to-content link and route-level `<title>` updates.
4. **[P1] `impeccable harden ProgressPanel`**: Add `role="progressbar"` with `aria-valuenow`, and remove noisy `aria-live`.
5. **[P1] `impeccable extract` (then `colorize`)**: Build semantic color tokens (`--color-danger`, `--color-warning`, `--color-success`) and replace hard-coded Tailwind semantic colors across all components.
6. **[P2] `impeccable adapt`**: Enforce 44×44px touch targets on icon-only buttons (delete, clear-search, close).
7. **[P2] `impeccable harden ProjectSetup`**: Add proper `<label>` associations for number inputs; ensure scrollable `<pre>` blocks are keyboard-accessible.
8. **[P2] `impeccable optimize Dashboard`**: Add `useMemo` to filtered lists and consider debouncing search inputs.
9. **[P3] `impeccable distil CommandPalette`**: Remove `uppercase tracking-wider` from category headers; replace `bg-black/60` with tinted overlay.
10. **[Final] `impeccable polish`**: Final visual and interaction pass after fixes.

---

> You can ask me to run these one at a time, all at once, or in any order you prefer.
>
> Re-run `impeccable audit` after fixes to see your score improve.
