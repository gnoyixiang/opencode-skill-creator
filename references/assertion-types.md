# Assertion Types

Supported assertion types for deterministic grading via `skill_grade`.

## contains

Checks whether the combined output text contains the specified substring.

```json
{"type": "contains", "value": "expected text"}
```

**Use for:** Checking that output mentions specific terms, phrases, or values.

## regex

Checks whether the combined output text matches a regular expression.

```json
{"type": "regex", "value": "\\d{4}-\\d{2}-\\d{2}"}
```

**Use for:** Date formats, email patterns, structured data formats, ID patterns.

## json_schema

Verifies that the output is valid JSON (basic structural check).

```json
{"type": "json_schema", "value": "{\"valid\": \"json\"}"}
```

Note: v1 checks only that output is valid JSON. Deep schema validation is planned for a future release.

## file_exists

Checks whether a file with the specified name exists in the output directory.

```json
{"type": "file_exists", "value": "output.csv"}
```

**Use for:** Verifying that the skill produces the expected output file(s).

## file_contains

Checks whether a specific file contains a substring.

```json
{"type": "file_contains", "path": "output.csv", "value": "header1,header2"}
```

| Field | Required | Description |
|---|---|---|
| `path` | Yes | Path to the file (can be absolute or relative to workspace) |
| `value` | Yes | Substring to look for in the file |

**Use for:** Validating content within specific output files.

---

## Limit for v1

Only deterministic assertions are supported in v1. Semantic assertions (e.g., "output should be well-formatted", "the code should be clean") require LLM-based grading. To use semantic grading, read `agents/grader.md` and spawn a Task subagent with it, rather than using `skill_grade`.