# Agent instructions

## Project

Local anime MV pipeline. One-shot compilation from anime picks to finished video, pausing only at user-gated checkpoints. See `README.md` for setup and manual verification.

## Architecture

Single-process FastAPI app with SQLAlchemy/SQLite persistence, thread-based background jobs with a global pipeline lock, WebSocket progress events, and a React 19 SPA frontend.

### Backend (`backend/app/`)

- **Entry**: `main.py` — FastAPI app, startup: `init_db()`, stale lock recovery, event loop on `job_runner`
- **Routes**: `api/routes.py` — all endpoints under `/api` prefix, WebSocket at `/ws`
- **Models**: `models.py` — Project, ProjectAnime, AnimeCache, ThemeSong, Song, SongCandidate, Job, JobLog, AppLock
- **Schemas**: `schemas/` — Pydantic models for request/response (`anime.py`, `song.py`, `project.py`, `settings.py`, `job.py`)
- **State machine**: `state_machine.py` — strict transition validation, user-gated checks, retry logic
- **Enums**: `enums.py` — ProjectStatus, SongStatus, JobType, JobStatus, Encoder, SongType, LogLevel, transition maps
- **Config**: `config.py` — Pydantic Settings, loads from `.env` then `data/settings.json`, env vars with `PIPELINE_` prefix
- **Database**: `database.py` — SQLite + foreign keys pragma, `get_db` dependency, `init_db`

### Pipeline services (`backend/app/services/`)

- `anilist_client.py` — AniList GraphQL client with rate limiting
- `anime_metadata.py` — Unified interface, delegates to Jikan or AniList with fallback
- `ffmpeg_engine.py` — FFmpeg command construction and execution with NVENC auto-detect and CPU fallback
- `heatmap.py` — YouTube heatmap analysis, finds optimal clip start time
- `jikan_client.py` — Jikan (MyAnimeList) REST client with rate limiting
- `overlay_renderer.py` — Lower-third overlay via Satori (Node.js HTML-to-PNG) + ffmpeg compositing
- `paths.py` — All filesystem paths via `data/projects/{project_id}/`, path traversal protection
- `theme_parser.py` — Parses anime theme song text from Jikan data
- `youtube_sourcer.py` — YouTube candidate search, scoring, download via yt-dlp

### Jobs (`backend/app/jobs/`)

- `runner.py` — `JobRunner` singleton, `AppLock` table for serialization, heartbeat-based stale lock recovery, auto-continue after each stage, `_cancel_flags` dict for cancel mechanism
- `parallel.py` — `ThreadPoolExecutor` wrapper with `ParallelProgress` counter, worker count resolution
- `websocket_manager.py` — WebSocket broadcast to connected clients

### Pipeline stages (auto-advance unless user-gated)

1. DRAFT → LOAD_THEMES (auto) → SONG_SELECTION **(user gate)**
2. SONG_SELECTION → SOURCING (auto) → AWAITING_CANDIDATES **(user gate)**
3. AWAITING_CANDIDATES → DOWNLOADING (auto) → PROBING_NORMALIZING → CUTTING → OVERLAYING → AWAITING_RENDER_ORDER **(user gate)**
4. AWAITING_RENDER_ORDER → RENDERING (auto) → COMPLETED

### Frontend (`frontend/src/`)

- **Stack**: React 19, Vite 8, Tailwind v4 (CSS-first config), shadcn/ui (radix-mira style), HugeIcons, React Router v7, @dnd-kit
- **Theme**: Dark/light/system via custom `ThemeProvider`, OKLCH colors, lime-green primary
- **State**: No global store. Per-page state with `api.*` calls + polling + WebSocket. `usePolling` hook for visibility-aware polling.
- **Pages**: Dashboard (`/`), ProjectSetup (`/projects/new`), ProjectDetail (`/projects/:id`), Settings (`/settings`)
- **Layout**: `AppLayout` with collapsible sidebar (16rem), sticky header, max-w-6xl content area, view transitions between pages
- **Components**: `components/ui/` (shadcn, do not hand-edit; use `npx shadcn@latest add`), `components/` (application components)
- **CSS**: Single `index.css` with Tailwind v4 imports, FCR utility classes, glass surfaces, view transitions
- **View transitions**: Direction-aware (forward/back) slide + blur + morphing for project thumbnails/titles

### Conventions

- Subprocess **argument lists**, never shell string concatenation for yt-dlp/ffmpeg
- Project files only under `data/projects/{project_id}/` via `services/paths.py`
- Frontend shadcn/ui primitives: add via `npx shadcn@latest add`, never hand-edit `components/ui/*`
- Icons: HugeIcons only, stroke width 2, inline-start via `data-icon="inline-start"`
- Colors: OKLCH only, derived from `--primary` and `--foreground` with opacity tiers; no hardcoded hex or rgb
- Animations: use FCR utility classes (`fcr-animate-up`, `fcr-animate-scale`, `fcr-delay-*`, `fcr-float-*`, `fcr-glass`, `fcr-glow-*`); all respect `prefers-reduced-motion`
- Status indication: tone + icon + label, never color alone
- Pipeline copy: use `getStatusCopy()` from `pipeline.ts` for all status labels/descriptions

## State machine

Enforce transitions in `state_machine.py`. 
- User-gated statuses: `SONG_SELECTION`, `AWAITING_CANDIDATES`, `AWAITING_RENDER_ORDER`
- `FAILED` and `CANCELLED` reachable from any running or user-gated status; they have no outgoing transitions
- `is_editable()`: DRAFT, SONG_SELECTION
- `is_deletable()`: DRAFT, SONG_SELECTION, COMPLETED, FAILED, CANCELLED
- After user gate resolution, auto-continue starts the next stage job

## Do not add

Redis, Celery, Docker requirement, Postgres, paid APIs, or cloud dependencies.