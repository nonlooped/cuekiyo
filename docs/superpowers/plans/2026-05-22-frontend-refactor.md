# Frontend Design Refactor — "Floating Cut Room"

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove blanket panel wrapping, fix typography hierarchy, demote project-page sidebar, eliminate status duplication, fix mobile fixed-position stacking, and introduce selective floating surfaces per DESIGN.md.

**Architecture:** Strip `rounded-2xl border border-white/10 bg-panel/70` from main content containers on every page; use tonal surface changes and vertical spacing for hierarchy. Reserve liquid-glass treatment for true floating elements (nav, overlays, action buttons on cards, inspectors). Introduce a typography scale with Label (`text-xs`), Body (`text-[15px]`), and Headline (`text-xl/2xl` tiers). Restructure ProjectPage so active workflow stage is the hero. Consolidate mobile action bars into a non-sticky command area.

**Tech Stack:** React 19, Tailwind CSS 4, motion/react (already present), no new dependencies.

---

## File Impact Map

| File | Action | Responsibility |
|------|--------|---------------|
| `frontend/src/index.css` | Modify | Add typography utility classes, prose cap utility, remove old `.prose-capped` |
| `frontend/src/components/AppShell.tsx` | Modify | Bottom nav on mobile stays; add top margin for desktop to free bottom edge |
| `frontend/src/pages/Dashboard.tsx` | Modify | Remove panel wrapping from list; tonal backgrounds; use Body/Label scale |
| `frontend/src/pages/ProjectPage.tsx` | Modify | Hero layout: sidebar optional & lighter; active task full-width; remove duplicative status |
| `frontend/src/components/ProjectHeader.tsx` | Modify | Remove StatusBadge + action chip duplications; keep metadata; use scale |
| `frontend/src/components/PipelineTimeline.tsx` | Tweak | Keep as-is (it's already excellent), minor mobile label polish |
| `frontend/src/components/SongSelection.tsx` | Modify | Strip blanket panel; sticky action area becomes inline at bottom of component |
| `frontend/src/components/CandidateSelection.tsx` | Modify | Strip blanket panel; sidebar tonal treatment; fix mobile |
| `frontend/src/components/RenderOrder.tsx` | Modify | Strip blanket panel; mobile action consolidation; typography scale |
| `frontend/src/components/ProgressPanel.tsx` | Modify | Strip blanket panel; lighter tonal surface; typography scale |
| `frontend/src/components/CompletedOutput.tsx` | Modify | Strip blanket panel; typography scale |
| `frontend/src/pages/ProjectSetup.tsx` | Modify | Strip blanket panel; typography scale; lighter sidebar |
| `frontend/src/pages/SettingsPage.tsx` | Modify | Strip blanket panel; typography scale; simpler grid cards |

---

### Task 1: Typography Scale in CSS

**Files:**
- Modify: `frontend/src/index.css`

Add consistent type scale utility classes:
- `.type-label` — `text-xs font-medium` for chips, metadata, captions
- `.type-body` — `text-[15px] leading-relaxed` for descriptions and prose
- `.type-title` — `text-lg font-medium` for section headers inside workflow
- `.type-headline` — `text-2xl font-semibold tracking-tight leading-tight` for page-level headings
- `.surface-float` — `rounded-2xl border border-white/10 bg-panel/70` (for true floating elements)
- `.surface-tonal` — `bg-panel/40` or no wrapper (for content sections)
- `.surface-quiet` — `bg-white/[0.04]` (for subtle grouping)

Steps:
- [ ] Add `.type-label`, `.type-body`, `.type-title`, `.type-headline` classes
- [ ] Add `.surface-float`, `.surface-tonal` utilities
- [ ] Remove old `.prose-capped` (replaced by inline `max-w-2xl` + `.type-body`)
- [ ] Keep existing OKLCH theme tokens, checkbox styles, focus rings

---

### Task 2: AppShell — Prepare Mobile Action Space

**Files:**
- Modify: `frontend/src/components/AppShell.tsx`

Current mobile bottom nav occupies `fixed inset-x-3 bottom-3`. Child components add `sticky bottom-24` action bars which create stacking.

Changes:
- Keep bottom nav as-is (it IS a legitimate floating surface per DESIGN.md).
- Remove `pb-28` from `<main>` padding — child components should not add their own sticky bars.
- On mobile, switch `<main>` bottom padding to `pb-24` (accounting only for bottom nav).
- This prepares children to use inline action placement instead of sticky bars.

---

### Task 3: Dashboard — Remove Blanket Panels

**Files:**
- Modify: `frontend/src/pages/Dashboard.tsx`

Changes:
- Page title and description: use `.type-headline` and `.type-body` with `max-w-2xl`.
- "New project" button: keep as-is (it's a floating action, use `.surface-float` if it needs a wrapper, but it's fine inline).
- Missing binaries warning: this IS a floating callout — keep `rounded-2xl border` but use `.surface-float`.
- Error banner: keep as floating alert.
- Loading skeleton: remove `py-5` wrapping divs; each skeleton row sits directly on `bg-studio`.
- Project list: remove outer panel wrapper. List items use `border-b border-white/10` divider. Hover becomes `bg-white/[0.03]`. No `rounded-2xl border bg-panel`.
- StatusBadge, time, title, description: apply `.type-body` to description, `.type-label` to time.
- Empty state: keep centered but remove panel wrapper.
- Delete confirmation: keep inline, no panel.

---

### Task 4: ProjectPage — Hero Layout & Sidebar Demotion

**Files:**
- Modify: `frontend/src/pages/ProjectPage.tsx`

Changes:
- Remove outer panel wrapping from the entire page (there is none, but verify nothing adds an implicit wrapper).
- "Current checkpoint" sidebar: reduce to `bg-white/[0.02]` (no border, no radius) when non-terminal. Keep info but make it a floating metadata strip, not a bordered panel.
- Remove the `xl:grid-cols-[minmax(0,1fr)_340px]` grid. Instead, when sidebar needs to show: use `flex flex-col gap-6` with sidebar below or as a floating strip.
- Actually, better approach: keep sidebar on desktop but demote visually. On mobile, it drops to a compact metadata strip between PipelineTimeline and main content.
- Active workflow component (SongSelection, CandidateSelection, RenderOrder, etc.) should be the hero — full width by default, with metadata as a secondary strip.
- Keep PipelineTimeline as-is.
- Keep progress/error messages but make them lighter (no panel wrapper).

---

### Task 5: ProjectHeader — Remove Duplicative Status Channels

**Files:**
- Modify: `frontend/src/components/ProjectHeader.tsx`

Changes:
- Remove `StatusBadge` — the PipelineTimeline already communicates status.
- Remove `getProjectAction` chip next to status — redundant.
- Keep metadata grid (right side on desktop) but reduce: use `text-sm` for values, `type-label` for labels.
- Title stays `.type-headline`.
- On mobile, metadata grid collapses below title.
- Description: use `.type-body`.

---

### Task 6: PipelineTimeline — Minor Mobile Label

**Files:**
- Modify: `frontend/src/components/PipelineTimeline.tsx`

Changes:
- Keep existing animation and structure.
- Mobile compact view: add stage count context "Step X of 8" stays, but consider showing NEXT and PREVIOUS stage names truncated to give Jordan (first-timer) more context. Actually, the compact view is already functional; keep but keep the label visible.
- No structural changes needed — this component is already excellent.

---

### Task 7: SongSelection — Strip Panel, Inline Actions

**Files:**
- Modify: `frontend/src/components/SongSelection.tsx`

Changes:
- Remove outer `rounded-2xl border border-white/10 bg-panel/70` wrap.
- Header area: icon + title + count sits directly on `bg-studio`.
- Theme list groups: remove section panel wrap. Each group uses `mb-8` spacing. Group header uses `type-label` (capitalize). Items use `bg-white/[0.03]` or transparent with border.
- Selected items: use `border-lime/50 bg-lime/10` (already present, stays).
- **Key mobile fix:** Remove `sticky bottom-24` action bar. Move action and confirm checkbox to an inline div at the bottom of the scrollable content, NOT fixed/sticky.
- Typography: apply `.type-body` to descriptions, `.type-label` to counts, `.type-title` to section titles.

---

### Task 8: CandidateSelection — Strip Panel, Sidebar Tonal

**Files:**
- Modify: `frontend/src/components/CandidateSelection.tsx`

Changes:
- Sidebar: remove `rounded-2xl border border-white/10 bg-panel/70`. Use `bg-white/[0.03]` with subtle top border, or no border, just `space-y-1` with `px-3 py-2` items.
- Main section: remove outer panel. Header with icon sits directly on `bg-studio`. Content area has candidate buttons as true cards (these ARE floating content, keep `rounded-2xl border` on individual candidate cards).
- Candidate cards: keep `rounded-2xl border` (they are cards with content — this is legitimate per DESIGN.md). Remove panel from the container wrapping them.
- Mobile: sidebar becomes a horizontal scrollable song selector strip at top, or collapsible. Actually, keep current sidebar but don't wrap in panel.
- Typography: `.type-label` for counts, `.type-title` for active song title, `.type-body` for descriptions.

---

### Task 9: RenderOrder — Strip Panel, Inline Actions

**Files:**
- Modify: `frontend/src/components/RenderOrder.tsx`

Changes:
- Remove outer panel wrap.
- Header area: icon + title + description + sort button inline. No border.
- Sort by views notice strip: keep as floating callout if needed, but `bg-white/[0.03]` instead of panel.
- DnD list items: remove item-level panel wrap. Items use `bg-white/[0.03]` hover with `border-white/10`.
- **Mobile fix:** Remove `sticky bottom-24` action bar. Use inline action area at bottom of list.
- Typography: `.type-label` for views/sort, `.type-title` for header, `.type-body` for description.

---

### Task 10: ProgressPanel — Strip Panel, Lighter Surface

**Files:**
- Modify: `frontend/src/components/ProgressPanel.tsx`

Changes:
- Remove `rounded-2xl border border-white/10 bg-panel/70`. Use `bg-white/[0.03] border-white/[0.06]` for a very quiet tonal container, or no border at all.
- Keep progress bar, buttons, logs. The component is already well-structured.
- Typography: `.type-label` for stage text, `.type-body` for message.

---

### Task 11: CompletedOutput — Strip Panel

**Files:**
- Modify: `frontend/src/components/CompletedOutput.tsx`

Changes:
- Remove `rounded-2xl border border-white/10 bg-panel/70` from both loading and content states.
- Loading state: skeletons on `bg-studio`.
- Content state: icon + title + filename + actions + video directly on `bg-studio`.
- Error state: keep as floating alert (this is an intentional callout), but consider `bg-red-300/5 border-red-300/20` (softer).
- Typography: `.type-body` for descriptions.

---

### Task 12: ProjectSetup — Typography + Panel Stripping

**Files:**
- Modify: `frontend/src/pages/ProjectSetup.tsx`

Changes:
- Page heading: `.type-headline`.
- Description: `.type-body`.
- Form inputs: keep as-is but use consistent `rounded-xl` (not mixing `rounded-xl` with label headers).
- Song types / Songs / Clip length section: remove implicit panel feel. Use `space-y-6` but no border wrap.
- Anime search results: keep `rounded-2xl border` (this is a floating dropdown — legitimate).
- Selected anime chips: already good.
- "Export defaults" section: remove border wrapping from the section itself. Keep the collapse toggle.
- One-shot sidebar (right side): remove `rounded-2xl border bg-panel/70`. Use `bg-white/[0.03]` or just tonal separation. Or, keep it as a legitimate floating info card but make it much lighter.
- Submit button: move from sticky to inline. Remove `sticky` wrapper entirely — place as last element in the form.
- Typography throughout.
- Encoder select: add inline helper text explaining each option, or at least label "auto" as "Auto-detect (recommended)".

---

### Task 13: SettingsPage — Typography + Panel Stripping

**Files:**
- Modify: `frontend/src/pages/SettingsPage.tsx`

Changes:
- Page heading: `.type-headline`.
- Description: `.type-body`.
- Binary check cards: change from `rounded-xl border bg-panel/40` to `bg-white/[0.03]` with no border (or hairline `border-white/[0.06]`). Keep simple row-based layout.
- Install hints section: remove `rounded-2xl border bg-panel/70`. Use tonal separation or keep as a floating info card but much lighter. Prefer no border.
- Terminal section: `type-label` for section headings, `.type-body` for prose, `type-mono` (already in pre) for commands.
- Typography throughout.

---

### Task 14: Verification & Build

**Files:**
- Run: `cd frontend && npm run build`

Steps:
- [ ] Build succeeds with zero TypeScript errors
- [ ] No visual regressions in critical path (Dashboard → New Project → ProjectPage pipeline)

---

## Spec Coverage Check

| Requirement | Task |
|-----------|------|
| Remove blanket panel wrapping (P1) | Tasks 3–11, 12, 13 |
| ProjectPage hero layout (P1) | Task 4, 5 |
| Mobile fixed-position stacking (P1) | Tasks 2, 7, 9 |
| Typography hierarchy (P2) | Tasks 1, 3–13 |
| Status over-communication (P2) | Task 5 |
| DESIGN.md compliance | All tasks |
| PRODUCT.md tone | Tasks 12 (encoder labels), 5 (remove backend jargon) |

## Placeholder Scan

None. Each task contains specific code changes and expected outcomes.

## Type Consistency

- `.type-label` → `text-xs font-medium`
- `.type-body` → `text-[15px] leading-relaxed`
- `.type-title` → `text-lg font-medium`
- `.type-headline` → `text-2xl font-semibold tracking-tight`
- `.surface-float` → `rounded-2xl border border-white/10 bg-panel/70` (for true floating)
- `.surface-tonal` → no border, transparent or very low opacity background
