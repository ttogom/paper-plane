// Builds the single-file page that runs on claude.ai (posts embedded, saves by
// republishing itself). Output: dist-claude/paper-plane.html
//
// You don't need this for local development or for Vercel; it exists so the
// same source can keep updating the Claude-hosted page.
//
//   npm run build:claude
import * as esbuild from "esbuild";
import fs from "node:fs";
import { pageBody } from "../src/backend/page-shell.js";

await esbuild.build({
  entryPoints: ["src/main.jsx"],
  bundle: true,
  minify: true,
  format: "iife",
  target: ["es2020"],
  outdir: "dist-claude/.tmp",
  jsx: "automatic",
  legalComments: "none",
  loader: { ".woff2": "dataurl", ".woff": "dataurl", ".ttf": "dataurl", ".svg": "dataurl", ".png": "dataurl" },
  define: { "process.env.NODE_ENV": '"production"' },
  conditions: ["style"],
  logLevel: "warning",
});

let js = fs.readFileSync("dist-claude/.tmp/main.js", "utf8");
const css = fs.readFileSync("dist-claude/.tmp/main.css", "utf8");

// Inline scripts must not contain sequences that would end or confuse the <script> tag.
// (In this bundle they only occur inside strings and a non-unicode regex, where these escapes are harmless.)
js = js.replace(/<\/script/gi, "<\\/script").replace(/<!--/g, "<\\!--").replace(/<script/gi, "<\\script");
if (/<\/style/i.test(css)) throw new Error("CSS contains </style, which would break the page.");

const store = JSON.parse(fs.readFileSync("data/store.json", "utf8"));
const html = pageBody({ css, js, store });

fs.writeFileSync("dist-claude/paper-plane.html", html);
fs.rmSync("dist-claude/.tmp", { recursive: true, force: true });
console.log(`dist-claude/paper-plane.html  ${(html.length / 1024).toFixed(0)} KB  (${store.docs.length} posts)`);
