import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".webp": "image/webp", ".png": "image/png" };

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const requested = resolve(root, `.${pathname === "/" ? "/index.html" : pathname}`);
    if (requested !== root && !requested.startsWith(`${root}${sep}`)) throw new Error("Outside root");
    const body = await readFile(requested);
    response.writeHead(200, { "Content-Type": types[extname(requested)] ?? "application/octet-stream" });
    response.end(body);
  } catch {
    response.writeHead(404).end("Not found");
  }
}).listen(8000, "127.0.0.1");
