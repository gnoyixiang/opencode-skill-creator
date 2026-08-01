import { tool } from "@opencode-ai/plugin";
import { spawnSync } from "child_process";
import { existsSync, statSync } from "fs";
import { join } from "path";
import { ensureDir } from "../lib/workspace";

export default tool({
  description: "Package a skill directory into a distributable .tar.gz archive",
  args: {
    skillPath: tool.schema.string().describe("Path to the skill directory to package"),
    output: tool.schema
      .string()
      .optional()
      .describe("Output directory for the package (defaults to parent of skillPath)"),
  },
  async execute(args) {
    const skillPath = args.skillPath;
    const outputDir = args.output || join(skillPath, "..");

    const skillName = skillPath.split("/").pop();
    if (!skillName) {
      return { title: "Package error", output: `Cannot determine skill name from path: ${skillPath}` };
    }

    if (!existsSync(join(skillPath, "SKILL.md"))) {
      return {
        title: "Package error",
        output: `No SKILL.md found at ${join(skillPath, "SKILL.md")}. Is this a valid skill directory?`,
      };
    }

    ensureDir(outputDir);
    const outputPath = join(outputDir, `${skillName}.tar.gz`);

    const result = spawnSync("tar", ["-czf", outputPath, "-C", join(skillPath, ".."), skillName], {
      stdio: "pipe",
    });

    if (result.status !== 0) {
      return {
        title: "Package error",
        output: `Packaging failed. tar exited with code ${result.status}. Ensure tar is available.`,
      };
    }

    const size = statSync(outputPath).size;
    const sizeStr = size > 1024 * 1024 ? `${(size / 1024 / 1024).toFixed(1)} MB` : `${(size / 1024).toFixed(1)} KB`;

    return {
      title: "Package complete",
      output: `Packaged ${skillName} → ${outputPath} (${sizeStr})`,
      metadata: { path: outputPath, size: sizeStr },
    };
  },
});
