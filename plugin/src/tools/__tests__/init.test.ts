import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "fs";
import { join } from "path";
import toolInit from "../../tools/init.js";
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
  tmpDir = mkdtempSync("test-init-");
});

afterEach(() => {
  if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
});

describe("skill_init", () => {
  it("creates a skill directory with SKILL.md", async () => {
    const result = await toolInit.execute(
      { name: "test-skill", description: "A test skill for unit tests", path: tmpDir },
      mockContext,
    );

    const output = typeof result === "string" ? result : result.output;
    assert.match(output, /Created skill at/);

    const skillPath = join(tmpDir, "test-skill");
    assert.equal(existsSync(join(skillPath, "SKILL.md")), true);
  });

  it("creates resource directories when specified", async () => {
    await toolInit.execute(
      { name: "test-with-resources", path: tmpDir, resources: ["scripts", "references"] },
      mockContext,
    );

    const skillPath = join(tmpDir, "test-with-resources");
    assert.equal(existsSync(join(skillPath, "scripts")), true);
    assert.equal(existsSync(join(skillPath, "references")), true);
    assert.equal(existsSync(join(skillPath, "assets")), false);
  });

  it("rejects existing directory", async () => {
    await toolInit.execute({ name: "existing-skill", path: tmpDir }, mockContext);
    const result2 = await toolInit.execute({ name: "existing-skill", path: tmpDir }, mockContext);
    const output = typeof result2 === "string" ? result2 : result2.output;
    assert.match(output, /already exists/);
  });

  it("generates SKILL.md with correct name", async () => {
    await toolInit.execute({ name: "my-pdf-skill", path: tmpDir }, mockContext);
    const content = readFileSync(join(tmpDir, "my-pdf-skill", "SKILL.md"), "utf-8");
    assert.match(content, /name: my-pdf-skill/);
  });
});
