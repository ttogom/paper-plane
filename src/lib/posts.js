// Helpers for reading BlockNote documents (arrays of blocks) and formatting.

export const newId = () =>
  "p-" + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);

export const fmtDate = (t) =>
  new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(new Date(t));

export const fmtTime = (t) =>
  new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(t));

/** Plain text of a block's inline content (text, links, table cells). */
export function inlineText(content) {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (Array.isArray(content))
    return content
      .map((c) => (c.type === "text" ? c.text : c.type === "link" ? inlineText(c.content) : ""))
      .join("");
  if (content.type === "tableContent")
    return (content.rows || [])
      .map((r) => (r.cells || []).map((c) => inlineText(c.content || c)).join(" "))
      .join(" ");
  return "";
}

/** Plain text of a whole document, optionally leaving out headings (for excerpts). */
export function docText(blocks = [], skipHeadings = false) {
  const parts = [];
  for (const b of blocks) {
    if (skipHeadings && b.type === "heading") continue;
    const t = inlineText(b.content);
    if (t) parts.push(t);
    if (b.children?.length) parts.push(docText(b.children, skipHeadings));
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

/** URL of the first image block, used as the thumbnail in the post list. */
export function firstImage(blocks = []) {
  for (const b of blocks) {
    if (b.type === "image" && b.props?.url) return b.props.url;
    const c = b.children?.length && firstImage(b.children);
    if (c) return c;
  }
  return null;
}

const wordCount = (blocks) => (docText(blocks).match(/\S+/g) || []).length;
export const readMins = (blocks) => Math.max(1, Math.round(wordCount(blocks) / 230));
