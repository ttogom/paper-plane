import { fileToDataURL } from "../lib/files.js";

/**
 * Local development backend: posts live in data/store.json, read and written
 * through the small API in vite.config.js.
 *
 * You're the owner by default. Add ?visitor to the URL to see the page as
 * someone you've shared a post with (e.g. http://localhost:5173/?visitor#p-abc123).
 */
export function localBackend() {
  const visitor = new URLSearchParams(location.search).has("visitor");

  return {
    kind: "local",
    reloadsAfterSave: false,

    async loadStore() {
      const res = await fetch("/api/store");
      if (!res.ok) throw new Error(`Couldn't load posts (${res.status}).`);
      const store = await res.json();
      return { site: { url: "" }, docs: [], ...store };
    },

    async getAccess() {
      return { canEdit: !visitor, upload: fileToDataURL };
    },

    async saveStore(store) {
      try {
        const res = await fetch("/api/store", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(store),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          return { ok: false, message: `Couldn't save: ${body.error || res.statusText}. Your draft is still on this device.` };
        }
        return { ok: true };
      } catch {
        return { ok: false, message: "Couldn't reach the dev server. Is `npm run dev` still running? Your draft is still on this device." };
      }
    },

    shareUrl(_store, id) {
      return `${location.origin}${location.pathname}#${id}`;
    },
  };
}
