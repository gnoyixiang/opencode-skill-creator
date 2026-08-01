# SKILL.md Format Specification

## Frontmatter

Every SKILL.md must start with YAML frontmatter delimited by `---`:

```yaml
---
name: skill-name
description: "What this skill does and when to trigger it"
---
```

### Required Fields

| Field | Rules |
|---|---|
| `name` | Lowercase letters, digits, and hyphens only. Max 64 chars. Regex: `^[a-z0-9]+(-[a-z0-9]+)*$` |
| `description` | String between 10 and 1024 characters. Include what the skill does AND when to use it. |

Do not include any other YAML frontmatter fields.

## Naming Rules

- Use lowercase letters, digits, and hyphens only
- Normalize titles to hyphen-case (e.g., "Plan Mode" → `plan-mode`)
- Prefer short, verb-led phrases
- Namespace by tool when it improves clarity (e.g., `gh-address-comments`)
- Name the skill directory exactly after the skill name

## Body

Write instructions using the imperative form. Follow progressive disclosure:

1. **Core workflow** — Essential instructions that should always be in context
2. **Reference links** — Point to `references/` files for detailed guidance
3. **Examples** — Show concrete input/output pairs

## Skill Discovery Locations

OpenCode loads skills from these locations (scanned in order, later locations overwrite):

| Location | Scope |
|---|---|
| `~/.claude/skills/` | Global (Claude Code compatible) |
| `~/.agents/skills/` | Global |
| `.claude/skills/` | Project (walked up from cwd) |
| `.agents/skills/` | Project (walked up from cwd) |
| `.opencode/skills/` | Project |
| `.opencode/skill/` | Project (single skill) |
| Config `skills.paths` | Custom paths |

## What NOT to Include

- README.md, CHANGELOG.md, or other documentation files
- Empty or placeholder files
- Files that don't directly support the skill's functionality