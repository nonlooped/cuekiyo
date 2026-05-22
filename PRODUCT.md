# Product

## Register

product

## Users

Minimally tech-literate anime and video creators running the app locally. They want the app to handle searching, sourcing, trimming, overlays, and rendering with as little manual work as possible, while still preserving room to intervene when they care about a specific song, candidate clip, render order, or export setting.

## Product Purpose

This product creates reliable one-shot anime MV compilations from a small set of creative inputs. The default experience should move from project setup to finished video with strong defaults and automatic continuation. Deeper editing should exist for power users through progressive controls, not as the main path.

## Brand Personality

Calm creative studio. The app should feel polished, cinematic, and future-facing, while staying composed during long-running work or failures. Copy should be confident and plain: use creator-facing language such as "Review candidates", "Rendering final video", and "Open output" before developer-facing pipeline terms. Technical detail belongs behind logs, diagnostics, and advanced controls.

## Anti-references

Avoid content-dense websites, generic Bootstrap/admin dashboards, generic AI SaaS dashboards, server-monitoring interfaces, full video editors with every control exposed at once, and anime fan-site aesthetics. The UI should use dashboard structure for clarity, but with more choreography, thoughtful transitions, spatial continuity, and Apple-ish restraint.

## Design Principles

1. One-shot by default: the fastest path is project setup to finished video, with sensible defaults and automatic continuation.
2. Judgment at checkpoints: ask for user attention only where taste matters, such as song picks, candidate confidence, render order, and final review.
3. Progressive power: advanced settings and logs exist, but stay behind clear disclosure until needed.
4. Calm motion, clear state: transitions should explain pipeline movement and reduce waiting anxiety, not decorate the interface.
5. Local confidence: make dependencies, failures, retries, and outputs understandable without exposing backend machinery first.

## Accessibility & Inclusion

Use WCAG AA as the baseline. The workflow gates must be keyboard-accessible, focus states must be visible, reduced-motion preferences must be respected, and job status or candidate confidence must never rely on color alone. Maintain readable contrast across video thumbnails, progress states, controls, and overlay previews.
