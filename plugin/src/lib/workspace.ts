import { existsSync, mkdirSync } from "fs";
import { readFileSync, writeFileSync } from "fs";

export function ensureDir(path: string): void {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

export function readJsonFile<T>(path: string): T | null {
  try {
    const content = readFileSync(path, "utf-8");
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

export function writeJsonFile(path: string, data: unknown): void {
  ensureDir(path.split("/").slice(0, -1).join("/"));
  writeFileSync(path, JSON.stringify(data, null, 2), "utf-8");
}

export function readTextFile(path: string): string | null {
  try {
    return readFileSync(path, "utf-8");
  } catch {
    return null;
  }
}
