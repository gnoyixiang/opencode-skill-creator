#!/usr/bin/env node
import { spawnSync } from "child_process";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const pluginRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const { ASSET_LIST } = await import("../dist/lib/assets.js");

const result = spawnSync("npm", ["pack", "--dry-run", "--json"], {
  cwd: pluginRoot,
  encoding: "utf-8",
});

if (result.status !== 0) {
  console.error(`[verify-tarball] npm pack failed:\n${result.stderr}`);
  process.exit(1);
}

let packInfo;
try {
  packInfo = JSON.parse(result.stdout);
} catch (e) {
  console.error(`[verify-tarball] Could not parse npm pack output: ${e}`);
  process.exit(1);
}

const tarballFiles = new Set();
for (const pkg of packInfo) {
  for (const file of pkg.files) {
    tarballFiles.add(file.path);
  }
}

const missing = ASSET_LIST.filter((asset) => !tarballFiles.has(`dist/${asset}`));

if (missing.length > 0) {
  console.error(`[verify-tarball] Tarball is missing skill assets:\n${missing.map((a) => `  ${a}`).join("\n")}`);
  process.exit(1);
}

console.log(`[verify-tarball] OK: ${ASSET_LIST.length}/${ASSET_LIST.length} skill assets present in tarball.`);