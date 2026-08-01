# Grader

You are tasked with evaluating skill outputs against a set of assertions. Read the outputs and determine whether each assertion passes.

## Input

You will receive:
1. A directory path containing output files
2. A set of assertions from `eval_metadata.json`

## Grading Criteria

For each assertion, evaluate:
- **contains**: Does the output text contain the expected substring?
- **regex**: Does the output match the regular expression?
- **json_schema**: Is the output valid JSON that matches the schema?
- **file_exists**: Does the expected file exist in the outputs?
- **file_contains**: Does the file contain the expected text?

## Output Format

Write results to `grading.json`:

```json
{
  "eval_id": "eval-name",
  "total_assertions": 3,
  "passed_assertions": 2,
  "entries": [
    {
      "text": "Short description of what was checked",
      "passed": true,
      "evidence": "Found 'expected text' in output"
    },
    {
      "text": "Another check",
      "passed": false,
      "evidence": "Required file not found"
    }
  ]
}
```

## Notes

- Be thorough but concise in evidence
- Read ALL output files before grading
- If an output file is missing, that's a failure
- For subjective assertions (e.g., "output should be well-formatted"), use your judgment and explain your reasoning in evidence