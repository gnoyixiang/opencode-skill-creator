# JSON Schemas

## evals.json

```json
{
  "skill_name": "my-skill",
  "evals": [
    {
      "id": "test-001",
      "prompt": "User's task prompt for this test case",
      "input_files": ["input.csv"],
      "assertions": [
        {"type": "contains", "value": "expected substring"}
      ]
    }
  ]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `skill_name` | string | Yes | Name of the skill being tested |
| `evals` | array | Yes | Array of eval cases |
| `evals[].id` | string | Yes | Unique identifier for this eval |
| `evals[].prompt` | string | Yes | The task prompt for the subagent |
| `evals[].input_files` | string[] | No | Input files to provide to the subagent |
| `evals[].assertions` | array | Yes | Array of assertions to check |

## eval_metadata.json

```json
{
  "eval_id": "test-001",
  "eval_name": "basic-extraction",
  "prompt": "User's task prompt for this test case",
  "assertions": [
    {"type": "contains", "value": "expected substring"}
  ]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `eval_id` | string | Yes | Matches the eval id from evals.json |
| `eval_name` | string | Yes | Human-readable name |
| `prompt` | string | Yes | The task prompt that was used |
| `assertions` | array | Yes | Assertions to check against the output |

## grading.json

```json
{
  "eval_id": "test-001",
  "total_assertions": 3,
  "passed_assertions": 2,
  "entries": [
    {
      "text": "Output contains expected text",
      "passed": true,
      "evidence": "Found 'expected text' in output.csv"
    },
    {
      "text": "Output file exists",
      "passed": true,
      "evidence": "File output.csv found"
    },
    {
      "text": "Date format is correct",
      "passed": false,
      "evidence": "No date matching pattern found in output"
    }
  ]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `eval_id` | string | Yes | Matches the eval id |
| `total_assertions` | number | Yes | Total number of assertions checked |
| `passed_assertions` | number | Yes | Number of assertions that passed |
| `entries` | array | Yes | Per-assertion grading results |
| `entries[].text` | string | Yes | Description of what was checked |
| `entries[].passed` | boolean | Yes | Whether the assertion passed |
| `entries[].evidence` | string | Yes | Explanation of the result |

## timing.json

```json
{
  "duration_ms": 23332
}
```

## benchmark.json

```json
{
  "skill_name": "my-skill",
  "iteration": 1,
  "evals": [
    {
      "eval_id": "test-001",
      "eval_name": "basic-extraction",
      "with_skill": {
        "passed": 3,
        "total": 3,
        "pass_rate": 1.0,
        "duration_ms": 15000
      },
      "without_skill": {
        "passed": 1,
        "total": 3,
        "pass_rate": 0.33,
        "duration_ms": 12000
      },
      "delta": {
        "pass_rate": 0.67,
        "duration_ms": 3000
      }
    }
  ]
}
```