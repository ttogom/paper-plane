import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";

/**
 * Local stand-in for a real backend.
 *
 *   GET /api/store  -> contents of data/store.json
 *   PUT /api/store  -> replaces data/store.json with the request body
 *
 * It runs inside `npm run dev` and `npm run preview` only. When you move to a
 * hosted database (e.g. Supabase on Vercel), replace src/backend/local.js and
 * delete this plugin.
 */
function localStore() {
  const file = path.resolve("data/store.json");
  const empty = JSON.stringify({ site: { url: "" }, docs: [] });

  const handler = async (req, res, next) => {
    if (!req.url || !req.url.startsWith("/api/store")) return next();
    res.setHeader("content-type", "application/json");
    try {
      if (req.method === "GET") {
        res.end(fs.existsSync(file) ? fs.readFileSync(file, "utf8") : empty);
        return;
      }
      if (req.method === "PUT") {
        let body = "";
        for await (const chunk of req) body += chunk;
        const store = JSON.parse(body);
        if (!store || !Array.isArray(store.docs)) throw new Error("Expected { site, docs: [] }");
        fs.mkdirSync(path.dirname(file), { recursive: true });
        // Write to a temp file first so a crash mid-write can't corrupt your posts.
        fs.writeFileSync(file + ".tmp", JSON.stringify(store, null, 2));
        fs.renameSync(file + ".tmp", file);
        res.end(JSON.stringify({ ok: true }));
        return;
      }
      res.statusCode = 405;
      res.end(JSON.stringify({ ok: false, error: "Method not allowed" }));
    } catch (err) {
      res.statusCode = 400;
      res.end(JSON.stringify({ ok: false, error: String(err.message || err) }));
    }
  };

  return {
    name: "local-store",
    configureServer(server) { server.middlewares.use(handler); },
    configurePreviewServer(server) { server.middlewares.use(handler); },
  };
}

export default defineConfig({
  plugins: [react(), localStore()],
  // Don't reload the page when the dev server rewrites your posts file.
  server: { watch: { ignored: ["**/data/**"] } },
  // BlockNote (with React and Mantine) is one large bundle; that's expected.
  build: { chunkSizeWarningLimit: 1500 },
});
