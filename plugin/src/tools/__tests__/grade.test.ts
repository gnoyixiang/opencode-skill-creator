import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync, rmSync } from "fs";
import { join } from "path";
import toolGrade from "../../tools/grade.js";
import type { ToolContext } from "@opencode-ai/plugin";

const mockContext: ToolContext = {
  sessionID: "test",
  messageID: "test",
  agent: "test",
  directory: "/tmp",
  worktree: "/tmp",
  abort: new AbortController().signal,
  metadata: () => {},
  ask: async () => {},
};

let tmpDir = "";

beforeEach(() => {
  tmpDir = mkdtempSync("test-grade-");
});

afterEach(() => {
  if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
});

function setupEvalDir(name: string, assertions: unknown[], outputFiles: Record<string, string>): string {
  const evalDir = join(tmpDir, name);
  mkdirSync(evalDir, { recursive: true });
  mkdirSync(join(evalDir, "outputs"), { recursive: true });

  writeFileSync(
    join(evalDir, "eval_metadata.json"),
    JSON.stringify(
      {
        eval_id: name,
        eval_name: name,
        prompt: "Test prompt",
        assertions,
      },
      null,
      2,
    ),
    "utf-8",
  );

  for (const [file, content] of Object.entries(outputFiles)) {
    writeFileSync(join(evalDir, "outputs", file), content, "utf-8");
  }

  return evalDir;
}

describe("skill_grade", () => {
  it("grades contains assertion as passed", async () => {
    const evalDir = setupEvalDir("test-eval-1", [{ type: "contains", value: "Hello" }], {
      "output.txt": "Hello, World!",
    });
    const result = await toolGrade.execute({ evalDir }, mockContext);
    const output = typeof result === "string" ? result : result.output;
    assert.match(output, /1\/1 passed/);
  });

  it("grades contains assertion as failed", async () => {
    const evalDir = setupEvalDir("test-eval-2", [{ type: "contains", value: "Goodbye" }], {
      "output.txt": "Hello, World!",
    });
    const result = await toolGrade.execute({ evalDir }, mockContext);
    const output = typeof result === "string" ? result : result.output;
    assert.match(output, /0\/1 passed/);
  });

  it("grades regex assertion pass", async () => {
    const evalDir = setupEvalDir("test-eval-regex-pass", [{ type: "regex", value: "\\d{4}-\\d{2}-\\d{2}" }], {
      "output.txt": "Date: 2024-01-15",
    });
    const result = await toolGrade.execute({ evalDir }, mockContext);
    const output = typeof result === "string" ? result : result.output;
    assert.match(output, /1\/1 passed/);
  });

  it("grades regex assertion fail", async () => {
    const evalDir = setupEvalDir("test-eval-regex-fail", [{ type: "regex", value: "\\d{4}-\\d{2}-\\d{2}" }], {
      "output.txt": "No date here",
    });
    const result = await toolGrade.execute({ evalDir }, mockContext);
    const output = typeof result === "string" ? result : result.output;
    assert.match(output, /0\/1 passed/);
  });

  it("grades regex with invalid pattern", async () => {
    const evalDir = setupEvalDir("test-eval-regex-bad", [{ type: "regex", value: "[invalid" }], {
      "output.txt": "anything",
    });
    const result = await toolGrade.execute({ evalDir }, mockContext);
    const output = typeof result === "string" ? result : result.output;
    assert.match(output, /0\/1 passed/);
  });

  it("grades json_schema pass", async () => {
    const evalDir = setupEvalDir("test-eval-json-pass", [{ type: "json_schema", value: "{}" }], {
      "output.json": '{"a":1}',
    });
    const result = await toolGrade.execute({ evalDir }, mockContext);
    const output = typeof result === "string" ? result : result.output;
    assert.match(output, /1\/1 passed/);
  });

  it("grades json_schema fail for invalid JSON", async () => {
    const evalDir = setupEvalDir("test-eval-json-fail", [{ type: "json_schema", value: "not json" }], {
      "output.txt": "not json",
    });
    const result = await toolGrade.execute({ evalDir }, mockContext);
    const output = typeof result === "string" ? result : result.output;
    assert.match(output, /0\/1 passed/);
  });

  it("grades file_exists pass", async () => {
    const evalDir = setupEvalDir("test-eval-exists-pass", [{ type: "file_exists", value: "result.csv" }], {
      "result.csv": "a,b,c",
    });
    const result = await toolGrade.execute({ evalDir }, mockContext);
    const output = typeof result === "string" ? result : result.output;
    assert.match(output, /1\/1 passed/);
  });

  it("grades file_exists fail", async () => {
    const evalDir = setupEvalDir("test-eval-exists-fail", [{ type: "file_exists", value: "missing.csv" }], {
      "present.txt": "hello",
    });
    const result = await toolGrade.execute({ evalDir }, mockContext);
    const output = typeof result === "string" ? result : result.output;
    assert.match(output, /0\/1 passed/);
  });

  it("grades file_contains pass", async () => {
    const evalDir = setupEvalDir(
      "test-eval-fc-pass",
      [{ type: "file_contains", value: "header1", path: join(tmpDir, "test-eval-fc-pass", "outputs", "data.csv") }],
      { "data.csv": "header1,header2\n1,2" },
    );
    const result = await toolGrade.execute({ evalDir }, mockContext);
    const output = typeof result === "string" ? result : result.output;
    assert.match(output, /1\/1 passed/);
  });

  it("grades file_contains fail when not found", async () => {
    const evalDir = setupEvalDir(
      "test-eval-fc-fail",
      [{ type: "file_contains", value: "missing", path: join(tmpDir, "test-eval-fc-fail", "outputs", "data.csv") }],
      { "data.csv": "header1,header2" },
    );
    const result = await toolGrade.execute({ evalDir }, mockContext);
    const output = typeof result === "string" ? result : result.output;
    assert.match(output, /0\/1 passed/);
  });

  it("grades file_contains fail when file missing", async () => {
    const evalDir = setupEvalDir(
      "test-eval-fc-missing",
      [{ type: "file_contains", value: "text", path: "/nonexistent/file.txt" }],
      { "some.txt": "text" },
    );
    const result = await toolGrade.execute({ evalDir }, mockContext);
    const output = typeof result === "string" ? result : result.output;
    assert.match(output, /0\/1 passed/);
  });

  it("handles unsupported assertion type", async () => {
    const evalDir = setupEvalDir("test-eval-unknown", [{ type: "unknown_type" as never, value: "x" }], {
      "output.txt": "hello",
    });
    const result = await toolGrade.execute({ evalDir }, mockContext);
    const output = typeof result === "string" ? result : result.output;
    assert.match(output, /0\/1 passed/);
  });

  it("grades multiple assertions", async () => {
    const evalDir = setupEvalDir(
      "test-eval-5",
      [
        { type: "contains", value: "header" },
        { type: "contains", value: "missing" },
        { type: "file_exists", value: "data.csv" },
      ],
      { "data.csv": "header1,header2\n1,2" },
    );
    const result = await toolGrade.execute({ evalDir }, mockContext);
    const output = typeof result === "string" ? result : result.output;
    assert.match(output, /2\/3 passed/);
  });

  it("handles missing eval_metadata.json", async () => {
    const evalDir = join(tmpDir, "missing-meta");
    mkdirSync(evalDir, { recursive: true });
    const result = await toolGrade.execute({ evalDir }, mockContext);
    const output = typeof result === "string" ? result : result.output;
    assert.match(output, /No eval_metadata.json/);
  });

  it("handles missing outputs directory", async () => {
    const evalDir = join(tmpDir, "no-outputs");
    mkdirSync(evalDir, { recursive: true });
    writeFileSync(
      join(evalDir, "eval_metadata.json"),
      JSON.stringify({
        eval_id: "no-outputs",
        eval_name: "test",
        prompt: "test",
        assertions: [{ type: "contains", value: "x" }],
      }),
      "utf-8",
    );
    const result = await toolGrade.execute({ evalDir }, mockContext);
    const output = typeof result === "string" ? result : result.output;
    assert.match(output, /0\/1 passed/);
  });

  it("writes grading.json", async () => {
    const evalDir = setupEvalDir("test-eval-6", [{ type: "contains", value: "Hello" }], { "output.txt": "Hello" });
    await toolGrade.execute({ evalDir }, mockContext);
    const gradingPath = join(evalDir, "grading.json");
    const content = readFileSync(gradingPath, "utf-8");
    const grading = JSON.parse(content);
    assert.equal(grading.eval_id, "test-eval-6");
    assert.equal(grading.passed_assertions, 1);
  });
});
