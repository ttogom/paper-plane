import React, { useEffect } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { BackLink } from "./ui.jsx";
import { PreviewButton } from "./Visitor.jsx";
import { fmtDate, readMins } from "../lib/posts.js";

/**
 * One post, read-only. Visitors get the post alone (no navigation, no owner
 * controls); the space above the title is kept free for a cover photo later.
 */
export function Reader({ doc, dark, canEdit, visitor, shareUrl, onBack, onEdit, onPreview, notify }) {
  const editor = useCreateBlockNote(
    { initialContent: doc.blocks?.length ? doc.blocks : undefined },
    [doc.id, doc.updatedAt],
  );

  useEffect(() => {
    document.title = doc.title || "Untitled";
    return () => { document.title = "Paper Plane"; };
  }, [doc.title]);

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(shareUrl); notify({ text: "Link copied" }); }
    catch { notify({ text: `Copy this link: ${shareUrl}`, kind: "error" }); }
  };

  return (
    <div className="ps-page">
      {!visitor && (
        <nav className="ps-crumbs">
          <BackLink onClick={onBack} />
          <span className="ps-row">
            {canEdit && <PreviewButton onClick={onPreview} small />}
            {shareUrl && <button className="ps-btn is-small" onClick={copyLink}>Copy link</button>}
            {canEdit && <button className="ps-btn is-small" onClick={onEdit}>Edit</button>}
          </span>
        </nav>
      )}
      <article className="ps-article">
        <header className="ps-article-head">
          <div className="ps-article-titles">
            <h1 className="ps-title">{doc.title || "Untitled"}</h1>
            <p className="ps-meta">
              {fmtDate(doc.createdAt)} · {readMins(doc.blocks)} min read
              {doc.updatedAt - doc.createdAt > 60000 && <> · edited {fmtDate(doc.updatedAt)}</>}
            </p>
          </div>
        </header>
        <div className="ps-doc is-reading">
          <BlockNoteView editor={editor} editable={false} theme={dark ? "dark" : "light"} />
        </div>
      </article>
    </div>
  );
}
