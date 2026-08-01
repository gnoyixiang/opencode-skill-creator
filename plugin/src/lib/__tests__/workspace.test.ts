import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { existsSync, mkdtempSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { ensureDir, readJsonFile, writeJsonFile, readTextFile } from "../workspace.js";

let tmpDir = "";

beforeEach(() => {
  tmpDir = mkdtempSync("test-workspace-");
});

afterEach(() => {
  if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
});

describe("ensureDir", () => {
  it("creates a directory", () => {
    const dir = join(tmpDir, "a", "b", "c");
    assert.equal(existsSync(dir), false);
    ensureDir(dir);
    assert.equal(existsSync(dir), true);
  });

  it("does not throw for existing directory", () => {
    ensureDir(tmpDir);
    assert.doesNotThrow(() => ensureDir(tmpDir));
  });
});

describe("readJsonFile / writeJsonFile", () => {
  it("writes and reads JSON", () => {
    const data = { name: "test", values: [1, 2, 3] };
    const path = join(tmpDir, "data.json");
    writeJsonFile(path, data);
    assert.equal(existsSync(path), true);

    const result = readJsonFile<typeof data>(path);
    assert.deepEqual(result, data);
  });

  it("returns null for missing file", () => {
    assert.equal(readJsonFile("/nonexistent/file.json"), null);
  });

  it("returns null for invalid JSON", () => {
    const path = join(tmpDir, "bad.json");
    writeFileSync(path, "not json", "utf-8");
    assert.equal(readJsonFile(path), null);
  });
});

describe("readTextFile", () => {
  it("reads text file", () => {
    const path = join(tmpDir, "hello.txt");
    writeFileSync(path, "Hello, World!", "utf-8");
    assert.equal(readTextFile(path), "Hello, World!");
  });

  it("returns null for missing file", () => {
    assert.equal(readTextFile("/nonexistent/file.txt"), null);
  });
});
