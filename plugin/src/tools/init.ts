import { tool } from "@opencode-ai/plugin";
import { existsSync, writeFileSync } from "fs";
import { join } from "path";
import { ensureDir } from "../lib/workspace";

const SKILL_TEMPLATE = `---
name: <<SKILL_NAME>>
description: <<SKILL_DESCRIPTION>>
---

# <<SKILL_NAME>>

## What I do

Write a brief description of what this skill enables the agent to do.

## When to use this skill

List specific triggers and contexts where this skill should be activated.

## Instructions

Write clear, concise instructions for the agent to follow.

## Examples

Provide concrete examples showing the skill in action.

## References

- \`references/\` — Documentation and reference material
- \`scripts/\` — Executable scripts
- \`assets/\` — Output resources
`;

export default tool({
  description: "Initialize a new skill directory from a template",
  args: {
    name: tool.schema
      .string()
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, digits, and hyphens only")
      .max(64)
      .describe("Skill name (lowercase, hyphens, max 64 chars)"),
    path: tool.schema.string().optional().describe("Output directory (defaults to current directory)"),
    resources: tool.schema
      .array(tool.schema.enum(["scripts", "references", "assets"]))
      .optional()
      .describe("Resource subdirectories to create"),
    description: tool.schema.string().optional().describe("Short description for frontmatter"),
  },
  async execute(args, context) {
    const basePath = args.path || context.directory || ".";
    const skillPath = join(basePath, args.name);

    if (existsSync(skillPath)) {
      return {
        title: "Skill already exists",
        output: `Skill directory already exists at ${skillPath}. Choose a different name or path.`,
      };
    }

    ensureDir(skillPath);

    const description = args.description || "A skill that needs a description. Update this frontmatter field.";

    const skmd = SKILL_TEMPLATE.replace(/<<SKILL_NAME>>/g, args.name).replace(/<<SKILL_DESCRIPTION>>/g, description);

    writeFileSync(join(skillPath, "SKILL.md"), skmd, "utf-8");

    if (args.resources) {
      for (const dir of args.resources) {
        ensureDir(join(skillPath, dir));
      }
    }

    const created = ["SKILL.md", ...(args.resources || [])];
    const fileList = created.map((f) => `  ${skillPath}/${f}`).join("\n");
    return { title: "Skill created", output: `Created skill at ${skillPath}\n\nFiles:\n${fileList}` };
  },
});
