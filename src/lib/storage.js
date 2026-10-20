// localStorage / sessionStorage wrappers that never throw (private windows and
// blocked storage just behave as empty).
const wrap = (getArea) => ({
  get(key) {
    try { const v = getArea().getItem(key); return v == null ? null : JSON.parse(v); } catch { return null; }
  },
  set(key, value) {
    try { getArea().setItem(key, JSON.stringify(value)); return true; } catch { return false; }
  },
  del(key) {
    try { getArea().removeItem(key); } catch {}
  },
  keys(prefix) {
    try {
      const area = getArea(), out = [];
      for (let i = 0; i < area.length; i++) {
        const k = area.key(i);
        if (k && k.startsWith(prefix)) out.push(k);
      }
      return out;
    } catch { return []; }
  },
  /** Read a key and remove it in one step. */
  take(key) {
    const v = this.get(key);
    this.del(key);
    return v;
  },
});

export const local = wrap(() => window.localStorage);
export const session = wrap(() => window.sessionStorage);

/** Unpublished drafts live in localStorage under this prefix + post id. */
export const DRAFT_PREFIX = "ps:draft:";
/** Where to land (and what to clear) after a save that reloads the page. */
export const AFTER_SAVE_KEY = "ps:after";
