# SmallCode skills

SmallCode does not read Claude/OpenCode-style folder skills at `.agents/**/SKILL.md`. It expects flat markdown files in `.smallcode/skills/` (for example `.smallcode/skills/brainstorming.md`).

## Layout

| Source | SmallCode |
|--------|-----------|
| `.agents/skills/<name>/SKILL.md` | `.smallcode/skills/<name>.md` |
| Extra `.md` files in the skill folder | Appended under `## Included: …` sections in the flat file |

Each flat file uses simple YAML frontmatter:

```yaml
---
name: skill-name
trigger: manual
keywords: [optional, keywords]
---
```

## Updating skills

1. Edit the source under `.agents/`.
2. Update the matching flat file in `.smallcode/skills/<name>.md` to match (frontmatter, main body, and any included sections).
3. Start SmallCode and run `/skill list` to confirm.

Do not rely on SmallCode reading `.agents/` directly — only the flat files are detected.
