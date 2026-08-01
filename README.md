# opencode-skill-creator

Create, evaluate, benchmark, and package OpenCode agent skills.

## Overview

This project provides a **skill** (`SKILL.md`) and a **plugin** (`plugin/`) for OpenCode that enables you to:

- **Create** new skills from templates with `skill_init`
- **Validate** skill structure and frontmatter with `skill_validate`
- **Test** skills against deterministic assertions with `skill_grade`
- **Benchmark** skill performance vs baseline with `skill_benchmark`
- **Package** skills into distributable `.tar.gz` archives with `skill_package`

## Installation

### Global (recommended)

```bash
npx @gnoyx/opencode-skill-creator install --global
```

### Project-local

```bash
npx @gnoyx/opencode-skill-creator install --project
```

Both methods register the plugin with OpenCode. The plugin provides 5 tools that the opencode-skill-creator skill can invoke.

## Quick Start

1. **Initialize a new skill:**
   ```bash
   skill_init(name="my-skill", path="./skills", resources=["scripts", "references"])
   ```

2. **Edit the generated `skills/my-skill/SKILL.md`** — write your skill instructions

3. **Validate:**
   ```bash
   skill_validate(path="./skills/my-skill")
   ```

4. **Create eval test cases** in `skills/my-skill/evals/evals.json`:
   ```json
   {
     "skill_name": "my-skill",
     "evals": [
       {
         "id": "test-1",
         "prompt": "Extract data from the CSV file",
         "assertions": [
           {"type": "contains", "value": "expected output"},
           {"type": "file_exists", "value": "output.json"}
         ]
       }
     ]
   }
   ```

5. **Run evals** (spawn subagents for with-skill and without-skill), then:
   ```bash
   skill_grade(evalDir="./workspace/iteration-1/test-1/with_skill")
   skill_grade(evalDir="./workspace/iteration-1/test-1/without_skill")
   ```

6. **Benchmark results:**
   ```bash
   skill_benchmark(workspaceDir="./workspace/iteration-1", skillName="my-skill", iteration=1)
   ```

7. **Package for distribution:**
   ```bash
   skill_package(skillPath="./skills/my-skill")
   ```

## Architecture

```
opencode-skill-creator/
├── SKILL.md                    # Main skill definition (workflow + tools)
├── templates/                  # Skill initialization templates
│   ├── SKILL.md.template
│   └── evals.json.template
├── references/                 # Reference docs for skill authors
│   ├── opencode-skill-spec.md  # SKILL.md format spec
│   ├── schemas.md              # JSON schemas (evals, grading, benchmark)
│   └── assertion-types.md      # Supported assertion types
├── agents/
│   └── grader.md              # Semantic grading prompt (LLM-based)
└── plugin/                    # OpenCode plugin (TypeScript)
    ├── src/
    │   ├── index.ts           # Plugin entry, registers 5 tools
    │   ├── bin/cli.ts         # CLI installer (install/uninstall)
    │   ├── lib/               # Shared utilities
    │   │   ├── frontmatter.ts  # YAML parsing + validation
    │   │   ├── workspace.ts    # File I/O helpers
    │   │   └── schemas.ts      # TypeScript interfaces
    │   └── tools/             # Tool implementations
    │       ├── init.ts        # skill_init
    │       ├── validate.ts    # skill_validate
    │       ├── grade.ts       # skill_grade
    │       ├── benchmark.ts   # skill_benchmark
    │       └── package.ts     # skill_package
    ├── package.json
    ├── tsconfig.json
    ├── eslint.config.js
    ├── .prettierrc
    └── .c8rc.json             # Coverage thresholds (85%)
```

## Plugin Tools

| Tool | Description |
|------|-------------|
| `skill_init` | Create skill directory from template with optional `scripts/`, `references/`, `assets/` |
| `skill_validate` | Check SKILL.md exists, valid frontmatter, naming conventions |
| `skill_grade` | Deterministic grading: `contains`, `regex`, `json_schema`, `file_exists`, `file_contains` |
| `skill_benchmark` | Aggregate pass rates, timing deltas → `benchmark.json` + `benchmark.md` |
| `skill_package` | Create `.tar.gz` archive of skill directory |

## Development

```bash
cd plugin
npm install
npm run verify        # lint + format + typecheck + test:coverage
npm run test          # run tests (80 tests)
npm run test:coverage # with coverage (87%+ statements, 86%+ branches)
npm run build         # compile to dist/
```

## Requirements

- Node.js 20+
- OpenCode with plugin support

## License

MIT