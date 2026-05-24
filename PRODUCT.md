# Product

## Register

product

## Users

Minimally tech-literate anime and video creators running the app locally on their own machine. They want to go from an idea to a finished AMV compilation with as little manual work as possible, stepping in only when their taste matters: which songs, which candidate clips, what render order. They are not editors, not developers, and they do not want to read logs unless something broke.

## Product Purpose

Cuekiyo turns a small set of creative inputs (anime picks, song selections, clip choices) into a finished anime compilation. The default experience pushes from project creation to output automatically, pausing only at user-gated checkpoints where taste is required. Power-user controls exist behind progressive disclosure, never as the primary path.

## Brand Personality

Calm creative studio. Polished, cinematic, quietly confident. Never loud, never technical-first. The interface speaks in creator language ("Review candidates", "Rendering final video", "Open output") rather than pipeline jargon. When work runs or fails, the app stays composed. Technical detail lives in collapsible logs, never in the main view.

## Anti-references

Avoid content-dense marketing sites, Bootstrap-era admin dashboards, generic SaaS dashboards with hero metrics, server-monitoring consoles, full video editors that expose every control at once, and anime fan-site aesthetics (bright gradients, decorative kanji, excessive illustration). The app uses dashboard structure for clarity but with spatial choreography, progressive disclosure, and restraint closer to editorial tools than ops consoles.

## Design Principles

1. One-shot by default. The fastest path is project creation to finished video. Sensible defaults and automatic continuation carry the user forward; manual intervention is opt-in.
2. Judgment at checkpoints. Ask for attention only where taste matters: song picks, candidate review, render order, final approval. Every other stage runs on its own.
3. Progressive power. Advanced settings and raw log output exist but stay behind disclosure until needed. The default view shows outcome, not mechanism.
4. Calm motion, clear state. Animations explain pipeline movement and reduce waiting anxiety. They never decorate. Entrance choreography, view transitions, and status pulses serve comprehension.
5. Local confidence. Make dependencies, failures, retries, and outputs understandable without surfacing backend machinery. Binary availability alerts, per-song progress, and collapsible logs replace unstructured error dumps.

## Architecture Notes

- Local-only. No cloud services, Redis, Celery, or Docker requirement. SQLite + file-based project storage under `data/projects/{id}/`.
- Background jobs run in threads with a global lock. Polling and WebSocket update the frontend in real time.
- The state machine (`backend/app/state_machine.py`) enforces transitions. User-gated statuses: `SONG_SELECTION`, `AWAITING_CANDIDATES`, `AWAITING_RENDER_ORDER`.
- The frontend is a React 19 SPA (Vite, shadcn/ui, Tailwind v4, HugeIcons, React Router v7) with no global state store. State lives per-page with API calls and polling. View transitions animate between pages.

## Accessibility & Inclusion

WCAG AA baseline. Workflow gates are keyboard-accessible with visible focus rings. Status is never conveyed by color alone (icons, labels, and position carry meaning alongside tone). Reduced-motion preferences disable all animations and view transitions. Maintained readable contrast across dark and light themes, video thumbnails, progress states, and overlay previews.