import { fileToDataURL } from "../lib/files.js";
import { SKELETON_OPEN, SKELETON_CLOSE, pageBody } from "./page-shell.js";

/**
 * Backend for the single-file page hosted on claude.ai (built with
 * `npm run build:claude`). Posts are embedded in the page itself; saving
 * republishes the whole page as a new version, which reloads every open view.
 *
 * Uses the page runtime's capabilities: `artifact` (publish), `user`
 * (is this viewer allowed to edit?) and `assets` (image uploads).
 */
const PUBLISH_ERRORS = {
  not_writer: "You can view this page but not change it, so nothing was published.",
  not_granted: "Publishing isn't available in this view. Your draft is saved on this device.",
  consent_required: "Publishing isn't available in this view. Your draft is saved on this device.",
  capability_disabled: "Publishing isn't available in this view. Your draft is saved on this device.",
  not_declared: "Publishing has been turned off for this page.",
  too_large: "This is too large to publish. Remove some images and try again.",
  rate_limited: "You're publishing very quickly. Wait a minute, then try again.",
  invalid_content: "The page couldn't be saved in that form. Your draft is saved on this device.",
};
const GENERIC = "Couldn't publish just now. Your draft is saved on this device. Try again in a moment.";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function claudePageBackend() {
  // The page's own source, kept so it can republish itself with new posts.
  const css = document.getElementById("ps-style")?.textContent || "";
  const js = document.getElementById("ps-app")?.textContent || "";
  let artifact = null;

  return {
    kind: "claude-page",
    reloadsAfterSave: true,

    async loadStore() {
      try {
        const s = JSON.parse(document.getElementById("ps-store").textContent);
        if (s && Array.isArray(s.docs)) return s;
      } catch {}
      return { site: { url: "" }, docs: [] };
    },

    async getAccess() {
      const use = window.claude?.use;
      if (!use) return { canEdit: false, upload: fileToDataURL };
      try {
        const [a, user] = await Promise.all([use("artifact"), use("user")]);
        artifact = a;
        const canEdit = !!a && !!user && (await user.canEdit());
        let assets = null;
        if (canEdit) assets = await use("assets");
        const upload = async (file) => {
          if (assets) {
            try { const r = await assets.upload(file); if (r?.url) return r.url; } catch {}
          }
          return fileToDataURL(file);
        };
        return { canEdit, upload };
      } catch {
        return { canEdit: false, upload: fileToDataURL };
      }
    },

    async saveStore(store) {
      if (!artifact) return { ok: false, code: "not_granted", message: PUBLISH_ERRORS.not_granted };
      const html = SKELETON_OPEN + pageBody({ css, js, store }) + SKELETON_CLOSE;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          await artifact.publish(html);
          return { ok: true };
        } catch (e) {
          const code = e?.code || "upstream_error";
          if (code === "conflict")
            return { ok: false, code, message: "This page was changed somewhere else. Reloading the latest version…" };
          if (code === "upstream_error" && attempt === 0) { await sleep(700 + Math.random() * 800); continue; }
          return { ok: false, code, message: PUBLISH_ERRORS[code] || GENERIC };
        }
      }
      return { ok: false, code: "upstream_error", message: GENERIC };
    },

    shareUrl(store, id) {
      const base = (store.site?.url || "").replace(/#.*$/, "");
      return base ? `${base}#${id}` : null;
    },
  };
}
