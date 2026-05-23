---
name: mv pipeline
description: A calm local creative studio for one-shot anime MV compilation.
---

# mv pipeline Design System

## Vision

A creative studio interface where lime-green light traces active work, glass surfaces give depth without weight, and every transition is choreographed to explain state changes. The design borrows editorial restraint from production tools rather than operational dashboards. Dark theme is default because creators work at night; light theme holds the same spatial quality through tinted neutrals.

## Color Strategy

**Committed.** One saturated hue (lime, hue 128-131) carries 30-60% of the surface energy. It is never used as a dominant fill, only as an accent for active states, progress, and compositional emphasis. Neutrals are cool-violet tinted (hue ~286) to avoid both blue-gray sterility and warm-gray familiarity. The destructive palette uses red-orange (hue ~22-27).

## Color Tokens

All colors are OKLCH. Light-theme values first, dark-theme adjusted.

### Semantic tokens

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--background` | `oklch(1 0 0)` | `oklch(0.141 0.005 285.823)` | Page background |
| `--foreground` | `oklch(0.141 0.005 285.823)` | `oklch(0.985 0 0)` | Primary text |
| `--primary` | `oklch(0.841 0.238 128.85)` | `oklch(0.768 0.233 130.85)` | Lime accent, active states |
| `--primary-foreground` | `oklch(0.405 0.101 131.063)` | `oklch(0.405 0.101 131.063)` | Text on primary |
| `--secondary` | `oklch(0.967 0.001 286.375)` | `oklch(0.274 0.006 286.033)` | Muted surfaces |
| `--muted` | `oklch(0.967 0.001 286.375)` | `oklch(0.274 0.006 286.033)` | Backgrounds, disabled |
| `--muted-foreground` | `oklch(0.45 0.016 285.938)` | `oklch(0.72 0.015 286.067)` | Secondary text |
| `--accent` | `oklch(0.967 0.001 286.375)` | `oklch(0.274 0.006 286.033)` | Hover backgrounds |
| `--destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` | Error, danger |
| `--border` | `oklch(0.92 0.004 286.32)` | `oklch(1 0 0 / 10%)` | Borders |
| `--input` | `oklch(0.92 0.004 286.32)` | `oklch(1 0 0 / 15%)` | Input borders |
| `--ring` | `oklch(0.705 0.015 286.067)` | `oklch(0.552 0.016 285.938)` | Focus rings |
| `--card` | `oklch(1 0 0)` | `oklch(0.21 0.006 285.885)` | Card surfaces |
| `--popover` | `oklch(1 0 0)` | `oklch(0.21 0.006 285.885)` | Popover surfaces |

### Chart palette

Five-step green progression (constant hue ~130, descending lightness, ascending chroma in mid-range):

| Token | Value |
|---|---|
| `--chart-1` | `oklch(0.897 0.196 126.665)` |
| `--chart-2` | `oklch(0.768 0.233 130.85)` |
| `--chart-3` | `oklch(0.648 0.2 131.684)` |
| `--chart-4` | `oklch(0.532 0.157 131.589)` |
| `--chart-5` | `oklch(0.453 0.124 130.933)` |

### Accent derivation pattern

Most accent and glow values are derived from `--primary` and `--foreground` at runtime using `oklch(from var(--primary) l c h / opacity)` and `oklch(from var(--foreground) l c h / opacity)`. This ensures accent intensity adjusts automatically across light and dark themes. Opacity tiers: 5%, 6%, 8%, 10%, 15%, 20%, 25%, 30%, 35%, 40%, 45%.

### Background treatment

`body` has two radial gradients using `oklch(from var(--primary) l c h / opacity)` that cast soft lime light from the top-right (7% opacity, 1200px) and bottom-left (4% opacity, 900px). This gives the page a subtle directional warmth without flat solidity.

## Typography

| Role | Family | Weight | Tracking |
|---|---|---|---|
| Body | Outfit Variable | 400 | Normal |
| Headings (h1-h4) | Manrope Variable | 600+ | Tight |

Body text capped at ~75ch by the `max-w-6xl` centered content container. Heading hierarchy uses scale and weight contrast (Manrope 600+ semibold at larger sizes vs Outfit 400 at body). No decorative font variants.

## Radii

Base radius `0.625rem` (10px). Derived scale:

| Token | Value |
|---|---|
| `--radius-sm` | `calc(var(--radius) * 0.6)` = 6px |
| `--radius-md` | `calc(var(--radius) * 0.8)` = 8px |
| `--radius-lg` | `var(--radius)` = 10px |
| `--radius-xl` | `calc(var(--radius) * 1.4)` = 14px |
| `--radius-2xl` | `calc(var(--radius) * 1.8)` = 18px |
| `--radius-3xl` | `calc(var(--radius) * 2.2)` = 22px |
| `--radius-4xl` | `calc(var(--radius) * 2.6)` = 26px |

## Elevation

Four levels using layered `oklch(0 0 0 / opacity)` shadows. All transitions use `cubic-bezier(0.16, 1, 0.3, 1)` (an ease-out-quint variant).

| Class | Shadow layers | Hover lift |
|---|---|---|
| `fcr-float-1` | 2px + 8px + 1px highlight | `translateY(-2px)` |
| `fcr-float-2` | 4px + 24px + 1px highlight | `translateY(-2px)` |
| `fcr-float-3` | 8px + 48px + 1px highlight | `translateY(-4px)` |
| `fcr-float-4` | 16px + 64px + 1px highlight | `translateY(-4px)` |

Hover lifts escalate to the shadow of the next level. Transition durations scale with level: 200ms (float-1/2), 350ms (float-3), 500ms (float-4).

## Glass Surfaces

Two glass surface variants, both using `backdrop-filter: blur(24px) saturate(1.4)`:

| Class | Fill | Border | Gradient overlay |
|---|---|---|---|
| `fcr-glass` | Background at 55% opacity | Foreground at 8% | Foreground 5% to 2% to transparent (135deg) |
| `fcr-glass-lime` | Primary at 6% opacity | Primary at 15% | Primary 8% to transparent (135deg) |

Used for cards that need depth differentiation without hard contrast. Combined with float elevations for the "floating panel" effect.

## Animation

### Entrance choreography

| Class | Keyframe | Duration | Curve |
|---|---|---|---|
| `fcr-animate-up` | `fcr-entrance-up` (opacity 0->1, Y +12->0) | 350ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `fcr-animate-scale` | `fcr-entrance-scale` (opacity 0->1, scale 0.97->1) | 500ms | `cubic-bezier(0.16, 1, 0.3, 1)` |

Stagger delays: `fcr-delay-1` through `fcr-delay-6` (50ms to 300ms in 50ms steps).

### Lime pulse

`fcr-lime-pulse`: 3s `ease-in-out` infinite cycle on box-shadow, oscillating between `0 0 0` and `0 0 12px 3px` of primary at 25% opacity. Used for status dots and active indicators.

### Glow scale

| Class | Effect |
|---|---|
| `fcr-glow-primary-xs` | 8px primary at 10% |
| `fcr-glow-primary-sm` | 12px primary at 15% |
| `fcr-glow-primary-md` | 20px primary at 20% |
| `fcr-glow-primary-lg` | 24px primary at 25% |
| `fcr-glow-primary-md-to-lg` | 20px at 20%, hover to 30px at 35% |
| `fcr-glow-primary-lg-on-group-hover` | 16px at 25%, parent hover to 24px at 35% |
| `fcr-glow-primary-md-on-hover` | Hover to 24px at 20% |
| `fcr-glow-primary-xs-on-hover` | Hover to 8px at 10% |
| `fcr-glow-destructive-xs` | 8px destructive at 15% |

### View Transitions

Direction-aware page transitions using the View Transition API:
- **Forward**: old exits left + blur-fade, new enters from right + blur-fade (48px)
- **Back**: reversed direction
- **Morphing elements**: project thumbnail and title carry `view-transition-name` for animated cross-page continuity
- **Persistent elements**: app header and sidebar are excluded from exit/enter animations
- **Via-blur**: all transitions pass through a brief 30% blur at peak (keyframe `vt-via-blur`)
- **Durations**: exit 150ms, enter 210ms, move 420ms

### Reduced motion

All animations and transitions are killed at `prefers-reduced-motion: reduce`. View transition group durations are zeroed. Status pulse stops.

## Layout

- **Shell**: `SidebarProvider` (16rem width, collapsible to 3rem icon mode) + sticky header (h-14, backdrop-blur, bottom border) + `<main>` content area (`max-w-6xl` centered, responsive padding)
- **Sidebar**: Glass surface with edge-line separators, recent projects with status dots, command palette trigger in footer
- **Dashboard**: Vertical list of project cards. Each card uses `fcr-glass-lime` for needs-attention state, `fcr-glass` for completed, solid `bg-card` for neutral. Priority-sorted by status.
- **Project detail**: Two-column layout (sidebar stepper + main content area). Stage-appropriate components render conditionally based on pipeline status.
- **Setup wizard**: Multi-step form with card-style toggle selectors for song types and encoder options.

## Component Architecture

### Shadcn/ui primitives (radix-mira style, HugeIcons)

35+ components in `components/ui/` including: `AlertDialog`, `Badge`, `Button`, `Card`, `Checkbox`, `Collapsible`, `Command`, `Dialog`, `DropdownMenu`, `Empty`, `HoverCard`, `InputGroup`, `Progress`, `ScrollArea`, `Select`, `Sheet`, `Sidebar`, `Skeleton`, `Switch`, `Table`, `Tabs`, `Textarea`, `Toggle`, `Tooltip`.

### Application components

| Component | Purpose |
|---|---|
| `AppLayout` | Root shell: sidebar + header + outlet with view transition names |
| `AppSidebar` | Navigation, recent projects, command palette trigger |
| `Dashboard` | Project list with filter, search, priorities |
| `ProjectPage` | Project detail with conditional stage rendering |
| `ProjectSetup` | Multi-step wizard for new compilations |
| `SettingsPage` | Metadata provider + compilation defaults |
| `PipelineStepper` | Vertical timeline showing current/complete/failed stage |
| `ProgressPanel` | Live progress with per-song status, collapsible logs |
| `SongSelection` | Song type toggle and selection checkboxes |
| `CandidateSelection` | Tabbed candidate review with thumbnails |
| `RenderOrder` | Drag-and-drop song ordering with auto-sort |
| `CompletedOutput` | Video player, metadata, download/reveal actions |
| `StatusBadge` | Maps pipeline status to Badge variant + glow class |
| `PageHeader` | Reusable title/description/actions/leading slot |
| `ProjectMorphHeader` | Cross-page animated header with view transition |
| `CommandPalette` | cmdk-based command palette |
| `BrandWordmark` | "mv pipeline" / "mv" logo link |
| `LoadingSpinner` | Animated spinner (HugeIcons `Loading03Icon`) |

### Sidebar utilities

| Class | Usage |
|---|---|
| `.sidebar-surface` | Transparent outer container; inner surface gets `var(--sidebar)` bg |
| `.sidebar-edge-line` | 1px horizontal gradient separator (foreground at 3%) |
| `.sidebar-section-sep` | 1px full-width separator (foreground at 3%) |
| `.sidebar-nav-item` | Rounded nav item with `data-active` state (primary at 6% bg, primary text, font-weight 500) |
| `.sidebar-recent-item` | Flex row link with hover bg (sidebar-accent at 25%) |
| `.sidebar-status-dot` | 6px status indicator; `data-status` attributes: `active` (primary, pulse), `idle` (muted at 35%), `done` (muted at 20%), `error` (destructive) |
| `.sidebar-cmd` | Command palette trigger button (border, rounded, hover bg) |
| `.sidebar-cmd-icon` | Icon-only collapsed variant |

### Timeline (reserved)

| Class | Usage |
|---|---|
| `.fcr-timeline-track` | Background track with 60px grid lines (foreground at 2%) |
| `.fcr-timeline-clip` | Draggable clip (glass bg, 8px blur, hover border + glow) |
| `.fcr-timeline-clip-active` | Active clip (primary border, 24px primary glow at 45%) |
| `.fcr-timeline-playhead` | 2px primary line with 10px dot, 12px glow, smooth position transition |

## Icon System

HugeIcons (`@hugeicons/react` + `@hugeicons/core-free-icons`). Icon stroke width is always `2`. Inline-start icons use `data-icon="inline-start"`. No custom SVG icons.

## Interaction Patterns

- **Status indication** uses tone + icon + label. Never color alone. The `StatusTone` type maps to Badge variants (`default` for running/success, `outline` for attention, `destructive` for danger, `secondary` for idle/muted) plus glow utilities.
- **Progressive disclosure** for logs: hidden by default behind a collapsible trigger. Log panels use monospace `text-[11px]` with level-based coloring (destructive for errors, primary at 80% for warnings, muted for info).
- **Confirmation dialogs** use `AlertDialog` for destructive or significant actions (delete, render-again, starting render).
- **View transitions** are directional. Navigating forward slides content from right; back slides from left. Elements with `viewTransitionName` morph across pages.
- **Keyboard shortcuts** are registered globally. `Cmd+K` opens command palette. `Cmd+Shift+D/N/S/P` navigate. `?` opens shortcut help. `D` toggles dark/light.
- **Binary availability** warnings appear as top-level Alerts with `fcr-glass` styling and install-hint links.
- **Empty states** use the `Empty` component with icon, title, description, and CTA.

## Typography Scale

No explicit type scale tokens. Sizes are composed per-component:

| Context | Size |
|---|---|
| Status labels | `text-[11px]` (tabular-nums for counters) |
| Song status labels | `text-[11px]` |
| Sidebar metadata | `10px` line-height 1.3 |
| Small labels | `text-xs` (12px) |
| Body text | `text-sm` (14px) |
| Card titles | `text-base` to `text-lg` |
| Page titles | `font-heading text-lg font-semibold` |
| Large metrics | `font-heading text-2xl font-semibold tabular-nums` |
| Headings (h1-h4) | Manrope, semibold+, tracking-tight |