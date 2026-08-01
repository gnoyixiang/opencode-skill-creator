import type { Plugin } from "@opencode-ai/plugin";
import skillInit from "./tools/init";
import skillValidate from "./tools/validate";
import skillGrade from "./tools/grade";
import skillBenchmark from "./tools/benchmark";
import skillPackage from "./tools/package";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { ensureDir } from "./lib/workspace";
import { copyAssets, SKILL_DIR_NAME } from "./lib/assets";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function copySkillAssets(skillDir: string, pluginDir = __dirname): void {
  const { failed } = copyAssets(pluginDir, skillDir, { failFast: false });
  for (const asset of failed) {
    console.debug(`[opencode-skill-creator] Could not copy ${asset}`);
  }
}

export function getDefaultSkillsDir(): string {
  const home = process.env.HOME || process.env.USERPROFILE || "~";
  return join(home, ".config", "opencode", "skills", SKILL_DIR_NAME);
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
