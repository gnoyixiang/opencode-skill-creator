import { tool } from "@opencode-ai/plugin";
import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import type { Assertion, EvalMetadata, GradingEntry, GradingResult } from "../lib/schemas";
import { readJsonFile, writeJsonFile } from "../lib/workspace";

function checkAssertion(assertion: Assertion, outputText: string, outputFiles: string[]): GradingEntry {
  const text =
    assertion.type === "file_exists" || assertion.type === "file_contains"
      ? `Check ${assertion.path || assertion.value}`
      : assertion.value;

  switch (assertion.type) {
    case "contains":
      return {
        text,
        passed: outputText.includes(assertion.value),
        evidence: outputText.includes(assertion.value)
          ? `Found "${assertion.value}" in output`
          : `"${assertion.value}" not found in output`,
      };

    case "regex": {
      try {
        const re = new RegExp(assertion.value, "m");
        const match = outputText.match(re);
        return {
          text,
          passed: match !== null,
          evidence: match ? `Matched: "${match[0]}"` : `No match for regex: ${assertion.value}`,
        };
      } catch {
        return { text, passed: false, evidence: `Invalid regex: ${assertion.value}` };
      }
    }

    case "json_schema": {
      try {
        JSON.parse(assertion.value);
        return { text, passed: true, evidence: "Output is valid JSON" };
      } catch {
        return { text, passed: false, evidence: "Output is not valid JSON" };
      }
    }

    case "file_exists":
      return {
        text: `File exists: ${assertion.value}`,
        passed: outputFiles.some((f) => f.endsWith(assertion.value)) || existsSync(assertion.value),
        evidence: outputFiles.some((f) => f.endsWith(assertion.value))
          ? `File "${assertion.value}" found in output list`
          : `File "${assertion.value}" not found`,
      };

    case "file_contains": {
      try {
        const filePath = assertion.path || assertion.value;
        const fileContent = readFileSync(filePath, "utf-8");
        return {
          text: `${filePath} contains "${assertion.value}"`,
          passed: fileContent.includes(assertion.value),
          evidence: fileContent.includes(assertion.value) ? `Found in ${filePath}` : `Not found in ${filePath}`,
        };
      } catch {
        return {
          text: `${assertion.path || assertion.value} contains expected text`,
          passed: false,
          evidence: `Cannot read file: ${assertion.path || assertion.value}`,
        };
      }
    }

    default:
      return {
        text,
        passed: false,
        evidence: `Unsupported assertion type: ${(assertion as Assertion).type}`,
      };
  }
}

export default tool({
  description: "Grade a single eval run against its assertions (deterministic checks only)",
  args: {
    evalDir: tool.schema.string().describe("Path to eval directory containing eval_metadata.json and outputs/"),
  },
  async execute(args) {
    const metadata = readJsonFile<EvalMetadata>(join(args.evalDir, "eval_metadata.json"));
    if (!metadata) {
      return { title: "Grade error", output: `ERROR: No eval_metadata.json found in ${args.evalDir}` };
    }

    const outputsDir = join(args.evalDir, "outputs");
    const outputFiles: string[] = [];
    const outputTexts: string[] = [];

    try {
      const entries = readdirSync(outputsDir);
      for (const file of entries) {
        const filePath = join(outputsDir, file);
        outputFiles.push(filePath);
        try {
          outputTexts.push(readFileSync(filePath, "utf-8"));
        } catch {
          // skip unreadable files
        }
      }
    } catch {
      // outputs directory may not exist
    }

    const combinedOutput = outputTexts.join("\n---\n");
    const entries: GradingEntry[] = metadata.assertions.map((a: Assertion) =>
      checkAssertion(a, combinedOutput, outputFiles),
    );

    const result: GradingResult = {
      eval_id: metadata.eval_id,
      total_assertions: entries.length,
      passed_assertions: entries.filter((e) => e.passed).length,
      entries,
    };

    writeJsonFile(join(args.evalDir, "grading.json"), result);

    const passRate =
      result.total_assertions > 0 ? Math.round((result.passed_assertions / result.total_assertions) * 100) : 0;

    return {
      title: "Grade complete",
      output: `eval: ${result.eval_id} — ${result.passed_assertions}/${result.total_assertions} passed (${passRate}%)`,
      metadata: { passed: result.passed_assertions, total: result.total_assertions, pass_rate: passRate },
    };
  },
});
