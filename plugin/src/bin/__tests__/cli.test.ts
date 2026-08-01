import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { existsSync, mkdtempSync, writeFileSync, readFileSync, rmSync } from "fs";
import { join } from "path";
import { installGlobal, installProject, listPlugins, getConfig, writeConfig, PLUGIN_NAME } from "../../bin/cli.js";

let tmpDir = "";

beforeEach(() => {
  tmpDir = mkdtempSync("test-cli-");
});

afterEach(() => {
  if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
});

describe("getConfig", () => {
  it("returns empty object for missing file", () => {
    const result = getConfig(join(tmpDir, "nonexistent.json"));
    assert.deepEqual(result, {});
  });

  it("parses existing config", () => {
    const configPath = join(tmpDir, "opencode.json");
    writeFileSync(configPath, JSON.stringify({ plugin: ["test"] }), "utf-8");
    const result = getConfig(configPath);
    assert.deepEqual(result, { plugin: ["test"] });
  });
});

describe("writeConfig", () => {
  it("writes config file creating intermediate dirs", () => {
    const configPath = join(tmpDir, "a", "b", "config.json");
    writeConfig(configPath, { plugin: ["my-plugin"] });
    assert.equal(existsSync(configPath), true);
    const parsed = JSON.parse(readFileSync(configPath, "utf-8"));
    assert.deepEqual(parsed, { plugin: ["my-plugin"] });
  });
});

describe("listPlugins", () => {
  it("returns plugins array", () => {
    assert.deepEqual(listPlugins({ plugin: ["a", "b"] }), ["a", "b"]);
  });

  it("returns empty array when no plugin key", () => {
    assert.deepEqual(listPlugins({}), []);
  });

  it("returns empty array when plugin is not an array", () => {
    assert.deepEqual(listPlugins({ plugin: "string" }), []);
  });
});

describe("installGlobal", () => {
  it("adds plugin to existing config", () => {
    const configPath = join(tmpDir, "opencode.json");
    writeConfig(configPath, { plugin: ["other-plugin"] });

    const msg = installGlobal(configPath);
    assert.match(msg, /Installed/);

    const config = getConfig(configPath);
    assert.deepEqual(config.plugin, ["other-plugin", PLUGIN_NAME]);
  });

  it("creates config if missing", () => {
    const configPath = join(tmpDir, "opencode.json");
    const msg = installGlobal(configPath);
    assert.match(msg, /Installed/);

    const config = getConfig(configPath);
    assert.deepEqual(config.plugin, [PLUGIN_NAME]);
  });

  it("reports already installed", () => {
    const configPath = join(tmpDir, "opencode.json");
    writeConfig(configPath, { plugin: [PLUGIN_NAME] });

    const msg = installGlobal(configPath);
    assert.match(msg, /already installed/);
  });
});

describe("installProject", () => {
  it("adds plugin to project config", () => {
    const msg = installProject(tmpDir);
    assert.match(msg, /Installed/);
    assert.equal(existsSync(join(tmpDir, ".opencode", "opencode.json")), true);
  });

  it("reports already installed", () => {
    installProject(tmpDir);
    const msg = installProject(tmpDir);
    assert.match(msg, /already installed/);
  });

  it("adds to existing plugins in project config", () => {
    const configPath = join(tmpDir, ".opencode", "opencode.json");
    writeConfig(configPath, { plugin: ["existing"] });

    const msg = installProject(tmpDir);
    assert.match(msg, /Installed/);

    const config = getConfig(configPath);
    assert.deepEqual(config.plugin, ["existing", PLUGIN_NAME]);
  });
});
