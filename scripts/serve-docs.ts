import { serve } from "bun";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const PORT = parseInt(process.env.PORT_DOCS || "3001", 10);
// fileURLToPath: aman di semua OS (pathname mentah rusak di Windows: /C:/...)
const DOCS_DIR = fileURLToPath(new URL("../docs/bundle", import.meta.url));

serve({
  port: PORT,
  async fetch(request: Request) {
    const url = new URL(request.url);
    const filePath = url.pathname === "/" ? "/index.html" : url.pathname;
    const file = Bun.file(join(DOCS_DIR, filePath));

    if (await file.exists()) {
      return new Response(file);
    }

    return new Response("404 - Not Found", { status: 404 });
  },
});

console.log(`\n📖 Docs served at: http://localhost:${PORT}\n`);
