---
name: skill-creator
description: "Create, evaluate, benchmark, and package OpenCode agent skills. Use when users want to create a skill from scratch, edit an existing skill, run evals to test a skill, benchmark skill performance, or package a skill for distribution."
---

# Skill Creator

A skill for creating new OpenCode skills and iteratively improving them.

The process goes like this:

- Understand what the skill should do
- Write a draft of the skill
- Create test prompts and run OpenCode-with-access-to-the-skill on them
- Help the user evaluate the results
- Rewrite the skill based on feedback
- Repeat until satisfied
- Package the skill

Your job is to figure out where the user is in this process and jump in to help them progress.

---

## About Skills

Skills are modular, self-contained directories that extend OpenCode with specialized knowledge, workflows, or tool integrations. They transform OpenCode from a general-purpose agent into a specialized one.

### Skill Structure

```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter (name, description required)
│   └── Markdown instructions
└── Bundled Resources (optional)
    ├── scripts/    — Executable code for deterministic tasks
    ├── references/ — Documentation loaded into context as needed
    └── assets/     — Files used in output (templates, icons, fonts)
```

### Progressive Disclosure

Skills use a three-level loading system:
1. **Metadata (name + description)** — Always in context (~100 words)
2. **SKILL.md body** — Loaded when the skill triggers (<500 lines ideal)
3. **Bundled resources (scripts/ references/ assets/)** — Loaded as needed

Keep SKILL.md under 500 lines. Move detailed content into `references/` files and reference them clearly.

### Core Principles

- **Concise is key.** OpenCode is already very smart. Only add context it doesn't already have.
- **Explain the why.** LLMs have good theory of mind. Explain reasoning instead of writing MUSTs.
- **Include trigger contexts in the description.** The description is the primary triggering mechanism. Include what the skill does AND when to use it.
- **Name with lowercase, digits, and hyphens only.** Example: `pdf-processor`, not `PDF Processor`.

---

## Creating a Skill

### Step 1: Capture Intent

Understand what the user wants. If they say "turn this into a skill," extract answers from the conversation history — the tools used, the sequence of steps, corrections made, input/output formats observed.

Ask these questions one at a time, starting with the most important:

1. What should this skill enable OpenCode to do?
2. When should this skill trigger — what user phrases or contexts?
3. What's the expected output format?
4. Should we set up test cases? Skills with objectively verifiable outputs (file transforms, data extraction, code generation) benefit from tests. Subjective skills (writing style, design) often don't.

### Step 2: Plan Reusable Contents

For each concrete use case, identify what bundled resources would help:

- **`scripts/`** — Deterministic code that gets rewritten repeatedly (data parsing, file conversion). Write and test these scripts.
- **`references/`** — Docs OpenCode should reference: schemas, API docs, domain knowledge.
- **`assets/`** — Templates, icons, boilerplate files used in the output.

### Step 3: Initialize the Skill

Run the `skill_init` tool to create the skill directory:

```
skill_init(name="my-skill", path="./skills", resources=["scripts", "references"])
```

This creates:
- `skills/my-skill/SKILL.md` — Starter template with frontmatter and sections
- `skills/my-skill/scripts/` — If requested
- `skills/my-skill/references/` — If requested
- `skills/my-skill/assets/` — If requested

### Step 4: Edit the Skill

#### Frontmatter

Write the name and description. The description is the primary triggering mechanism — include both what the skill does AND specific trigger contexts. Make it slightly "pushy" to avoid undertriggering.

```yaml
name: my-skill
description: "What the skill does and when to use it."
```

Do not include other YAML fields.

#### Body

Write instructions for using the skill and its bundled resources:

- Use imperative form
- Include examples showing input/output
- Reference `scripts/`, `references/`, and `assets/` files clearly
- Tell OpenCode when to read each reference file
- Explain the reasoning behind important instructions

#### Resources

- **Scripts**: Must be tested by running them. If there are many similar scripts, test a representative sample.
- **References**: Keep SKILL.md lean. Move detailed schemas, examples, and domain knowledge to reference files.
- **Assets**: Place files used in the output here.

### Step 5: Validate the Skill

Run `skill_validate` to catch basic issues:

```
skill_validate(path="./skills/my-skill")
```

This checks:
- `SKILL.md` exists
- YAML frontmatter has required fields
- Name is valid (lowercase, digits, hyphens, max 64 chars)
- Description is between 10-1024 characters
- Directory name matches skill name in frontmatter

Fix any reported issues and run again.

### Step 6: Iterate

After testing the skill, users may request improvements. Apply changes and re-validate. For rigorous improvement, set up evals (see below).

---

## Running and Evaluating Test Cases

Use this workflow to test a skill against measurable criteria. Run these steps in sequence.

### Step 1: Create Test Cases

Create `evals/evals.json` in the skill directory:

```json
{
  "skill_name": "my-skill",
  "evals": [
    {
      "id": "test-1",
      "prompt": "A realistic user task the skill should handle",
      "assertions": [
        {"type": "contains", "value": "expected text"},
        {"type": "file_exists", "value": "output.csv"}
      ]
    }
  ]
}
```

See `references/schemas.md` for the full schema and `references/assertion-types.md` for supported assertion types.

Create 3-5 test cases covering different use cases. Share them with the user for confirmation before running.

### Step 2: Run Evals

Create a workspace directory and spawn eval subagents:

**Per eval, spawn TWO Task subagents concurrently:**

**With-skill subagent:**
```
Task(subagent_type="general", prompt="You are following a skill. Here is the skill content:
<read the target skill's SKILL.md content here>

Now execute this task:
<eval prompt>

Input files: <eval input_files, or none>

Save outputs to: <workspace>/iteration-1/<eval-id>/with_skill/outputs/

When done, create a timing.json file at: <workspace>/iteration-1/<eval-id>/with_skill/timing.json
Format: {"duration_ms": <number>}
```

**Baseline subagent (no skill):**
```
Task(subagent_type="general", prompt="Execute this task:
<eval prompt>

Input files: <eval input_files, or none>

Save outputs to: <workspace>/iteration-1/<eval-id>/without_skill/outputs/

When done, create a timing.json file at: <workspace>/iteration-1/<eval-id>/without_skill/timing.json
Format: {"duration_ms": <number>}
```

Spawn both for all evals in the same turn so they finish around the same time.

### Step 3: Grade the Results

For each eval, run the `skill_grade` tool:

```
skill_grade(evalDir="<workspace>/iteration-1/<eval-id>/with_skill")
skill_grade(evalDir="<workspace>/iteration-1/<eval-id>/without_skill")
```

This reads the eval metadata and output files, checks each assertion deterministically, and writes `grading.json`.

For **semantic grading** (subjective quality assessment), read `agents/grader.md` and inline it into a Task subagent prompt instead:

```
Task(subagent_type="general", prompt="<read and inline agents/grader.md content here>

Grade the outputs in: <workspace>/iteration-1/<eval-id>/with_skill/outputs/

Assertions to check:
<assertions from eval_metadata.json>

Write results to: <workspace>/iteration-1/<eval-id>/with_skill/grading.json
```

### Step 4: Aggregate Results

Run `skill_benchmark` to aggregate all eval results:

```
skill_benchmark(workspaceDir="<workspace>/iteration-1", skillName="my-skill", iteration=1)
```

This produces:
- `benchmark.json` — Structured data with per-eval pass rates, timing, and deltas
- `benchmark.md` — Human-readable markdown summary

Present the markdown summary to the user. Compare with-skill vs without-skill to show the skill's impact.

### Step 5: Improve and Repeat

Based on user feedback:

1. Edit the skill's SKILL.md or bundled resources
2. Rerun evals into `iteration-2/` (and subsequent directories)
3. Re-grade and re-benchmark
4. Present the updated comparison

Keep iterating until the user is satisfied or you're not making meaningful progress.

---

## Packaging the Skill

Run `skill_package` to create a distributable archive:

```
skill_package(skillPath="./skills/my-skill")
```

This produces `my-skill.tar.gz` in the parent directory. The user can extract it into their skills directory to install it.

---

## Reference Files

- `references/opencode-skill-spec.md` — OpenCode SKILL.md format specification
- `references/schemas.md` — JSON schemas for evals.json, grading.json, benchmark.json
- `references/assertion-types.md` — Supported assertion types and examples
- `agents/grader.md` — Prompts for semantic grading (optional advanced use)

## Plugin Tools Available

The skill-creator plugin registers these tools you can call directly:

| Tool | Purpose |
|---|---|
| `skill_init` | Create a new skill directory from template |
| `skill_validate` | Validate SKILL.md frontmatter and naming |
| `skill_grade` | Grade eval outputs against deterministic assertions |
| `skill_benchmark` | Aggregate eval results into benchmark summary |
| `skill_package` | Package skill into .tar.gz |