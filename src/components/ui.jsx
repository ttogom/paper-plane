import React, { useEffect } from "react";

/** The paper-plane logo: a charcoal outline that follows the text color. */
export function Logo() {
  return (
    <svg className="ps-logo-mark" viewBox="0 0 40 40" width="40" height="40" aria-hidden="true"
      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
      <path d="M4.5 18.5 35.5 4.5 24.5 35.5 18.5 23.5Z" />
      <path d="M18.5 23.5 35.5 4.5" />
    </svg>
  );
}

export function BackLink({ onClick }) {
  return (
    <button className="ps-linkish ps-back" onClick={onClick}>
      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor"
        strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 3.5 5.5 8l4.5 4.5" />
      </svg>
      All posts
    </button>
  );
}

export function Toast({ toast, onDone }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDone, toast.kind === "error" ? 7000 : 3200);
    return () => clearTimeout(t);
  }, [toast, onDone]);
  if (!toast) return null;
  return (
    <div className={"ps-toast" + (toast.kind === "error" ? " is-error" : "")} role="status">
      {toast.text}
    </div>
  );
}

/** Inline "are you sure?" bar (the page can't use window.confirm on claude.ai). */
export function ConfirmBar({ text, confirmLabel, onConfirm, onCancel, busy }) {
  return (
    <div className="ps-confirm" role="alertdialog" aria-label={text}>
      <p>{text}</p>
      <div className="ps-row">
        <button className="ps-btn is-danger" onClick={onConfirm} disabled={busy}>{busy ? "Deleting…" : confirmLabel}</button>
        <button className="ps-btn is-ghost" onClick={onCancel} disabled={busy}>Keep it</button>
      </div>
    </div>
  );
}

/** Floating round "Write" button, bottom right. */
export function WriteButton({ onClick }) {
  return (
    <button className="ps-fab" onClick={onClick} aria-label="New post" title="New post">
      <svg className="ps-fab-icon" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none"
        stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
      <span className="ps-fab-label">Write</span>
    </button>
  );
}
