import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Library } from "./components/Library.jsx";
import { Reader } from "./components/Reader.jsx";
import { Editor } from "./components/Editor.jsx";
import { Toast, Logo } from "./components/ui.jsx";
import { PreviewBar, VisitorLanding, Pending } from "./components/Visitor.jsx";
import { useDark } from "./lib/useDark.js";
import { newId } from "./lib/posts.js";
import { fileToDataURL } from "./lib/files.js";
import { local, session, DRAFT_PREFIX, AFTER_SAVE_KEY } from "./lib/storage.js";

/**
 * Views: "list" (owner's post list), "read" (one post), "edit" (editor).
 * Visitors only ever get "read" for the post they were linked to; the main
 * link without a post shows a short note instead of the list.
 */
function initialView(pendingAfter) {
  if (pendingAfter?.view === "read" || pendingAfter?.view === "edit") return { name: pendingAfter.view, id: pendingAfter.id };
  if (pendingAfter?.view === "list") return { name: "list" };
  const h = (location.hash || "").slice(1);
  if (h.startsWith("p-")) return { name: "read", id: h };
  return { name: "list" };
}

export function App({ backend, pendingAfter }) {
  const dark = useDark();
  const [store, setStore] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [access, setAccess] = useState({ ready: false, canEdit: false, upload: fileToDataURL });
  const [view, setView] = useState(() => initialView(pendingAfter));
  const [toast, setToast] = useState(null);
  const [draftsTick, setDraftsTick] = useState(0);
  // Owner-only: show the page exactly as people with a post link see it.
  const [preview, setPreview] = useState(false);

  const go = useCallback((v) => { setView(v); setDraftsTick((n) => n + 1); window.scrollTo(0, 0); }, []);

  // Load posts and find out whether this viewer may edit.
  useEffect(() => {
    backend.loadStore().then(setStore).catch((e) => setLoadError(e.message || String(e)));
    backend.getAccess().then((a) => setAccess({ ready: true, ...a }));
  }, [backend]);

  // Finish a save that reloaded the page: clear its draft and show its message.
  useEffect(() => {
    if (pendingAfter?.clearDraft) { local.del(DRAFT_PREFIX + pendingAfter.clearDraft); setDraftsTick((n) => n + 1); }
    if (pendingAfter?.toast) setToast(pendingAfter.toast);
  }, [pendingAfter]);

  // Follow a post link opened in an already-open page.
  useEffect(() => {
    const onHash = () => {
      const h = (location.hash || "").slice(1);
      if (h.startsWith("p-")) go({ name: "read", id: h });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [go]);

  const drafts = useMemo(
    () => local.keys(DRAFT_PREFIX).map((k) => local.get(k)).filter((d) => d && d.id),
    [draftsTick, view],
  );

  /** Save the whole store, then land where `after` says. */
  const persist = async (next, after, failAfter) => {
    // The Claude page reloads during the save, so the landing spot must be stored first.
    if (backend.reloadsAfterSave) session.set(AFTER_SAVE_KEY, after);
    const res = await backend.saveStore(next);
    if (!res.ok) {
      if (backend.reloadsAfterSave) {
        if (res.code === "conflict" && failAfter) session.set(AFTER_SAVE_KEY, failAfter);
        else session.del(AFTER_SAVE_KEY);
      }
      return res;
    }
    if (!backend.reloadsAfterSave) {
      setStore(next);
      if (after.clearDraft) local.del(DRAFT_PREFIX + after.clearDraft);
      if (after.toast) setToast(after.toast);
      go(after.view === "list" ? { name: "list" } : { name: after.view, id: after.id });
    }
    return res;
  };

  const onPublish = async ({ id, title, blocks }) => {
    const now = Date.now();
    const prev = store.docs.find((d) => d.id === id);
    const doc = { id, title, blocks, createdAt: prev?.createdAt || now, updatedAt: now };
    const next = { ...store, docs: prev ? store.docs.map((d) => (d.id === id ? doc : d)) : [...store.docs, doc] };
    return persist(
      next,
      { view: "read", id, clearDraft: id, toast: { text: prev ? "Post updated" : "Published" } },
      { view: "edit", id, toast: { text: "This page changed elsewhere, so it was reloaded. Your draft is still here; publish again.", kind: "error" } },
    );
  };

  const onDelete = async (id) => {
    const next = { ...store, docs: store.docs.filter((d) => d.id !== id) };
    const res = await persist(next, { view: "list", clearDraft: id, toast: { text: "Post deleted" } });
    if (!res.ok) setToast({ text: res.message, kind: "error" });
    return res.ok;
  };

  const startPreview = () => { setPreview(true); window.scrollTo(0, 0); };
  const isOwner = access.ready && access.canEdit && !preview;
  const visitor = !isOwner;
  const doc = store && view.id ? store.docs.find((d) => d.id === view.id) : null;

  let body;
  if (loadError) {
    body = (
      <div className="ps-page">
        <div className="ps-empty"><p>{loadError}</p></div>
      </div>
    );
  } else if (!store) {
    body = <Pending />;
  } else if (view.name === "edit" && isOwner) {
    body = (
      <Editor
        key={view.id}
        id={view.id}
        existing={doc}
        dark={dark}
        upload={access.upload}
        canPublish={isOwner}
        onBack={() => go(doc ? { name: "read", id: doc.id } : { name: "list" })}
        onPublish={onPublish}
        onDelete={onDelete}
      />
    );
  } else if (view.name === "read" && doc) {
    body = (
      <Reader
        key={doc.id}
        doc={doc}
        dark={dark}
        canEdit={isOwner}
        visitor={visitor}
        shareUrl={backend.shareUrl(store, doc.id)}
        onBack={() => go({ name: "list" })}
        onEdit={() => go({ name: "edit", id: doc.id })}
        onPreview={startPreview}
        notify={setToast}
      />
    );
  } else if (view.name === "read" && !doc) {
    body = (
      <div className="ps-page">
        {visitor && <div className="ps-visitor-mark"><Logo /></div>}
        <div className="ps-empty">
          <p>{visitor ? "This post isn't available. It may have been removed." : "This post isn't here anymore."}</p>
          {isOwner && <button className="ps-btn" onClick={() => go({ name: "list" })}>See all posts</button>}
        </div>
      </div>
    );
  } else if (!access.ready) {
    body = <Pending />;
  } else if (visitor) {
    body = <VisitorLanding />;
  } else {
    body = (
      <Library
        store={store}
        drafts={drafts}
        onOpen={(id) => go({ name: "read", id })}
        onEdit={(id) => go({ name: "edit", id })}
        onNew={() => go({ name: "edit", id: newId() })}
        onDelete={onDelete}
        onPreview={startPreview}
      />
    );
  }

  return (
    <div className={"ps" + (preview ? " is-previewing" : "")}>
      {preview && (
        <PreviewBar
          onExit={() => setPreview(false)}
          text={view.name === "read"
            ? "This is what people see when you send them this post's link."
            : "This is what someone sees if they open the main link without a post."}
        />
      )}
      {body}
      <Toast toast={toast} onDone={() => setToast(null)} />
    </div>
  );
}
