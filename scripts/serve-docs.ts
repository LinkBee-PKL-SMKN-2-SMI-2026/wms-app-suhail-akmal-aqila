import { serve } from "bun";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PORT = parseInt(process.env.DOCS_PORT || "3001", 10);

// Konversi URL ke Path yang valid di Windows & Linux
const currentDir = fileURLToPath(new URL(".", import.meta.url));
const DOCS_DIR = resolve(currentDir, "../docs/bundle");

serve({
  port: PORT,
  async fetch(request: Request) {
    const url = new URL(request.url);
    const relativePath = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    const targetPath = resolve(DOCS_DIR, relativePath);

    const file = Bun.file(targetPath);

    if (await file.exists()) {
      return new Response(file);
    }

    return new Response("404 - Not Found", { status: 404 });
  },
});

console.log(`\n📖 Docs served at: http://localhost:${PORT}\n`);