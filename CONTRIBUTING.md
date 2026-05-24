# Contributing to Cuekiyo

Thanks for your interest in Cuekiyo. This project is local-first tooling for anime compilation creators — contributions that improve clarity, reliability, and the creator workflow are welcome.

## Before you start

1. Read [README.md](README.md) for setup and manual verification paths.
2. Search [existing issues](https://github.com/unloopedmido/cuekiyo/issues) to avoid duplicates.
3. For large changes, open an issue first so we can align on scope.

## Development setup

```bash
# Backend
cd backend && python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt

# Frontend
cd frontend && npm ci

# From repo root
npm test
```

## Pull requests

- Keep PRs focused — one concern per PR when possible.
- Run `npm test` before opening.
- Match existing code style (TypeScript/React 19 in frontend, FastAPI in backend).
- Use creator-facing language in UI copy, not internal pipeline jargon.
- Do not hand-edit `frontend/src/components/ui/*` — add shadcn components via CLI.

## Reporting bugs

Include:

- OS and versions (Python, Node, ffmpeg, yt-dlp)
- Steps to reproduce
- Expected vs actual behavior
- Relevant logs from the collapsible job log in the UI (no copyrighted media attachments)

## Feature requests

Describe the creator workflow problem, not just the implementation. Cuekiyo favors guided defaults with power-user options behind disclosure.

## Code of conduct

Be respectful. This is a hobby project maintained in spare time.
