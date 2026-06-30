import { readFile } from "node:fs/promises";
import path from "node:path";
import { normalizePlainRecord } from "../source/normalize.js";

export async function readFileSource(config) {
  const filePath = path.resolve(process.cwd(), config.source.path);
  const json = JSON.parse(await readFile(filePath, "utf8"));
  const rows = Array.isArray(json) ? json : json.items ?? json.results ?? json.pages;

  if (!Array.isArray(rows)) {
    throw new Error(`File source must contain an array: ${filePath}`);
  }

  return {
    items: rows.map((row, index) => normalizePlainRecord(row, index)),
    meta: {
      sourceType: "file",
      sourcePath: filePath
    }
  };
}
