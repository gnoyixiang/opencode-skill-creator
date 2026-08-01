import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { mkdtempSync, writeFileSync, mkdirSync, existsSync, rmSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { ASSET_LIST, copyAssets, SKILL_DIR_NAME } from "../assets.js";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");

let tmpDir = "";

beforeEach(() => {
  tmpDir = mkdtempSync("test-assets-");
});

afterEach(() => {
  if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
});

function writeSourceTree(root: string): void {
  writeFileSync(join(root, "SKILL.md"), "---\nname: opencode-skill-creator\ndescription: test\n---\nBody", "utf-8");
  mkdirSync(join(root, "agents"), { recursive: true });
  writeFileSync(join(root, "agents", "grader.md"), "# Grader", "utf-8");
  mkdirSync(join(root, "templates"), { recursive: true });
  writeFileSync(join(root, "templates", "SKILL.md.template"), "# Template", "utf-8");
  writeFileSync(join(root, "templates", "evals.json.template"), "{}", "utf-8");
  mkdirSync(join(root, "references"), { recursive: true });
  writeFileSync(join(root, "references", "opencode-skill-spec.md"), "# Spec", "utf-8");
  writeFileSync(join(root, "references", "schemas.md"), "# Schema", "utf-8");
  writeFileSync(join(root, "references", "assertion-types.md"), "# Types", "utf-8");
}

describe("ASSET_LIST", () => {
  it("ships the exact set of skill assets", () => {
    assert.deepEqual(ASSET_LIST, [
      "SKILL.md",
      "agents/grader.md",
      "templates/SKILL.md.template",
      "templates/evals.json.template",
      "references/opencode-skill-spec.md",
      "references/schemas.md",
      "references/assertion-types.md",
    ]);
  });

  it("every asset exists at the repo root (ships in dist after build)", () => {
    for (const asset of ASSET_LIST) {
      assert.equal(existsSync(join(REPO_ROOT, asset)), true, `missing repo asset: ${asset}`);
    }
  });
});

describe("SKILL_DIR_NAME", () => {
  it("matches the skill frontmatter name", () => {
    assert.equal(SKILL_DIR_NAME, "opencode-skill-creator");
  });
});

describe("copyAssets", () => {
  it("copies all assets into the target directory", () => {
    writeSourceTree(tmpDir);
    const targetDir = join(tmpDir, "target");
    const result = copyAssets(tmpDir, targetDir);

    assert.equal(result.failed.length, 0);
    assert.equal(result.copied.length, ASSET_LIST.length);
    for (const asset of ASSET_LIST) {
      assert.equal(existsSync(join(targetDir, asset)), true);
    }
  });

  it("throws with failFast when a source is missing", () => {
    const targetDir = join(tmpDir, "target");
    assert.throws(() => copyAssets(tmpDir, targetDir, { failFast: true }), /Could not copy asset/);
  });

  it("skips missing sources without failing by default", () => {
    const targetDir = join(tmpDir, "target");
    const result = copyAssets(tmpDir, targetDir);
    assert.equal(result.copied.length, 0);
    assert.equal(result.failed.length, ASSET_LIST.length);
  });
});
