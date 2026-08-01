import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";

export const SKILL_DIR_NAME = "opencode-skill-creator";

export const ASSET_LIST: string[] = [
  "SKILL.md",
  "agents/grader.md",
  "templates/SKILL.md.template",
  "templates/evals.json.template",
  "references/opencode-skill-spec.md",
  "references/schemas.md",
  "references/assertion-types.md",
];

export interface CopyAssetsResult {
  copied: string[];
  failed: string[];
}

function ensureDir(path: string): void {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

export function copyAssets(srcRoot: string, destRoot: string, opts: { failFast?: boolean } = {}): CopyAssetsResult {
  const copied: string[] = [];
  const failed: string[] = [];

  for (const asset of ASSET_LIST) {
    const srcPath = join(srcRoot, asset);
    const destPath = join(destRoot, asset);

    try {
      const content = readFileSync(srcPath, "utf-8");
      ensureDir(dirname(destPath));
      writeFileSync(destPath, content, "utf-8");
      copied.push(asset);
    } catch (e) {
      if (opts.failFast) {
        throw new Error(`[opencode-skill-creator] Could not copy asset ${asset}: ${e}`, {
          cause: e,
        });
      }
      failed.push(asset);
    }
  }

  return { copied, failed };
}
