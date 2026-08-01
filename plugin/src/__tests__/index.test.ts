import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { mkdtempSync, writeFileSync, mkdirSync, existsSync, rmSync } from "fs";
import { join } from "path";
import { copySkillAssets, SkillCreatorPlugin } from "../index.js";

let tmpDir = "";

beforeEach(() => {
  tmpDir = mkdtempSync("test-plugin-");
});

afterEach(() => {
  if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
});

describe("copySkillAssets", () => {
  it("copies SKILL.md to the target directory", () => {
    mkdirSync(join(tmpDir, "skill-dir"), { recursive: true });
    writeFileSync(join(tmpDir, "SKILL.md"), "---\nname: opencode-skill-creator\ndescription: test\n---\nBody", "utf-8");
    mkdirSync(join(tmpDir, "agents"), { recursive: true });
    writeFileSync(join(tmpDir, "agents", "grader.md"), "# Grader", "utf-8");
    mkdirSync(join(tmpDir, "templates"), { recursive: true });
    writeFileSync(join(tmpDir, "templates", "SKILL.md.template"), "# Template", "utf-8");
    writeFileSync(join(tmpDir, "templates", "evals.json.template"), "{}", "utf-8");
    mkdirSync(join(tmpDir, "references"), { recursive: true });
    writeFileSync(join(tmpDir, "references", "opencode-skill-spec.md"), "# Spec", "utf-8");
    writeFileSync(join(tmpDir, "references", "schemas.md"), "# Schema", "utf-8");
    writeFileSync(join(tmpDir, "references", "assertion-types.md"), "# Types", "utf-8");

    const targetDir = join(tmpDir, "target");
    copySkillAssets(targetDir, tmpDir);

    assert.equal(existsSync(join(targetDir, "SKILL.md")), true);
    assert.equal(existsSync(join(targetDir, "agents", "grader.md")), true);
    assert.equal(existsSync(join(targetDir, "references", "schemas.md")), true);
  });

  it("creates intermediate directories", () => {
    writeFileSync(join(tmpDir, "SKILL.md"), "---\nname: x\ndescription: y\n---\nBody", "utf-8");
    mkdirSync(join(tmpDir, "agents"), { recursive: true });
    writeFileSync(join(tmpDir, "agents", "grader.md"), "# Grader", "utf-8");

    const targetDir = join(tmpDir, "nested", "deep", "target");
    copySkillAssets(targetDir, tmpDir);

    assert.equal(existsSync(join(targetDir, "SKILL.md")), true);
  });

  it("handles missing source files gracefully", () => {
    const targetDir = join(tmpDir, "target");
    // Don't create any source files — every copy will fail
    assert.doesNotThrow(() => copySkillAssets(targetDir, tmpDir));
  });
});

describe("SkillCreatorPlugin", () => {
  it("returns an object with tool property", async () => {
    const result = await SkillCreatorPlugin({} as never);

    assert.ok(result);
    assert.ok(result.tool);
    assert.ok(result.tool.skill_init);
    assert.ok(result.tool.skill_validate);
    assert.ok(result.tool.skill_grade);
    assert.ok(result.tool.skill_benchmark);
    assert.ok(result.tool.skill_package);
  });

  it("has exactly 5 tools", async () => {
    const result = await SkillCreatorPlugin({} as never);
    const toolNames = Object.keys(result.tool || {});
    assert.equal(toolNames.length, 5);
    assert.deepEqual(toolNames.sort(), [
      "skill_benchmark",
      "skill_grade",
      "skill_init",
      "skill_package",
      "skill_validate",
    ]);
  });
});
