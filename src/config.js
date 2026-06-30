import { access } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { collectReferencedProperties } from "./engine/fields.js";

export async function loadConfig(configPath) {
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
