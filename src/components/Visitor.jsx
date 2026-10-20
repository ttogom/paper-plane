import React from "react";
import { Logo } from "./ui.jsx";

/** Owner-only button that switches to the visitor preview. */
export function PreviewButton({ onClick, small }) {
  return (
    <button className={"ps-btn ps-preview-btn" + (small ? " is-small" : "")} onClick={onClick}>
      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor"
        strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1.5 8s2.4-4.5 6.5-4.5S14.5 8 14.5 8 12.1 12.5 8 12.5 1.5 8 1.5 8Z" />
        <circle cx="8" cy="8" r="2" />
      </svg>
      View as visitor
    </button>
  );
}

/** Band across the top while the owner previews the visitor view. */
export function PreviewBar({ onExit, text }) {
  return (
    <div className="ps-previewbar" role="status">
      <div className="ps-previewbar-inner">
        <span><strong>Visitor preview.</strong> {text}</span>
        <button className="ps-btn is-small ps-previewbar-exit" onClick={onExit}>Exit preview</button>
      </div>
    </div>
  );
}

/** What someone sees on the main link with no post in it: no list of posts. */
export function VisitorLanding() {
  return (
    <div className="ps-page">
      <div className="ps-visitor-mark"><Logo /></div>
      <div className="ps-empty is-visitor">
        <p>Posts here are shared one at a time. Open the link you were sent to read one.</p>
      </div>
    </div>
  );
}

/** Shown while posts and access are loading, so neither view flashes. */
export function Pending() {
  return (
    <div className="ps-page">
      <div className="ps-visitor-mark"><Logo /></div>
    </div>
  );
}
