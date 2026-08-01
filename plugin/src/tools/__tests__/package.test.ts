import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { mkdtempSync, writeFileSync, mkdirSync, existsSync, rmSync } from "fs";
import { join } from "path";
import toolPackage from "../../tools/package.js";
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
  tmpDir = mkdtempSync("test-pkg-");
});

afterEach(() => {
  if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
});

describe("skill_package", () => {
  it("packages a valid skill directory", async () => {
    const skillDir = join(tmpDir, "my-skill");
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(join(skillDir, "SKILL.md"), "---\nname: my-skill\ndescription: A test skill\n---\nBody", "utf-8");

    const outputDir = join(tmpDir, "output");
    mkdirSync(outputDir, { recursive: true });

    const result = await toolPackage.execute({ skillPath: skillDir, output: outputDir }, mockContext);
    const output = typeof result === "string" ? result : result.output;

    assert.match(output, /Packaged/);
    assert.equal(existsSync(join(outputDir, "my-skill.tar.gz")), true);
  });

  it("packages to parent dir when output not specified", async () => {
    const skillDir = join(tmpDir, "default-output");
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(
      join(skillDir, "SKILL.md"),
      "---\nname: default-output\ndescription: A test skill\n---\nBody",
      "utf-8",
    );

    const result = await toolPackage.execute({ skillPath: skillDir }, mockContext);
    const output = typeof result === "string" ? result : result.output;
    assert.match(output, /Packaged/);
  });

  it("errors on missing SKILL.md", async () => {
    const result = await toolPackage.execute({ skillPath: join(tmpDir, "nonexistent") }, mockContext);
    const output = typeof result === "string" ? result : result.output;
    assert.match(output, /No SKILL.md/);
  });

  it("errors on path with trailing slash producing empty name", async () => {
    const skillDir = join(tmpDir, "empty-name");
    const result = await toolPackage.execute({ skillPath: skillDir + "///" }, mockContext);
    const output = typeof result === "string" ? result : result.output;
    assert.match(output, /Cannot determine skill name/);
  });
});
