import { tool } from "@opencode-ai/plugin";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { parseFrontmatter, validateName, validateDescription } from "../lib/frontmatter";

export default tool({
  description: "Validate a SKILL.md file for correctness",
  args: {
    path: tool.schema.string().describe("Path to the skill directory or SKILL.md file"),
  },
  async execute(args) {
    const skmdPath = args.path.endsWith("SKILL.md") ? args.path : join(args.path, "SKILL.md");

    if (!existsSync(skmdPath)) {
      return { title: "Validation failed", output: `ERROR: No SKILL.md found at ${skmdPath}` };
    }

    const content = readFileSync(skmdPath, "utf-8");
    const frontmatter = parseFrontmatter(content);

    if (!frontmatter) {
      return {
        title: "Validation failed",
        output: `ERROR: Missing or invalid YAML frontmatter in ${skmdPath}\n\nSKILL.md must start with:\n---\nname: skill-name\ndescription: Description of the skill\n---`,
      };
    }

    const errors: string[] = [];

    if (!frontmatter.name) {
      errors.push("Missing required field: name");
    } else if (!validateName(frontmatter.name)) {
      errors.push(
        `Invalid name "${frontmatter.name}". Use lowercase letters, digits, and hyphens only. Max 64 characters.`,
      );
    }

    if (!frontmatter.description) {
      errors.push("Missing required field: description");
    } else if (!validateDescription(frontmatter.description)) {
      errors.push(`Description must be between 10 and 1024 characters (currently ${frontmatter.description.length})`);
    }

    const dirName = skmdPath.split("/").slice(-2)[0];
    if (dirName && frontmatter.name && dirName !== frontmatter.name) {
      errors.push(`Directory name "${dirName}" does not match skill name "${frontmatter.name}"`);
    }

    if (errors.length === 0) {
      const desc =
        frontmatter.description.length > 80 ? frontmatter.description.slice(0, 80) + "..." : frontmatter.description;
      return {
        title: "Validation passed",
        output: `VALID: SKILL.md at ${skmdPath}\n  name: ${frontmatter.name}\n  description: ${desc}`,
      };
    }

    return {
      title: "Validation failed",
      output: `INVALID: ${errors.length} issue(s) found in ${skmdPath}\n\n${errors.map((e) => `  - ${e}`).join("\n")}`,
    };
  },
});
