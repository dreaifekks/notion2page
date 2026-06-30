import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { collectReferencedProperties } from "./engine/fields.js";

export async function loadConfig(configPath) {
  await loadDotEnv(path.resolve(process.cwd(), ".env"));

  const absolutePath = path.resolve(process.cwd(), configPath);

  try {
    await access(absolutePath);
  } catch {
    throw new Error(`Config file not found: ${absolutePath}`);
  }

  const moduleUrl = pathToFileURL(absolutePath).href;
  const imported = await import(`${moduleUrl}?t=${Date.now()}`);
  const config = imported.default ?? imported.config;

  if (!config || typeof config !== "object") {
    throw new Error(`Config file must export a default object: ${absolutePath}`);
  }

  validateConfig(config);
  config.__configPath = absolutePath;
  config.__referencedProperties = collectReferencedProperties(config);
  return config;
}

async function loadDotEnv(filePath) {
  let text;
  try {
    text = await readFile(filePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return;
    throw error;
  }

  for (const line of text.split(/\r?\n/)) {
    const entry = parseEnvLine(line);
    if (!entry) continue;

    const [key, value] = entry;
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function parseEnvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return undefined;

  const separator = trimmed.indexOf("=");
  if (separator <= 0) return undefined;

  const key = trimmed.slice(0, separator).trim();
  const value = unquoteEnvValue(trimmed.slice(separator + 1).trim());
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) return undefined;

  return [key, value];
}

function unquoteEnvValue(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function validateConfig(config) {
  if (!config.source || typeof config.source !== "object") {
    throw new Error("Config requires source.");
  }

  if (!config.source.type) {
    throw new Error("Config source requires type.");
  }

  if (config.source.type === "notion") {
    if (!config.source.token) {
      throw new Error("Notion source requires source.token or NOTION_TOKEN.");
    }
    if (!config.source.dataSourceId && !config.source.databaseId) {
      throw new Error("Notion source requires source.dataSourceId/source.databaseId or NOTION_DATA_SOURCE_ID/NOTION_DATABASE_ID.");
    }
  }

  if (config.source.type === "file" && !config.source.path) {
    throw new Error("File source requires source.path.");
  }

  if (config.project && typeof config.project !== "object") {
    throw new Error("Config project must be an object.");
  }

  if (config.groupBy && !Array.isArray(config.groupBy)) {
    throw new Error("Config groupBy must be an array.");
  }
}
