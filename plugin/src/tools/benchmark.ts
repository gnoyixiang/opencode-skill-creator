import { tool } from "@opencode-ai/plugin";
import { readdirSync, writeFileSync } from "fs";
import { join } from "path";
import type { GradingResult, BenchmarkConfig, BenchmarkEvalResult, TimingData } from "../lib/schemas";
import { readJsonFile, writeJsonFile } from "../lib/workspace";

function scanForEvalDirs(workspaceDir: string): string[] {
  try {
    return readdirSync(workspaceDir)
      .map((e) => join(workspaceDir, e))
      .filter((p) => {
        const name = p.split("/").pop() || "";
        return name.startsWith("eval-") || name.match(/^\d+-[a-z]/) || name.match(/^test-/);
      });
  } catch {
    return [];
  }
}

export default tool({
  description: "Aggregate eval results into a benchmark summary (markdown)",
  args: {
    workspaceDir: tool.schema.string().describe("Path to the iteration workspace directory"),
    skillName: tool.schema.string().optional().describe("Name of the skill being benchmarked"),
    iteration: tool.schema.number().optional().describe("Iteration number"),
  },
  async execute(args) {
    const evalDirs = scanForEvalDirs(args.workspaceDir);

    if (evalDirs.length === 0) {
      return {
        title: "No evals found",
        output: `No eval directories found in ${args.workspaceDir}.\nExpected subdirectories named eval-XXX/ each containing with_skill/ and without_skill/ with grading.json and timing.json.`,
      };
    }

    const evalResults: BenchmarkEvalResult[] = [];
    let totalPassedWith = 0,
      totalAssertionsWith = 0;
    let totalPassedWithout = 0,
      totalAssertionsWithout = 0;
    let totalDurationWith = 0,
      totalDurationWithout = 0;
    let evalCountWith = 0,
      evalCountWithout = 0;

    for (const evalDir of evalDirs) {
      const evalName = evalDir.split("/").pop() || "unknown";

      const gradingWith = readJsonFile<GradingResult>(join(evalDir, "with_skill", "grading.json"));
      const gradingWithout = readJsonFile<GradingResult>(join(evalDir, "without_skill", "grading.json"));
      const timingWith = readJsonFile<TimingData>(join(evalDir, "with_skill", "timing.json"));
      const timingWithout = readJsonFile<TimingData>(join(evalDir, "without_skill", "timing.json"));

      const passedWith = gradingWith?.passed_assertions ?? 0;
      const totalWith = gradingWith?.total_assertions ?? 0;
      const passedWithout = gradingWithout?.passed_assertions ?? 0;
      const totalWithout = gradingWithout?.total_assertions ?? 0;

      totalPassedWith += passedWith;
      totalAssertionsWith += totalWith;
      totalPassedWithout += passedWithout;
      totalAssertionsWithout += totalWithout;

      const durWith = timingWith?.duration_ms ?? 0;
      const durWithout = timingWithout?.duration_ms ?? 0;
      if (durWith > 0) {
        totalDurationWith += durWith;
        evalCountWith++;
      }
      if (durWithout > 0) {
        totalDurationWithout += durWithout;
        evalCountWithout++;
      }

      evalResults.push({
        eval_id: evalName,
        eval_name: evalName,
        with_skill: {
          passed: passedWith,
          total: totalWith,
          pass_rate: totalWith > 0 ? passedWith / totalWith : 0,
          duration_ms: durWith,
        },
        without_skill: {
          passed: passedWithout,
          total: totalWithout,
          pass_rate: totalWithout > 0 ? passedWithout / totalWithout : 0,
          duration_ms: durWithout,
        },
        delta: {
          pass_rate: totalWith > 0 && totalWithout > 0 ? passedWith / totalWith - passedWithout / totalWithout : 0,
          duration_ms: durWith - durWithout,
        },
      });
    }

    const overallWith = totalAssertionsWith > 0 ? totalPassedWith / totalAssertionsWith : 0;
    const overallWithout = totalAssertionsWithout > 0 ? totalPassedWithout / totalAssertionsWithout : 0;

    const benchmark: BenchmarkConfig = {
      skill_name: args.skillName || "unknown",
      iteration: args.iteration || 1,
      evals: evalResults,
    };

    writeJsonFile(join(args.workspaceDir, "benchmark.json"), benchmark);

    const bar = (rate: number, width = 20) => {
      const filled = Math.round(rate * width);
      return "█".repeat(filled) + "░".repeat(width - filled);
    };

    const pct = (v: number) => (v * 100).toFixed(1);
    let md = `# Benchmark: ${args.skillName || "unknown"}\n\n`;
    md += `**Iteration:** ${args.iteration || 1} | **Evals:** ${evalResults.length}\n\n`;
    md += `## Overall\n\n`;
    md += `| Metric | With Skill | Without Skill | Delta |\n`;
    md += `|--------|------------|--------------|-------|\n`;
    md += `| Pass Rate | ${pct(overallWith)}% | ${pct(overallWithout)}% | ${overallWith - overallWithout >= 0 ? "+" : ""}${pct(overallWith - overallWithout)}% |\n`;
    md += `| Avg Duration | ${(totalDurationWith / Math.max(evalCountWith, 1)).toFixed(0)}ms | ${(totalDurationWithout / Math.max(evalCountWithout, 1)).toFixed(0)}ms | ${(totalDurationWith / Math.max(evalCountWith, 1) - totalDurationWithout / Math.max(evalCountWithout, 1)).toFixed(0)}ms |\n\n`;

    md += `## Per-Eval Breakdown\n\n`;
    md += `| Eval | With Skill | Without Skill | Δ Pass Rate |\n`;
    md += `|------|------------|--------------|-------------|\n`;

    for (const ev of evalResults) {
      const deltaStr = ev.delta.pass_rate >= 0 ? `+${pct(ev.delta.pass_rate)}%` : `${pct(ev.delta.pass_rate)}%`;
      md += `| ${ev.eval_id} | ${pct(ev.with_skill.pass_rate)}% ${bar(ev.with_skill.pass_rate)} | ${pct(ev.without_skill.pass_rate)}% ${bar(ev.without_skill.pass_rate)} | ${deltaStr} |\n`;
    }

    md += `\n## Details\n\n`;
    for (const ev of evalResults) {
      md += `### ${ev.eval_id}\n`;
      md += `- With skill: ${ev.with_skill.passed}/${ev.with_skill.total} passed`;
      if (ev.with_skill.duration_ms) md += ` (${ev.with_skill.duration_ms}ms)`;
      md += `\n- Without skill: ${ev.without_skill.passed}/${ev.without_skill.total} passed`;
      if (ev.without_skill.duration_ms) md += ` (${ev.without_skill.duration_ms}ms)`;
      md += "\n\n";
    }

    writeFileSync(join(args.workspaceDir, "benchmark.md"), md, "utf-8");

    return {
      title: "Benchmark complete",
      output: md,
      metadata: {
        evals: evalResults.length,
        pass_rate_with: overallWith,
        pass_rate_without: overallWithout,
      },
    };
  },
});
