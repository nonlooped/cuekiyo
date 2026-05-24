<p align="center">
  <img src="docs/assets/cover.png" alt="Cuekiyo — local anime compilation studio" width="100%" />
</p>

<p align="center">
  <a href="https://github.com/unloopedmido/cuekiyo/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/unloopedmido/cuekiyo/actions/workflows/ci.yml/badge.svg"></a>
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/github/license/unloopedmido/cuekiyo?style=flat-square"></a>
  <a href="https://github.com/unloopedmido/cuekiyo/releases"><img alt="Release" src="https://img.shields.io/github/v/release/unloopedmido/cuekiyo?style=flat-square&display_name=tag&sort=semver"></a>
  <img alt="Local-first" src="https://img.shields.io/badge/local--first-yes-8BC34A?style=flat-square">
  <img alt="Python" src="https://img.shields.io/badge/python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white">
  <img alt="Node.js" src="https://img.shields.io/badge/node-24_LTS-339933?style=flat-square&logo=nodedotjs&logoColor=white">
  <img alt="Stack" src="https://img.shields.io/badge/stack-FastAPI%20%2B%20React-61DAFB?style=flat-square">
</p>

## Build anime opening/ending compilations without leaving your machine

**Cuekiyo is a local studio for building anime opening and ending compilations.**

Pick the shows, approve the songs, choose the clips, and export a titled compilation without uploading footage, paying for a cloud editor, or stitching everything together by hand.

No cloud. No subscription. No upload step. Just your machine, your files, and a guided workflow that pauses only when you need to make a choice.

### Contents

- [Why Cuekiyo exists](#why-cuekiyo-exists)
- [What it does](#what-it-does)
- [See it in action](#see-it-in-action)
- [Quick start](#quick-start)
- [How the flow works](#how-the-flow-works)
- [Built with](#built-with)
- [Local-first by design](#local-first-by-design)
- [Requirements](#requirements)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Legal notice](#legal-notice)
- [License](#license)

## Why Cuekiyo exists

Making anime compilation edits is fun until the workflow turns into a mess:

- hunting openings across YouTube
- checking timestamps manually
- downloading sources one by one
- trimming clips in separate tools
- adding lower-thirds
- normalizing audio
- re-rendering everything when one clip changes

Cuekiyo turns that into a guided local pipeline. You still make the taste decisions (which songs, which clips, what order) while the app handles the repetitive sourcing, cutting, overlay, and render work.

## What it does

| Instead of... | Cuekiyo gives you... |
| --- | --- |
| 12 browser tabs and copied timestamps | One guided flow from show picks to final render |
| Uploading media to random cloud tools | Local files, local database, local exports |
| Manually hunting every opening | Ranked YouTube candidates you can approve or replace |
| Rebuilding the same edit repeatedly | Re-render clips without downloading everything again |
| Losing track of project files | Each project stored under `data/projects/{id}/` |
| Needing one fixed workflow | Paste your own links, import from MyAnimeList, or save project templates |
| Automation guessing wrong on a source | Override any auto-pick with your own YouTube URL, per song |
| CPU-bound encoding | NVIDIA NVENC auto-detected with a transparent CPU fallback |

## See it in action

| Dashboard | Review clips | Finished output |
| --- | --- | --- |
| ![Dashboard view showing project cards and status](docs/assets/dashboard.png) | ![Review-clips user gate with candidate thumbnails](docs/assets/project-gate.png) | ![Completed project page with final MP4](docs/assets/completed.png) |

## Quick start

Requires **Python 3.11+**, **Node.js 24 LTS**, `ffmpeg`, `ffprobe`, and `yt-dlp` on your `PATH`. See [Requirements](#requirements) for per-OS install commands.

```bash
git clone https://github.com/unloopedmido/cuekiyo.git
cd cuekiyo
npm run setup   # first run can take a few minutes (Python venv + npm install)
npm run dev
```

Open **<http://localhost:5173>** and create your first compilation.

### `npm run dev` vs `npm start`

| Command | When to use | URL |
| --- | --- | --- |
| `npm run dev` | Day-to-day development. Vite HMR for the frontend, auto-reload for the backend, two ports. | <http://localhost:5173> (UI), <http://127.0.0.1:8000> (API) |
| `npm start` | Production-like single-port preview. Builds the frontend once and lets FastAPI serve it. | <http://127.0.0.1:8000> (UI + API) |

After either command starts, you can confirm your toolchain is healthy at <http://127.0.0.1:8000/api/system/binaries> — `yt-dlp`, `ffmpeg`, `ffprobe`, and overlay rendering should all report available.

## How the flow works

1. **Create a project** — name it, pick anime, choose song types and overlay style.
2. **Select songs** — review the theme list; Cuekiyo sources YouTube candidates (or you paste links).
3. **Review clips** — pick one source per song; trim start and duration if needed.
4. **Render** — confirm order, composite overlays, download the final MP4.

Everything between those steps runs automatically. The app pauses only at song selection, candidate review, optional trim, and render order.

## Built with

- **Backend** — FastAPI, SQLAlchemy, SQLite, thread-based job runner with a global pipeline lock and WebSocket progress events
- **Frontend** — React 19, Vite, Tailwind v4, shadcn/ui, React Router v7, `@dnd-kit`
- **Media** — FFmpeg / FFprobe (NVENC auto-detected, CPU fallback), `yt-dlp`, YouTube heatmap analysis, Satori for HTML-to-PNG overlay rendering
- **Metadata** — Jikan (MyAnimeList) and AniList GraphQL, with rate limiting and provider fallback

Architectural details live in [`AGENTS.md`](AGENTS.md).

## Local-first by design

Cuekiyo runs on your machine. Projects live in SQLite and on disk under `data/`. Nothing is uploaded to a service you do not control. Your compilations stay yours unless you export them.

That also means you bring the tools: Python, Node, `ffmpeg`, and `yt-dlp`. See [Requirements](#requirements) below.

## Requirements

- **Python** 3.11+
- **Node.js** 24 LTS (`>=24.16.0 <25`)
- **System tools** — `yt-dlp`, `ffmpeg`, `ffprobe`
- **Font for overlays** — DejaVu on Linux, the system Arial/Helvetica on Windows and macOS (preinstalled on both)
- **Optional** — NVIDIA GPU with NVENC support for hardware-accelerated encoding (auto-detected, transparently falls back to `libx264` if unavailable)

**Linux (Debian / Ubuntu)** — `sudo apt update && sudo apt install yt-dlp ffmpeg fonts-dejavu-core`  
**macOS** — `brew install yt-dlp ffmpeg`  
**Windows** — `winget install yt-dlp.yt-dlp` and `winget install Gyan.FFmpeg`

<details>
<summary>Linux install on other distros</summary>

**Arch / CachyOS**

```bash
sudo pacman -S yt-dlp ffmpeg ttf-dejavu
```

**Fedora**

```bash
sudo dnf install yt-dlp ffmpeg dejavu-sans-fonts
```

**openSUSE**

```bash
sudo zypper install yt-dlp ffmpeg dejavu-fonts
```

If `yt-dlp` is not in your distro packages, install it from [yt-dlp releases](https://github.com/yt-dlp/yt-dlp/releases) or `pip install yt-dlp`.

</details>

## Configuration

- **Compilation defaults** (song count, clip length, encoder, etc.) are saved per-browser on the **Settings** page.
- **Pipeline tuning** (workers, ffmpeg quality, metadata provider, rate limits) lives in `.env`. Copy `.env.example` to `.env` and restart the backend.
- **Anime metadata** can be switched between Jikan and AniList on the Settings page. Theme song lists (opening/ending titles) always come from Jikan — AniList is used for metadata only.

<details>
<summary>Where Cuekiyo stores files</summary>

| Path | Purpose |
| --- | --- |
| `data/pipeline.db` | SQLite database |
| `data/settings.json` | Persisted pipeline settings (written by the Settings page; `.env` still overrides) |
| `data/projects/{id}/` | Downloads, clips, output |

These paths are gitignored. Delete `data/pipeline.db` for a clean slate.

</details>

## Troubleshooting

<details>
<summary><code>ffmpeg</code>, <code>ffprobe</code>, or <code>yt-dlp</code> reported missing</summary>

Visit <http://127.0.0.1:8000/api/system/binaries> to see exactly which binary is missing. The most common cause on Windows is `winget`-installed binaries not being on the current shell's `PATH` — open a new terminal or restart the machine. On macOS, confirm `brew --prefix`/bin is on your `PATH`.

</details>

<details>
<summary>Port 5173 or 8000 already in use</summary>

Free the port or override it. The frontend port can be changed with `cd frontend && npm run dev -- --port 5174`. The backend port comes from `scripts/run-backend.sh` — pass `--port 8001` (and update the Vite proxy if you do).

</details>

<details>
<summary>NVENC errors during rendering</summary>

Cuekiyo probes NVENC at startup and falls back to `libx264` automatically when probing fails. If you want to force CPU encoding, choose a `libx264` encoder in **Settings**. NVENC requires a recent NVIDIA driver and an FFmpeg build compiled with `--enable-nvenc`.

</details>

<details>
<summary>Jikan or AniList rate-limited / 429</summary>

Both clients are already rate-limited (`PIPELINE_JIKAN_RATE_LIMIT_SECONDS`, `PIPELINE_ANILIST_RATE_LIMIT_SECONDS` in `.env`). If you still see throttling, increase those values and restart the backend. Switching the provider on the Settings page can also help.

</details>

<details>
<summary>Pipeline appears stuck</summary>

Jobs run under a global pipeline lock with a heartbeat. If the backend crashes mid-job, the lock recovers automatically after `PIPELINE_STALE_LOCK_SECONDS` (default 120s). To force-clear, stop the backend and delete the `app_lock` row, or wipe `data/pipeline.db` for a full reset.

</details>

<details>
<summary>Overlay not rendering</summary>

Overlay rendering uses Node.js (Satori) under the hood. Confirm `npm run setup` completed without errors and that the binaries endpoint reports overlay rendering as available. Missing fonts also break overlays — install the font package listed under [Requirements](#requirements).

</details>

## Roadmap

Tracked publicly via [GitHub issues](https://github.com/unloopedmido/cuekiyo/issues). Current direction:

- Parallel project jobs (lift the global pipeline lock)
- Richer concat / crossfade graph for 2+ clips
- Smarter retry that picks up from the actual failed stage instead of inferring from the last failed job
- Optional desktop wrapper (Tauri/Electron) for a one-click launch

Known v1 limitations:

- One pipeline job at a time (global lock)
- Concat crossfade chain is simplified for 2+ clips
- Retry infers the failed stage from the last failed job

## Contributing

```bash
npm test           # backend pytest + frontend tests + build
npm run lint       # ESLint over the frontend
npm run format     # Prettier over the frontend
npm run doctor:react   # React 19 codebase health check
npm run fallow:health  # dependency / dead-code audit summary
```

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for PR guidelines and [`SECURITY.md`](SECURITY.md) for vulnerability reports.

<details>
<summary>Manual verification checklist (pre-release smoke test)</summary>

### Manual source mode

1. Create project with "I'll paste YouTube links"
2. Complete song selection → confirm pipeline skips sourcing and lands on review clips
3. Paste a valid YouTube URL per song; confirm thumbnail/title appear
4. After last song, confirm download starts automatically

### Overlay, trim, reprocess, templates

- Overlay disabled → no lower-third on final clips; minimal + top position → overlay at top
- Trim gate → custom start/duration on one song; heatmap on another
- Re-apply overlay / render again → no re-download
- Duplicate project, download clips ZIP, save/load project templates
- Bulk MyAnimeList import + unlimited songs; crossfade 0 s vs 1 s on final MP4

</details>

## Legal notice

Cuekiyo is **local personal software**. It does not host, distribute, or publish your videos.

**You are solely responsible** for rights and permissions on any anime footage, music, and third-party video you source or export, and for complying with copyright law and platform terms (including YouTube's Terms of Service).

The authors are **not affiliated with your output** and do not review compilations you create.

## License

MIT — see [LICENSE](LICENSE).
