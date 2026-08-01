#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, realpathSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

export const PLUGIN_NAME = "@gnoyx/opencode-skill-creator";

export function getCurrentVersion(): string {
  const packageJsonPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "package.json");
  return JSON.parse(readFileSync(packageJsonPath, "utf-8")).version;
}

export function getConfig(configPath: string): Record<string, unknown> {
  try {
    return JSON.parse(readFileSync(configPath, "utf-8"));
  } catch {
    return {};
  }
}

export function writeConfig(configPath: string, config: Record<string, unknown>): void {
  mkdirSync(dirname(configPath), { recursive: true });
  writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8");
}

export function listPlugins(config: Record<string, unknown>): string[] {
  const plugins = config.plugin;
  if (Array.isArray(plugins)) {
    return plugins.map((p) => String(p));
  }
  return [];
}

export function printHelp(): void {
  console.log(`
opencode-skill-creator — Skill creation tools for OpenCode

USAGE
  npx @gnoyx/opencode-skill-creator install [--global|--project]
  npx @gnoyx/opencode-skill-creator install --help

COMMANDS
  install   Install the plugin into opencode config

FLAGS
  --global   Install globally (~/.config/opencode/opencode.json)  [default]
  --project  Install in current project (.opencode/opencode.json)
  --help     Show this help
`);
}

export function getPluginEntry(version?: string): string {
  return version ? `${PLUGIN_NAME}@${version}` : PLUGIN_NAME;
}

export function parsePluginEntry(entry: string): { name: string; version: string | null } {
  const match = entry.match(/^(@?[^@]+)@(.+)$/);
  return match ? { name: match[1], version: match[2] } : { name: entry, version: null };
}

export function installGlobal(configPath: string): string {
  const config = getConfig(configPath);
  const plugins = listPlugins(config);
  const version = getCurrentVersion();
  const newEntry = getPluginEntry(version);

  const existingIndex = plugins.findIndex((p) => parsePluginEntry(p).name === PLUGIN_NAME);
  if (existingIndex >= 0) {
    const existing = parsePluginEntry(plugins[existingIndex]);
    if (existing.version === version) {
      return `${PLUGIN_NAME} is already installed at v${version}.`;
    }
    plugins[existingIndex] = newEntry;
    config.plugin = plugins;
    writeConfig(configPath, config);
    return `Updated ${PLUGIN_NAME} from v${existing.version} to v${version} in ${configPath}`;
  }

  config.plugin = [...plugins, newEntry];
  writeConfig(configPath, config);
  return `Installed ${PLUGIN_NAME}@${version} into ${configPath}`;
}

export function installProject(projectDir: string): string {
  const projectConfigPath = join(projectDir, ".opencode", "opencode.json");
  const config = getConfig(projectConfigPath);
  const plugins = listPlugins(config);
  const version = getCurrentVersion();
  const newEntry = getPluginEntry(version);

  const existingIndex = plugins.findIndex((p) => parsePluginEntry(p).name === PLUGIN_NAME);
  if (existingIndex >= 0) {
    const existing = parsePluginEntry(plugins[existingIndex]);
    if (existing.version === version) {
      return `${PLUGIN_NAME} is already installed at v${version}.`;
    }
    plugins[existingIndex] = newEntry;
    config.plugin = plugins;
    writeConfig(projectConfigPath, config);
    return `Updated ${PLUGIN_NAME} from v${existing.version} to v${version} in ${projectConfigPath}`;
  }

  config.plugin = [...plugins, newEntry];
  writeConfig(projectConfigPath, config);
  return `Installed ${PLUGIN_NAME}@${version} into ${projectConfigPath}`;
}

export function parseArgs(args: string[]): { command: string; flags: string[] } {
  const cmd = args[0] || "";
  const flags = args.slice(1);
  return { command: cmd, flags };
}

export function main(args: string[]): string | null {
  const { command, flags } = parseArgs(args);

  if (!command || command === "--help" || command !== "install") {
    printHelp();
    return null;
  }

  if (flags.includes("--project")) {
    return installProject(process.cwd());
  }

  const home = process.env.HOME || process.env.USERPROFILE || "~";
  const globalConfigPath = join(home, ".config", "opencode", "opencode.json");
  return installGlobal(globalConfigPath);
}

const isMainModule =
  import.meta.url.startsWith("file://") &&
  process.argv[1] &&
  fileURLToPath(import.meta.url) === realpathSync(process.argv[1]);

if (isMainModule) {
  const result = main(process.argv.slice(2));
  if (result) console.log(`✓ ${result}`);
}
