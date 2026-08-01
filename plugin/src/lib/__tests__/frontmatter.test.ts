import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import {
  parseFrontmatter,
  stripFrontmatter,
  validateName,
  validateDescription,
  validateSkill,
} from "../frontmatter.js";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "fs";
import { join } from "path";

describe("parseFrontmatter", () => {
  it("parses valid frontmatter", () => {
    const result = parseFrontmatter("---\nname: my-skill\ndescription: A test skill\n---\n# Body content");
    assert.ok(result);
    assert.equal(result!.name, "my-skill");
    assert.equal(result!.description, "A test skill");
  });

  it("returns null for no frontmatter", () => {
    assert.equal(parseFrontmatter("# Just body content"), null);
  });

  it("returns null for missing required fields", () => {
    assert.equal(parseFrontmatter("---\nname: my-skill\n---\nBody"), null);
  });

  it("handles quoted description", () => {
    const result = parseFrontmatter('---\nname: test\ndescription: "Quoted desc"\n---\nBody');
    assert.ok(result);
    assert.equal(result!.description, "Quoted desc");
  });

  it("parses multiline description", () => {
    const result = parseFrontmatter(
      "---\nname: test\ndescription: A longer description\n spanning multiple lines\n---\nBody",
    );
    assert.ok(result);
    assert.ok(result!.description.length > 0);
  });

  it("handles boolean values in frontmatter", () => {
    const result = parseFrontmatter("---\nname: my-skill\ndescription: A skill\nextra: true\n---\nBody");
    assert.ok(result);
    assert.equal(result!.name, "my-skill");
  });
});

describe("stripFrontmatter", () => {
  it("removes frontmatter", () => {
    assert.equal(stripFrontmatter("---\nname: x\ndescription: y\n---\nBody text"), "Body text");
  });

  it("returns original content when no frontmatter", () => {
    assert.equal(stripFrontmatter("Just body"), "Just body");
  });
});

describe("validateName", () => {
  it("accepts valid names", () => {
    assert.equal(validateName("my-skill"), true);
    assert.equal(validateName("a"), true);
    assert.equal(validateName("pdf-processor-v2"), true);
  });

  it("rejects invalid names", () => {
    assert.equal(validateName("My Skill"), false);
    assert.equal(validateName("my_skill"), false);
    assert.equal(validateName("-leading"), false);
    assert.equal(validateName("trailing-"), false);
    assert.equal(validateName("a".repeat(65)), false);
  });
});

describe("validateDescription", () => {
  it("accepts valid descriptions", () => {
    assert.equal(validateDescription("A ".repeat(5)), true);
    assert.equal(validateDescription("A".repeat(1024)), true);
  });

  it("rejects invalid descriptions", () => {
    assert.equal(validateDescription(""), false);
    assert.equal(validateDescription("short"), false);
    assert.equal(validateDescription("A".repeat(1025)), false);
    assert.equal(validateDescription(123), false);
    assert.equal(validateDescription(null), false);
    assert.equal(validateDescription(undefined), false);
  });
});

describe("validateSkill", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync("test-vs-");
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  function writeSkill(name: string, description: string, extra = ""): string {
    const dir = join(tmpDir, name);
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, "SKILL.md"),
      `---\nname: ${name}\ndescription: ${description}\n---\n# ${name}\n${extra}`,
      "utf-8",
    );
    return join(dir, "SKILL.md");
  }

  it("returns error for missing file", () => {
    const result = validateSkill("/nonexistent/path/SKILL.md");
    assert.equal(result.valid, false);
    assert.match(result.errors[0].message, /not found/);
  });

  it("passes for valid skill", () => {
    const path = writeSkill("my-tool", "Extracts and processes PDF files for data pipelines");
    const result = validateSkill(path);
    assert.equal(result.valid, true);
    assert.equal(result.frontmatter?.name, "my-tool");
  });

  it("rejects invalid frontmatter", () => {
    const dir = join(tmpDir, "bad-fm");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "SKILL.md"), "# No frontmatter here", "utf-8");
    const result = validateSkill(join(dir, "SKILL.md"));
    assert.equal(result.valid, false);
    assert.match(result.errors[0].message, /frontmatter/i);
  });

  it("rejects invalid name", () => {
    const dir = join(tmpDir, "Invalid Name");
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, "SKILL.md"),
      "---\nname: Invalid Name\ndescription: A description long enough to pass\n---\nBody",
      "utf-8",
    );
    const result = validateSkill(join(dir, "SKILL.md"));
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.field === "name"));
  });

  it("rejects short description", () => {
    const path = writeSkill("test", "Short");
    const result = validateSkill(path);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.field === "description"));
  });

  it("rejects directory name mismatch", () => {
    const dir = join(tmpDir, "wrong-name");
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, "SKILL.md"),
      "---\nname: actual-name\ndescription: A description that is long enough\n---\nBody",
      "utf-8",
    );
    const result = validateSkill(join(dir, "SKILL.md"));
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.field === "name"));
  });

  it("collects multiple errors at once", () => {
    const dir = join(tmpDir, "bad-name");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "SKILL.md"), "---\nname: bad-name\ndescription: short\n---\nBody", "utf-8");
    const result = validateSkill(join(dir, "SKILL.md"));
    assert.equal(result.valid, false);
    assert.equal(result.errors.length, 1);
    assert.equal(result.errors[0].field, "description");
  });
});
