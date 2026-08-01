import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync, rmSync } from "fs";
import { join } from "path";
import toolBenchmark from "../../tools/benchmark.js";
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
  tmpDir = mkdtempSync("test-bench-");
});

afterEach(() => {
  if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
});

function setupEvalRun(
  evalName: string,
  config: "with_skill" | "without_skill",
  passed: number,
  total: number,
  durationMs = 1000,
): void {
  const dir = join(tmpDir, evalName, config);
  mkdirSync(dir, { recursive: true });

  writeFileSync(
    join(dir, "grading.json"),
    JSON.stringify(
      {
        eval_id: evalName,
        total_assertions: total,
        passed_assertions: passed,
        entries: [],
      },
      null,
      2,
    ),
    "utf-8",
  );

  writeFileSync(
    join(dir, "timing.json"),
    JSON.stringify({ start_ms: 0, end_ms: durationMs, duration_ms: durationMs }, null, 2),
    "utf-8",
  );
}

function setupPartialEvalRun(evalName: string, config: "with_skill" | "without_skill"): void {
  const dir = join(tmpDir, evalName, config);
  mkdirSync(dir, { recursive: true });
  // Only create timing.json, no grading.json
  writeFileSync(
    join(dir, "timing.json"),
    JSON.stringify({ start_ms: 0, end_ms: 500, duration_ms: 500 }, null, 2),
    "utf-8",
  );
}

describe("skill_benchmark", () => {
  it("aggregates a single eval", async () => {
    setupEvalRun("eval-1", "with_skill", 3, 3);
    setupEvalRun("eval-1", "without_skill", 1, 3);

    const result = await toolBenchmark.execute(
      { workspaceDir: tmpDir, skillName: "test-skill", iteration: 1 },
      mockContext,
    );

    const output = typeof result === "string" ? result : result.output;
    assert.ok(output.includes("Benchmark"));
    assert.ok(output.includes("Evals:** 1"));
  });

  it("aggregates multiple evals", async () => {
    setupEvalRun("eval-1", "with_skill", 3, 3, 1500);
    setupEvalRun("eval-1", "without_skill", 1, 3, 1000);
    setupEvalRun("eval-2", "with_skill", 2, 3, 2000);
    setupEvalRun("eval-2", "without_skill", 2, 3, 1200);

    const result = await toolBenchmark.execute({ workspaceDir: tmpDir, skillName: "multi-test" }, mockContext);

    const output = typeof result === "string" ? result : result.output;
    assert.ok(output.includes("Evals:** 2"));
  });

  it("handles partial data with missing grading.json", async () => {
    setupEvalRun("eval-1", "with_skill", 3, 3);
    setupPartialEvalRun("eval-1", "without_skill");

    const result = await toolBenchmark.execute({ workspaceDir: tmpDir }, mockContext);
    const output = typeof result === "string" ? result : result.output;
    assert.ok(output.includes("With Skill"));
    assert.ok(output.includes("Without Skill"));
  });

  it("handles missing timing .json gracefully", async () => {
    const dir = join(tmpDir, "eval-no-timing", "with_skill");
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, "grading.json"),
      JSON.stringify({ eval_id: "eval-no-timing", total_assertions: 2, passed_assertions: 2, entries: [] }),
      "utf-8",
    );
    const noTimingDir = join(tmpDir, "eval-no-timing", "without_skill");
    mkdirSync(noTimingDir, { recursive: true });
    writeFileSync(
      join(noTimingDir, "grading.json"),
      JSON.stringify({ eval_id: "eval-no-timing", total_assertions: 2, passed_assertions: 1, entries: [] }),
      "utf-8",
    );

    const result = await toolBenchmark.execute({ workspaceDir: tmpDir }, mockContext);
    const output = typeof result === "string" ? result : result.output;
    assert.ok(output.includes("eval-no-timing"));
  });

  it("recognizes alternative eval name patterns", async () => {
    setupEvalRun("test-basic", "with_skill", 2, 2);
    setupEvalRun("test-basic", "without_skill", 1, 2);
    setupEvalRun("01-extract", "with_skill", 1, 2);
    setupEvalRun("01-extract", "without_skill", 1, 2);

    const result = await toolBenchmark.execute({ workspaceDir: tmpDir }, mockContext);
    const output = typeof result === "string" ? result : result.output;
    assert.ok(output.includes("Evals:** 2"));
  });

  it("handles empty workspace gracefully", async () => {
    const result = await toolBenchmark.execute({ workspaceDir: join(tmpDir, "empty-workspace") }, mockContext);

    const output = typeof result === "string" ? result : result.output;
    assert.ok(output.includes("No eval directories found"));
  });

  it("writes benchmark.json and benchmark.md", async () => {
    setupEvalRun("eval-1", "with_skill", 3, 3);
    setupEvalRun("eval-1", "without_skill", 1, 3);

    await toolBenchmark.execute({ workspaceDir: tmpDir }, mockContext);

    assert.ok(JSON.parse(readFileSync(join(tmpDir, "benchmark.json"), "utf-8")));
    assert.ok(readFileSync(join(tmpDir, "benchmark.md"), "utf-8").includes("Benchmark"));
  });
});
