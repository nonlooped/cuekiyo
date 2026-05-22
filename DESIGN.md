---
name: Anime MV Pipeline
description: A calm local creative studio for one-shot anime MV compilation.
---

<!-- SEED: re-run /impeccable document once there's code to capture the actual tokens and components. -->

# Design System: Anime MV Pipeline

## 1. Overview

**Creative North Star: "The Floating Cut Room"**

Anime MV Pipeline should feel like a calm creative studio suspended above the machinery of video production. The user is not operating a server dashboard; they are guiding a local assistant that sources clips, makes sensible choices, and produces a polished compilation. The interface should be mostly monochrome, spacious, and cinematic, with lime used as a precise sign of selection, progress, and creative confidence.

The system should borrow from Apple Vision Pro and macOS: quiet surfaces, floating layers, generous spatial transitions, and material that feels physically responsive. Liquid glass is allowed as a signature material for navigation, command surfaces, overlays, and focused review moments. It must not become generic glassmorphism, and it must never reduce readability over thumbnails or video.

Motion is part of the product identity. Use motion.dev for choreographed transitions, scroll effects, step progression, and continuity between project setup, sourcing, review, rendering, and final output. Animation must explain movement through the workflow, not delay the user or decorate every component equally.

**Key Characteristics:**
- Minimal black-and-white foundation with one lime accent.
- Floating, spatial dashboard structure instead of dense website layout.
- Calm studio language, not backend pipeline language.
- Liquid glass used as a purposeful material, not as the default surface.
- Heavily choreographed state transitions that respect reduced motion.

## 2. Colors

The palette is simple black and white at first glance, but implemented as tinted near-black and off-white neutrals so the surface feels cinematic instead of harsh. Lime is the only accent and should feel sharp, alive, and rare.

### Primary
- **Signal Lime** ([to be resolved during implementation]): Use for primary actions, selected states, active workflow steps, progress highlights, focus accents, and high-confidence candidate signals. It should appear on no more than 10% of a typical screen.

### Neutral
- **Studio Black** ([to be resolved during implementation]): The main dark surface. Use a softened near-black, never pure `#000`.
- **Soft White** ([to be resolved during implementation]): The main light text and high-contrast surface. Use a warmed off-white, never pure `#fff`.
- **Glass Smoke** ([to be resolved during implementation]): Translucent floating material for nav, inspectors, review overlays, and command surfaces.
- **Quiet Line** ([to be resolved during implementation]): Subtle borders, separators, focus containers, and disabled outlines.

### Named Rules
**The Lime Signal Rule.** Lime is not decoration. It marks action, selection, progress, focus, confidence, or completion.

**The Not Pure Black Rule.** The interface may read as black and white, but implementation must tint the extremes so contrast stays elegant and less fatiguing.

**The Glass With Purpose Rule.** Liquid glass appears only where floating material clarifies hierarchy or creates a focused review moment. It is forbidden as a blanket card style.

## 3. Typography

**Display Font:** [font family to be chosen during implementation]
**Body Font:** [font family to be chosen during implementation]
**Label/Mono Font:** [font family to be chosen during implementation, if needed]

**Character:** Use a single modern sans family with Apple-ish restraint: clean, human, slightly geometric, and strong at small UI sizes. The safest direction is a variable sans that can carry headings, labels, controls, and dense metadata without changing personality.

### Hierarchy
- **Display** ([to be resolved during implementation]): Reserved for onboarding, empty states, and major project moments. Do not use display scale inside dense controls.
- **Headline** ([to be resolved during implementation]): Project names, workflow checkpoints, and final-output states.
- **Title** ([to be resolved during implementation]): Section headers, panel titles, and review groups.
- **Body** ([to be resolved during implementation]): Instructions, confirmation copy, errors, and status explanations. Cap prose at 65-75 characters per line.
- **Label** ([to be resolved during implementation]): Buttons, fields, metadata, candidate scores, and status chips. Labels should be plain and readable, not all-caps by default.

### Named Rules
**The Native Studio Type Rule.** Typography should feel native to a polished desktop creative tool. Avoid display fonts in labels, buttons, metadata, and job status.

## 4. Elevation

The system uses layered depth: floating panes, liquid material, soft tonal separation, and shadow only where spatial hierarchy needs it. Surfaces should feel like they occupy real depth, but the app must not become a stack of decorative cards.

### Named Rules
**The Floating Only When Useful Rule.** Floating surfaces are for navigation, active review, command panels, and transient inspectors. Ordinary content should not be wrapped in decorative floating containers.

**The Readability Beats Material Rule.** If blur, transparency, or refraction makes text or video harder to inspect, remove the effect.

## 5. Components

Seed mode does not define final component tokens yet. The following component direction should guide implementation until `/impeccable document` is re-run in scan mode.

### Buttons
- **Shape:** Quietly rounded, precise, and touchable. Avoid pill shapes unless the control is genuinely a chip or filter.
- **Primary:** Lime-backed or lime-accented depending on density. Primary actions should feel decisive but not loud.
- **Hover / Focus:** Use motion.dev for small lift, glow, or material response. Focus must be visible without relying on color alone.
- **Secondary / Ghost / Tertiary:** Use monochrome material and clear labels. Do not invent unfamiliar button shapes for flavor.

### Chips
- **Style:** Compact selection controls for song types, candidate status, render settings, and workflow filters.
- **State:** Selected chips may use lime sparingly. Unselected chips stay monochrome with a clear border or surface change.

### Cards / Containers
- **Corner Style:** Slightly rounded and restrained. Avoid big rounded SaaS cards.
- **Background:** Mostly tonal surfaces, with liquid glass reserved for floating or focused layers.
- **Shadow Strategy:** Ambient, soft, and stateful. No heavy admin-dashboard shadows.
- **Internal Padding:** Vary spacing by purpose. Dense metadata can be compact; review and final-output surfaces need more breathing room.

### Inputs / Fields
- **Style:** Native-feeling fields with quiet borders, clear labels, and enough size for minimally tech-literate users.
- **Focus:** Lime focus cue plus shape, glow, or outline change so the state is not color-only.
- **Error / Disabled:** Plain language, visible iconography or structure, and no raw backend terms unless logs are open.

### Navigation
- **Style:** Floating studio rail or top command surface inspired by macOS and Vision Pro, with spatial continuity between dashboard, project setup, review, rendering, and output.
- **Active State:** Use lime sparingly with position, weight, or material change.
- **Mobile Treatment:** Preserve workflow clarity first. Collapse navigation structurally rather than shrinking text fluidly.

### Pipeline Stage System
The pipeline is the signature component. It should show the project moving through setup, theme loading, song review, candidate review, rendering, and output as a spatial sequence. Use choreographed transitions and scroll effects to make progress understandable, with a reduced-motion path that swaps choreography for clear state changes.

## 6. Do's and Don'ts

### Do:
- **Do** build a mostly black-and-white interface with a single lime accent used for action, selection, progress, focus, and confidence.
- **Do** use motion.dev for workflow transitions, scroll effects, panel movement, and shared-element continuity.
- **Do** make the default path feel like one-shot reliable compilation, with advanced controls disclosed progressively.
- **Do** use liquid glass as a signature material for floating navigation, inspectors, overlays, and review moments.
- **Do** respect WCAG AA, keyboard navigation, visible focus states, reduced motion, and status indicators that do not rely on color alone.
- **Do** keep copy creator-facing: "Review candidates", "Rendering final video", "Open output".

### Don't:
- **Don't** use pure `#000` or pure `#fff`; tint both extremes.
- **Don't** make the app feel like a content-dense website.
- **Don't** make it feel like a generic Bootstrap/admin dashboard.
- **Don't** make it feel like a generic AI SaaS dashboard.
- **Don't** make it feel like a server-monitoring interface.
- **Don't** expose every video-editor control at once.
- **Don't** use anime fan-site aesthetics.
- **Don't** turn liquid glass into default glassmorphism across every card.
- **Don't** use decorative motion that does not communicate state, sequence, or spatial continuity.
- **Don't** use gradient text, colored side-stripe borders, or repeated identical card grids.
