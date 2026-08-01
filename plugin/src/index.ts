import type { Plugin } from "@opencode-ai/plugin";
import skillInit from "./tools/init";
import skillValidate from "./tools/validate";
import skillGrade from "./tools/grade";
import skillBenchmark from "./tools/benchmark";
import skillPackage from "./tools/package";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { ensureDir } from "./lib/workspace";

const __dirname = dirname(fileURLToPath(import.meta.url));

const ASSET_COPY_LIST: [string, string][] = [
  ["SKILL.md", "SKILL.md"],
  ["agents/grader.md", "agents/grader.md"],
  ["templates/SKILL.md.template", "templates/SKILL.md.template"],
  ["templates/evals.json.template", "templates/evals.json.template"],
  ["references/opencode-skill-spec.md", "references/opencode-skill-spec.md"],
  ["references/schemas.md", "references/schemas.md"],
  ["references/assertion-types.md", "references/assertion-types.md"],
];

export function copySkillAssets(skillDir: string, pluginDir = __dirname): void {
  for (const [src, dest] of ASSET_COPY_LIST) {
    const srcPath = join(pluginDir, src);
    const destPath = join(skillDir, dest);

    try {
      const content = readFileSync(srcPath, "utf-8");
      ensureDir(dirname(destPath));
      writeFileSync(destPath, content, "utf-8");
    } catch (e) {
      console.debug(`[skill-creator] Could not copy ${src}:`, e);
    }
  }
}

export function getDefaultSkillsDir(): string {
  const home = process.env.HOME || process.env.USERPROFILE || "~";
  return join(home, ".config", "opencode", "skills", "skill-creator");
}

export const SkillCreatorPlugin: Plugin = async () => {
  const skillsDir = getDefaultSkillsDir();

  if (!existsSync(join(skillsDir, "SKILL.md"))) {
    ensureDir(skillsDir);
    copySkillAssets(skillsDir);
  }

  return {
    tool: {
      skill_init: skillInit,
      skill_validate: skillValidate,
      skill_grade: skillGrade,
      skill_benchmark: skillBenchmark,
      skill_package: skillPackage,
    },
  };
};
