import React, { useCallback, useEffect, useRef, useState } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { BackLink, ConfirmBar } from "./ui.jsx";
import { fmtDate, fmtTime } from "../lib/posts.js";
import { local, DRAFT_PREFIX } from "../lib/storage.js";
import { tableHeaderFix } from "../lib/tableHeaders.js";

/**
 * Write a new post or edit a published one. Drafts autosave to this browser
 * (localStorage) half a second after you stop typing; nothing reaches anyone
 * else until you press Publish / Update post.
 */
export function Editor({ id, existing, dark, upload, canPublish, onBack, onPublish, onDelete }) {
  const key = DRAFT_PREFIX + id;
  const [initial] = useState(() => {
    let d = local.get(key);
    // Drafts saved during the Editor.js trial hold { type, data } blocks BlockNote can't open; drop them.
    if (d?.blocks?.some((b) => b && "data" in b)) { local.del(key); d = null; }
    if (d && (d.blocks?.length || d.title)) return { title: d.title || "", blocks: d.blocks, restored: d.savedAt };
    return { title: existing?.title || "", blocks: existing?.blocks, restored: null };
  });
  const [title, setTitle] = useState(initial.title);
  const [restored, setRestored] = useState(initial.restored);
  const [status, setStatus] = useState(initial.restored ? "restored" : "clean");
  const [savedAt, setSavedAt] = useState(initial.restored);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [confirm, setConfirm] = useState(false);
  const titleRef = useRef(null);
  const timer = useRef(null);
  const uploadRef = useRef(upload);
  uploadRef.current = upload;

  const uploadFile = useCallback((file) => uploadRef.current(file), []);

  const editor = useCreateBlockNote(
    {
      initialContent: initial.blocks?.length ? initial.blocks : undefined,
      uploadFile,
      // Table extras BlockNote leaves off by default: cell colors, header rows/columns, merging cells.
      tables: { cellBackgroundColor: true, cellTextColor: true, headers: true, splitCells: true },
      extensions: [tableHeaderFix()],
    },
    [],
  );

  const writeDraft = useCallback(
    (nextTitle) => local.set(key, { id, title: nextTitle, blocks: editor.document, savedAt: Date.now(), isNew: !existing }),
    [editor, id, key, existing],
  );

  const saveDraft = useCallback((nextTitle) => {
    clearTimeout(timer.current);
    setStatus("saving");
    timer.current = setTimeout(() => {
      const ok = writeDraft(nextTitle);
      setSavedAt(Date.now());
      setStatus(ok ? "saved" : "unsaved");
    }, 500);
  }, [writeDraft]);

  useEffect(() => () => clearTimeout(timer.current), []);

  // Grow the title box with its text.
  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [title]);
  useEffect(() => { if (!existing && !initial.title) titleRef.current?.focus(); }, []);

  // Cmd/Ctrl+S saves the draft immediately.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        clearTimeout(timer.current);
        writeDraft(title);
        setSavedAt(Date.now());
        setStatus("saved");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [title, writeDraft]);

  const discard = () => {
    local.del(key);
    if (!existing) { onBack(); return; }
    editor.replaceBlocks(editor.document, existing.blocks?.length ? existing.blocks : [{ type: "paragraph" }]);
    setTitle(existing.title || "");
    setRestored(null);
    setStatus("clean");
  };

  const publish = async () => {
    clearTimeout(timer.current);
    if (!title.trim()) { setErr("Add a title before publishing."); titleRef.current?.focus(); return; }
    setErr("");
    writeDraft(title);
    setBusy(true);
    const res = await onPublish({ id, title: title.trim(), blocks: editor.document });
    setBusy(false);
    if (!res.ok) setErr(res.message);
  };

  const statusText = {
    clean: existing ? "No changes yet" : "New post",
    saving: "Saving draft…",
    saved: savedAt ? `Draft saved on this device · ${fmtTime(savedAt)}` : "Draft saved on this device",
    restored: "Unpublished draft restored",
    unsaved: "Couldn't save a draft in this browser. Publish to keep your work.",
  }[status];

  return (
    <div className="ps-editor-shell">
      <div className="ps-toolbar">
        <div className="ps-toolbar-inner">
          <BackLink onClick={onBack} />
          <span className={"ps-status" + (status === "unsaved" ? " is-warn" : "")} aria-live="polite">{statusText}</span>
          <span className="ps-row">
            {existing && (
              <button className="ps-btn is-ghost is-small is-danger-text" onClick={() => setConfirm(true)}>Delete</button>
            )}
            <button className="ps-btn is-primary" onClick={publish} disabled={busy || !canPublish}
              title={canPublish ? undefined : "Publishing is only available to people who can edit this page"}>
              {busy ? "Publishing…" : existing ? "Update post" : "Publish"}
            </button>
          </span>
        </div>
      </div>

      <div className="ps-page is-editor">
        {restored && (
          <div className="ps-notice">
            <span>Restored unpublished changes from {fmtDate(restored)}, {fmtTime(restored)}.</span>
            <button className="ps-linkish" onClick={discard}>
              {existing ? "Discard and show published version" : "Discard draft"}
            </button>
          </div>
        )}
        {err && <div className="ps-notice is-error" role="alert">{err}</div>}
        {confirm && (
          <ConfirmBar
            text={`Delete “${existing?.title || "Untitled"}”? Anyone with the link will stop seeing it.`}
            confirmLabel="Delete post"
            busy={busy}
            onCancel={() => setConfirm(false)}
            onConfirm={async () => {
              setBusy(true);
              const ok = await onDelete(id);
              setBusy(false);
              if (ok) { local.del(key); setConfirm(false); }
            }}
          />
        )}
        <label className="ps-sr" htmlFor="ps-title-input">Title</label>
        <textarea
          id="ps-title-input"
          ref={titleRef}
          className="ps-title ps-title-input"
          rows={1}
          placeholder="Untitled"
          value={title}
          onChange={(e) => { setTitle(e.target.value); saveDraft(e.target.value); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); editor.focus(); } }}
        />
        <p className="ps-meta ps-hint">Type <kbd>/</kbd> for headings, lists, images and more. Select text to format it.</p>
        <div className="ps-doc is-editing">
          <BlockNoteView editor={editor} theme={dark ? "dark" : "light"} onChange={() => saveDraft(title)} />
        </div>
      </div>
    </div>
  );
}
