/**
 * The app talks to storage through one small interface, so you can swap the
 * local JSON file for a real database without touching the UI.
 *
 * A backend is an object with:
 *
 *   kind                 "local" | "claude-page" (for display and debugging)
 *   reloadsAfterSave     true if saveStore() reloads the whole page (the Claude page does)
 *   loadStore()          -> Promise<{ site: { url }, docs: Post[] }>
 *   getAccess()          -> Promise<{ canEdit: boolean, upload(file): Promise<string> }>
 *   saveStore(store)     -> Promise<{ ok: true } | { ok: false, code?, message }>
 *   shareUrl(store, id)  -> string | null   (the link to send for one post)
 *
 * A Post is { id, title, blocks, createdAt, updatedAt } where `blocks` is
 * BlockNote's document JSON (editor.document).
 */
import { localBackend } from "./local.js";
import { claudePageBackend } from "./claude-page.js";

export function pickBackend() {
  // The single-file Claude page embeds its posts in <script id="ps-store">.
  return document.getElementById("ps-store") ? claudePageBackend() : localBackend();
}
