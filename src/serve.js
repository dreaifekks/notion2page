#!/usr/bin/env node

import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";

const root = path.resolve(process.cwd(), process.argv[2] ?? "dist");
const port = Number(process.env.PORT ?? 4173);
const host = process.env.HOST ?? "127.0.0.1";

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);
  const safePath = path.normalize(url.pathname).replace(/^(\.\.[/\\])+/, "");
  const requestedPath = path.join(root, safePath);
  const filePath = await resolveFile(requestedPath);

  if (!filePath || !filePath.startsWith(root)) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  response.writeHead(200, { "Content-Type": contentType(filePath) });
  createReadStream(filePath).pipe(response);
});

server.on("error", (error) => {
  console.error(`Failed to serve ${root}: ${error.message}`);
  process.exitCode = 1;
});

server.listen(port, host, () => {
  console.log(`Serving ${root}`);
  console.log(`Local: http://${host === "0.0.0.0" ? "localhost" : host}:${port}`);
});

async function resolveFile(requestedPath) {
  try {
    const entry = await stat(requestedPath);
    if (entry.isDirectory()) return path.join(requestedPath, "index.html");
    return requestedPath;
  } catch {
    return undefined;
  }
}

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  return "application/octet-stream";
}
