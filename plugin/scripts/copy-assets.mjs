#!/usr/bin/env node
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const pluginRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(pluginRoot, "..");
const distDir = join(pluginRoot, "dist");

const { copyAssets } = await import("../dist/lib/assets.js");

const { copied, failed } = copyAssets(repoRoot, distDir, { failFast: true });

console.log(`[copy-assets] Copied ${copied.length} assets into dist/:`);
for (const asset of copied) {
  console.log(`  ${asset}`);
}

if (failed.length > 0) {
  console.error(`[copy-assets] Missing source assets:\n${failed.map((a) => `  ${a}`).join("\n")}`);
  process.exit(1);
}
