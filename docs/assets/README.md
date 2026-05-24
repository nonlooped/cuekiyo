# Launch assets

Marketing assets for the public README and GitHub social preview.

| File | Purpose |
|------|---------|
| `cover.html` | README hero source (HTML/CSS). Edit this, then screenshot to `cover.png`. |
| `cover.png` | Exported README hero banner |
| `dashboard.png` | Projects list with active and completed compilations |
| `project-gate.png` | Candidate review checkpoint |
| `completed.png` | Finished project with output actions |
| `social-preview.png` | GitHub social preview (1280×640) — upload in repo Settings → General |

## Regenerating

Use the dark theme. Capture screenshots at 1440×900 (2× retina) for crisp PNGs. Avoid prominent copyrighted artwork in marketing shots when possible.

```bash
npm run dev
# capture with browser automation or manual screenshots into this folder
```

Export `cover.png` from `cover.html`:

```bash
cd docs/assets && python3 -m http.server 8765 --bind 127.0.0.1
# in another terminal:
agent-browser set viewport 1280 480 2
agent-browser open http://127.0.0.1:8765/cover.html
agent-browser wait --load networkidle && agent-browser wait 1500
agent-browser screenshot docs/assets/cover.png
```

The SVG template at [social-preview.svg](social-preview.svg) remains available for the GitHub link preview card.
