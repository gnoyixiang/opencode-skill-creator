import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "fs";
import { join } from "path";
import toolValidate from "../../tools/validate.js";
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
  tmpDir = mkdtempSync("test-validate-");
});

afterEach(() => {
  if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
});

function writeSkill(name: string, description: string, extra = ""): string {
  const dir = join(tmpDir, name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, "SKILL.md"),
    `---\nname: ${name}\ndescription: ${description}\n---\n# ${name}\n${extra}`,
    "utf-8",
  );
  return dir;
}

function writeRaw(content: string): string {
  const dir = join(tmpDir, "raw-test");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "SKILL.md"), content, "utf-8");
  return dir;
}

describe("skill_validate", () => {
  it("passes for valid SKILL.md", async () => {
    const dir = writeSkill("valid-skill", "A valid skill description for testing purposes");
    const result = await toolValidate.execute({ path: join(dir, "SKILL.md") }, mockContext);
    const output = typeof result === "string" ? result : result.output;
    assert.match(output, /VALID/);
  });

  it("rejects missing SKILL.md", async () => {
    const result = await toolValidate.execute({ path: join(tmpDir, "nonexistent", "SKILL.md") }, mockContext);
    const output = typeof result === "string" ? result : result.output;
    assert.match(output, /ERROR/);
  });

  it("rejects invalid name format", async () => {
    const dir = writeSkill("Invalid Name", "A test skill description for validation");
    const result = await toolValidate.execute({ path: join(dir, "SKILL.md") }, mockContext);
    const output = typeof result === "string" ? result : result.output;
    assert.match(output, /INVALID/);
    assert.match(output, /name/i);
  });

  it("rejects short description", async () => {
    const dir = writeSkill("test", "Short");
    const result = await toolValidate.execute({ path: join(dir, "SKILL.md") }, mockContext);
    const output = typeof result === "string" ? result : result.output;
    assert.match(output, /INVALID/);
    assert.match(output, /Description/);
  });

  it("rejects missing frontmatter entirely", async () => {
    const dir = writeRaw("# Just a markdown file\n\nNo frontmatter here.");
    const result = await toolValidate.execute({ path: join(dir, "SKILL.md") }, mockContext);
    const output = typeof result === "string" ? result : result.output;
    assert.match(output, /ERROR/);
    assert.match(output, /frontmatter/i);
  });

  it("rejects missing name field", async () => {
    const dir = writeRaw("---\nname:\ndescription: A description that is long enough to validate\n---\n# Body");
    const result = await toolValidate.execute({ path: join(dir, "SKILL.md") }, mockContext);
    const output = typeof result === "string" ? result : result.output;
    assert.match(output, /INVALID/);
    assert.match(output, /Missing required field/);
  });

  it("rejects missing description field", async () => {
    const dir = writeRaw("---\nname: my-skill\ndescription:\n---\n# Body");
    const result = await toolValidate.execute({ path: join(dir, "SKILL.md") }, mockContext);
    const output = typeof result === "string" ? result : result.output;
    assert.match(output, /INVALID/);
    assert.match(output, /Missing required field/);
  });

  it("rejects name mismatch with directory", async () => {
    const dir = join(tmpDir, "wrong-name");
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, "SKILL.md"),
      "---\nname: actual-name\ndescription: A description that is long enough to pass\n---\nBody",
      "utf-8",
    );
    const result = await toolValidate.execute({ path: join(dir, "SKILL.md") }, mockContext);
    const output = typeof result === "string" ? result : result.output;
    assert.match(output, /INVALID/);
    assert.match(output, /directory name/i);
  });

  it("accepts directory with SKILL.md when passed a dir path", async () => {
    const dir = writeSkill("valid-skill", "A valid skill description for testing purposes");
    const result = await toolValidate.execute({ path: dir }, mockContext);
    const output = typeof result === "string" ? result : result.output;
    assert.match(output, /VALID/);
  });
});
