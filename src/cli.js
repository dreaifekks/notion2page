#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadConfig } from "./config.js";
import { readSource } from "./source/index.js";
import { buildPageModel } from "./engine/model.js";
import { renderHtml } from "./renderer/html.js";
import { renderCss } from "./renderer/css.js";

const args = process.argv.slice(2);

main().catch((error) => {
  console.error(`notion2page: ${error.message}`);
  if (process.env.DEBUG) {
    console.error(error);
  }
  process.exitCode = 1;
});

async function main() {
  const command = args[0] && !args[0].startsWith("-") ? args[0] : "build";

  if (command === "help" || hasFlag("--help") || hasFlag("-h")) {
    printHelp();
    return;
  }

  if (command !== "build") {
    throw new Error(`Unknown command "${command}". Run "node src/cli.js help".`);
  }

  const options = parseOptions(args.slice(command === "build" ? 1 : 0));
  const configPath = options.config ?? "notion2page.config.js";
  const outDir = path.resolve(process.cwd(), options.out ?? "dist");

  const config = await loadConfig(configPath);
  const sourceResult = await readSource(config);
  const model = buildPageModel(config, sourceResult.items, sourceResult.meta);

  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, "index.html"), renderHtml(model, config), "utf8");
  await writeFile(path.join(outDir, "style.css"), renderCss(config), "utf8");
  await writeFile(path.join(outDir, "data.json"), JSON.stringify(model, null, 2), "utf8");

  console.log(`Built ${model.stats.projects} projects and ${model.stats.subprojects} subprojects into ${outDir}`);
  console.log(`Open ${path.join(outDir, "index.html")}`);
}

function parseOptions(input) {
  const options = {};

  for (let index = 0; index < input.length; index += 1) {
    const arg = input[index];
    if (arg === "--config" || arg === "-c") {
      options.config = input[index + 1];
      index += 1;
    } else if (arg === "--out" || arg === "-o") {
      options.out = input[index + 1];
      index += 1;
    } else if (arg.includes("=")) {
      const [key, value] = arg.split("=", 2);
      if (key === "--config") options.config = value;
      if (key === "--out") options.out = value;
    } else if (arg.startsWith("-")) {
      throw new Error(`Unknown option "${arg}".`);
    }
  }

  return options;
}

function hasFlag(flag) {
  return args.includes(flag);
}

function printHelp() {
  console.log(`notion2page

Usage:
  node src/cli.js build [--config notion2page.config.js] [--out dist]

Examples:
  npm run build:demo
  NOTION_TOKEN=secret_xxx NOTION_DATA_SOURCE_ID=xxx npm run build
`);
}
