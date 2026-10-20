// The exact wrapper a claude.ai artifact page is served in. A page that saves
// itself must publish its whole document in this shape, byte for byte, so the
// platform recognizes it. Used by src/backend/claude-page.js and
// scripts/build-claude-page.mjs. You only need this for the Claude-hosted page.

export const SKELETON_RESET =
  ":root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}" +
  "html{scroll-padding-top:env(safe-area-inset-top,0px)}" +
  "body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#fff;color:#000}" +
  "img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}";

export const SKELETON_OPEN =
  '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>' +
  SKELETON_RESET +
  "</style></head><body>\n";

export const SKELETON_CLOSE = "\n</body></html>";

export const PAGE_HEAD =
  '<title>Paper Plane</title><meta name="claude:viewport-fit-sides" content="cover">';

/** Escape a store for embedding inside <script type="application/json">. */
export function storeToScriptJson(store) {
  return JSON.stringify(store)
    .replace(/</g, "\\u003c")
    .replace(new RegExp(String.fromCharCode(0x2028), "g"), "\\u2028")
    .replace(new RegExp(String.fromCharCode(0x2029), "g"), "\\u2029");
}

/** The page body: head bits, styles, mount point, posts, then the app script. */
export function pageBody({ css, js, store }) {
  return (
    PAGE_HEAD +
    '<style id="ps-style">' + css + "</style>" +
    '<div id="root"></div>' +
    '<script type="application/json" id="ps-store">' + storeToScriptJson(store) + "</script>" +
    '<script id="ps-app">' + js + "</script>"
  );
}
