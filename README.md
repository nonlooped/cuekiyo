# Cuekiyo

**Local studio for anime opening and ending compilations — from song cues to finished MV.**

Cuekiyo runs on your machine. Pick shows, choose songs, review sourced clips at each checkpoint, and export a titled compilation — no cloud, no subscription, no upload step.

> **Cue** — song cues, video checkpoints, timeline markers, and render gates.  
> **Kiyo** — clean, quiet clarity.

<!-- Replace with a screen recording before launch -->
<!-- ![Cuekiyo demo](docs/assets/demo.gif) -->

## Why Cuekiyo

- **Guided workflow** — automatic stages with pauses only where your taste matters (songs, clips, trim, render order)
- **Local-first** — SQLite + files on disk; your projects stay on your machine
- **Smart sourcing** — YouTube candidate search with scoring and heatmap-based clip starts
- **Polished output** — lower-third overlays, crossfades, per-clip export, re-render without re-downloading
- **Power when you need it** — manual YouTube links, bulk MAL import, templates, unlimited song counts

## Screenshots

Add before public launch (see [docs/assets/README.md](docs/assets/README.md)):

| Dashboard | Project gate | Finished output |
|-----------|--------------|-----------------|
| `docs/assets/dashboard.png` | `docs/assets/project-gate.png` | `docs/assets/completed.png` |

## Requirements

- **Python** 3.11–3.14
- **Node.js** 24 LTS (`>=24.16.0`)
- **System tools:** `yt-dlp`, `ffmpeg`, `ffprobe`
- **Font** for overlays (e.g. DejaVu on Linux, Arial on Windows)

### Install system tools

**Linux (Arch/CachyOS)**

```bash
sudo pacman -S yt-dlp ffmpeg ttf-dejavu
```

**macOS (Homebrew)**

```bash
brew install yt-dlp ffmpeg
```

**Windows (winget)**

```powershell
winget install yt-dlp.yt-dlp
winget install Gyan.FFmpeg
```

## Quick start

### Backend

```bash
cd backend
python -m venv .venv

# Linux/macOS
source .venv/bin/activate

# Windows
.\.venv\Scripts\Activate.ps1

pip install -r requirements-dev.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Or from the repo root: `npm run dev:backend` (requires an activated venv on your `PATH`).

### Frontend

```bash
cd frontend
npm ci
npm run dev
```

Overlay rendering uses Satori (`satori`, `@resvg/resvg-js`) installed by `npm ci`.

Or from the repo root: `npm run dev:frontend`.

Open http://localhost:5173

- API docs: http://127.0.0.1:8000/docs  
- Health check: http://127.0.0.1:8000/api/system/binaries — all four entries should be available.

## How it works

1. **Create a project** — pick anime, song types, overlay style, and sourcing mode
2. **Select songs** — review theme list, then the pipeline sources YouTube candidates (or you paste links)
3. **Review clips** — pick one candidate per song; trim start and duration if needed
4. **Render** — confirm order, composite overlays, export the final MP4

User-gated checkpoints: song selection, candidate review, clip trim (when enabled), and render order. Everything else runs automatically.

## Settings

**New compilation defaults** (song count, clip length, encoder, and similar) are saved in your browser on the **Settings** page.

**Pipeline tuning** (data directory, worker counts, ffmpeg quality, anime metadata provider, Jikan/AniList rate limits, stale lock timeout) is configured via environment variables. Copy `.env.example` to `.env` in the repo root and restart the backend after changes.

**Anime metadata** (primary API and automatic fallback) can also be changed on the **Settings** page. Search and artwork use the selected provider first, then fall back to the other. Opening and ending theme lists still come from Jikan because AniList does not expose them.

Legacy values in `data/settings.json` are still read if present, but env vars take precedence and the Settings UI no longer edits them.

## Development

Root-level tooling:

```bash
npm install          # eslint + prettier dev deps
npm run lint
npm run format
npm test             # backend pytest + frontend build/tests
```

Frontend lint/format from `frontend/` also use the root configs.

See [CONTRIBUTING.md](CONTRIBUTING.md) for issue and PR guidelines.

## Tests

```bash
cd backend
source .venv/bin/activate   # or .\.venv\Scripts\Activate.ps1
pytest -q
```

```bash
cd frontend
npm ci
npm test
npm run build
```

CI runs both on push (see [`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

## Manual verification

### Manual source mode

1. Create project with "I'll paste YouTube links"
2. Complete song selection
3. Confirm pipeline skips "Sourcing" and lands on "Review clips"
4. Paste a valid YouTube URL per song; confirm thumbnail/title appear
5. After last song, confirm download stage starts automatically

### Overlay customization

1. Create project with overlay disabled → confirm final clips have no lower-third
2. Create project with minimal + top position → confirm overlay appears at top with reduced chrome
3. Use Preview on setup page → PNG renders without running full pipeline

### Clip trim

1. After selecting sources, confirm **Trim clips** gate appears
2. Set custom start/duration on one song; leave another on heatmap
3. Confirm final clip lengths match settings

### Reprocess

1. Complete a project → **Re-apply overlay** with different style → no yt-dlp download logs
2. **Render again** → new concat only

### Duplicate & export

1. Duplicate completed project → new draft with same anime/settings
2. Download single overlay clip and ZIP of all clips

### Project templates

1. On project setup, save current settings as a named template
2. Start a new project from that template → fields match saved values
3. On Settings, delete a template → it no longer appears in the setup dropdown

### Bulk import & unlimited songs

1. Paste 10 MAL URLs into bulk import → create unlimited project → select all filtered themes
2. Confirm pipeline continues with all selected songs (no hard cap)

### Crossfade

1. Create project with crossfade **0 s** → cuts are hard between clips
2. Create project with crossfade **1 s** → audible blend between clips in final MP4

## Data layout

| Path | Purpose |
|------|---------|
| `data/pipeline.db` | SQLite database |
| `data/settings.json` | Legacy pipeline settings (optional; prefer `.env`) |
| `data/projects/{id}/` | Downloads, clips, output |

These paths are gitignored. Delete `data/pipeline.db` for a clean slate.

## Cross-platform notes

- SQLite paths use forward slashes internally (Windows-safe).
- Output folder opens via `xdg-open` (Linux), `open` (macOS), or `explorer` (Windows).
- Overlay fonts: Linux uses DejaVu/Liberation; Windows falls back via `fc-match` or bundled paths.

## Known limitations (V1)

- Single global job lock — one pipeline job at a time
- Concat xfade chain is simplified for 2+ clips
- Retry infers failed stage from the last failed job

## Legal notice

This project is **local personal software** only. It runs on your machine and does not host, distribute, or publish your videos.

**You are solely responsible** for how you use it. You must have the rights or permission to use any anime footage, music, and third-party video (including YouTube content) that you source, download, edit, or export. You must comply with applicable copyright law and the terms of any platforms or services you use (including YouTube's Terms of Service).

The authors and contributors provide this tool **as-is** and are **not affiliated with your output**. They do not endorse, review, or take responsibility for compilations you create.

See [LICENSE](LICENSE) for software warranty terms.

## License

MIT — see [LICENSE](LICENSE).
