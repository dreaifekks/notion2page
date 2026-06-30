import { readFileSource } from "./file.js";
import { readNotionSource } from "./notion.js";

export async function readSource(config) {
  if (config.source.type === "file") {
    return readFileSource(config);
  }

  if (config.source.type === "notion") {
    return readNotionSource(config);
  }

  throw new Error(`Unsupported source type "${config.source.type}".`);
}
