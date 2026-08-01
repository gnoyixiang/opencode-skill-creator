import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

export const PLUGIN_NAME = "opencode-skill-creator";

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
  npx opencode-skill-creator install [--global|--project]
  npx opencode-skill-creator install --help

COMMANDS
  install   Install the plugin into opencode config

FLAGS
  --global   Install globally (~/.config/opencode/opencode.json)  [default]
  --project  Install in current project (.opencode/opencode.json)
  --help     Show this help
`);
}

export function installGlobal(configPath: string): string {
  const config = getConfig(configPath);
  const plugins = listPlugins(config);

  if (plugins.includes(PLUGIN_NAME)) {
    return `${PLUGIN_NAME} is already installed globally.`;
  }

  config.plugin = [...plugins, PLUGIN_NAME];
  writeConfig(configPath, config);
  return `Installed ${PLUGIN_NAME} into ${configPath}`;
}

export function installProject(projectDir: string): string {
  const projectConfigPath = join(projectDir, ".opencode", "opencode.json");
  const config = getConfig(projectConfigPath);
  const plugins = listPlugins(config);

  if (plugins.includes(PLUGIN_NAME)) {
    return `${PLUGIN_NAME} is already installed in this project.`;
  }

  config.plugin = [...plugins, PLUGIN_NAME];
  writeConfig(projectConfigPath, config);
  return `Installed ${PLUGIN_NAME} into ${projectConfigPath}`;
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

if (import.meta.url.startsWith("file://") && process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const result = main(process.argv.slice(2));
  if (result) console.log(`✓ ${result}`);
}
