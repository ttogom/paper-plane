import React, { useState } from "react";
import { Logo, ConfirmBar, WriteButton } from "./ui.jsx";
import { PreviewButton } from "./Visitor.jsx";
import { docText, firstImage, fmtDate, fmtTime, readMins } from "../lib/posts.js";

/** The owner's list of posts, newest first, plus any unpublished drafts. */
export function Library({ store, drafts, onOpen, onEdit, onNew, onDelete, onPreview }) {
  const docs = [...store.docs].sort((a, b) => b.createdAt - a.createdAt);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const localOnly = drafts.filter((d) => !store.docs.some((x) => x.id === d.id));

  return (
    <div className="ps-page">
      <header className="ps-masthead">
        <div className="ps-masthead-text">
          <h1 className="ps-logo">
            <Logo />
            <span className="ps-sr">Paper Plane</span>
          </h1>
          <p className="ps-sub">
            {docs.length === 0 ? "Nothing posted yet." : `${docs.length} ${docs.length === 1 ? "post" : "posts"}`}
          </p>
        </div>
        <PreviewButton onClick={onPreview} />
      </header>

      {localOnly.length > 0 && (
        <section className="ps-drafts" aria-label="Unpublished drafts">
          <h2 className="ps-eyebrow">Unpublished drafts · only on this device</h2>
          <ul>
            {localOnly.map((d) => (
              <li key={d.id}>
                <button className="ps-linkish" onClick={() => onEdit(d.id)}>{d.title?.trim() || "Untitled draft"}</button>
                <span className="ps-meta">edited {fmtDate(d.savedAt)}, {fmtTime(d.savedAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {docs.length === 0 ? (
        <div className="ps-empty">
          <p>Posts you publish show up here, newest first.</p>
          <button className="ps-btn" onClick={onNew}>Write the first one</button>
        </div>
      ) : (
        <ol className="ps-list">
          {docs.map((d) => {
            const text = docText(d.blocks, true);
            const img = firstImage(d.blocks);
            const hasDraft = drafts.some((x) => x.id === d.id);
            return (
              <li key={d.id} className="ps-item">
                <div className="ps-item-body">
                  <button className="ps-item-title" onClick={() => onOpen(d.id)}>{d.title || "Untitled"}</button>
                  {text && <p className="ps-item-excerpt">{text.slice(0, 240)}</p>}
                  <div className="ps-item-meta">
                    <time dateTime={new Date(d.createdAt).toISOString()}>{fmtDate(d.createdAt)}</time>
                    <span>{readMins(d.blocks)} min read</span>
                    {d.updatedAt - d.createdAt > 60000 && <span>edited {fmtDate(d.updatedAt)}</span>}
                    {hasDraft && <span className="ps-chip">Unpublished changes</span>}
                    <span className="ps-item-actions">
                      <button className="ps-linkish" onClick={() => onEdit(d.id)}>Edit</button>
                      <button className="ps-linkish is-danger" onClick={() => setConfirm(d)}>Delete</button>
                    </span>
                  </div>
                  {confirm?.id === d.id && (
                    <ConfirmBar
                      text={`Delete “${d.title || "Untitled"}”? Anyone with the link will stop seeing it.`}
                      confirmLabel="Delete post"
                      busy={busy}
                      onCancel={() => setConfirm(null)}
                      onConfirm={async () => {
                        setBusy(true);
                        const ok = await onDelete(d.id);
                        setBusy(false);
                        if (ok) setConfirm(null);
                      }}
                    />
                  )}
                </div>
                {img && (
                  <button className="ps-item-thumb" onClick={() => onOpen(d.id)} tabIndex={-1} aria-hidden="true">
                    <img src={img} alt="" loading="lazy" />
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      )}

      <footer className="ps-foot">You can edit this page. People you share a post with see only that post.</footer>
      <WriteButton onClick={onNew} />
    </div>
  );
}
