import { readFileSync, existsSync } from "fs";

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n?/;

export interface SkillFrontmatter {
  name: string;
  description: string;
  [key: string]: unknown;
}

export interface ValidationError {
  field: string;
  message: string;
}

function parseYamlSimple(text: string): Record<string, unknown> | null {
  const result: Record<string, unknown> = {};

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const colonIndex = trimmed.indexOf(":");
    if (colonIndex === -1) continue;

    const key = trimmed.slice(0, colonIndex).trim();
    const value = trimmed.slice(colonIndex + 1).trim();
    if (!key) continue;

    result[key] = parseYamlValue(value);
  }

  return result;
}

function parseYamlValue(value: string): unknown {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null") return null;
  if (/^\d+$/.test(value)) return parseInt(value, 10);
  if (/^\d+\.\d+$/.test(value)) return parseFloat(value);

  const dq = value.match(/^"([^"]*)"$/);
  if (dq) return dq[1];
  const sq = value.match(/^'([^']*)'$/);
  if (sq) return sq[1];

  return value;
}

export function parseFrontmatter(content: string): SkillFrontmatter | null {
  const match = content.match(FRONTMATTER_RE);
  if (!match) return null;

  const yamlText = match[1];
  const parsed = parseYamlSimple(yamlText);
  if (!parsed) return null;

  if (typeof parsed.name !== "string" || typeof parsed.description !== "string") {
    return null;
  }

  return parsed as SkillFrontmatter;
}

export function stripFrontmatter(content: string): string {
  return content.replace(FRONTMATTER_RE, "");
}

export function validateName(name: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(name) && name.length <= 64;
}

export function validateDescription(value: unknown): boolean {
  return typeof value === "string" && value.length >= 10 && value.length <= 1024;
}

export interface ValidationResult {
  valid: boolean;
  frontmatter: SkillFrontmatter | null;
  errors: ValidationError[];
}

export function validateSkill(skmdPath: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (!existsSync(skmdPath)) {
    return {
      valid: false,
      frontmatter: null,
      errors: [{ field: "file", message: `SKILL.md not found at ${skmdPath}` }],
    };
  }

  const content = readFileSync(skmdPath, "utf-8");
  const frontmatter = parseFrontmatter(content);
  if (!frontmatter) {
    errors.push({ field: "frontmatter", message: "Missing or invalid YAML frontmatter" });
    return { valid: false, frontmatter: null, errors };
  }

  if (!validateName(frontmatter.name)) {
    errors.push({
      field: "name",
      message: `Invalid name "${frontmatter.name}". Use lowercase letters, digits, and hyphens only. Max 64 characters.`,
    });
  }

  if (!validateDescription(frontmatter.description)) {
    errors.push({
      field: "description",
      message: `Description must be between 10 and 1024 characters (got ${frontmatter.description.length})`,
    });
  }

  const dirName = skmdPath.split("/").slice(-2)[0];
  if (dirName && frontmatter.name && dirName !== frontmatter.name) {
    errors.push({
      field: "name",
      message: `Directory name "${dirName}" does not match skill name "${frontmatter.name}"`,
    });
  }

  return { valid: errors.length === 0, frontmatter, errors };
}
