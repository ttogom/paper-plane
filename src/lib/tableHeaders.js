import { createExtension } from "@blocknote/core";
import { Plugin, PluginKey } from "prosemirror-state";

/**
 * Only the first row (and first column) of a table can be a header; that's
 * also the only place BlockNote's menu offers "Header row/column".
 *
 * BlockNote's table code gives a new row the cell type of the row it's added
 * under, so once the header row is the last row, every row added after it
 * (the + button, Tab in the last cell, "Add row below") comes out as another
 * header. This turns those extra header rows, and likewise extra header
 * columns, back into normal cells after each edit.
 */
function fixTable(tr, table, tablePos) {
  const rows = [];
  table.forEach((row, rowOffset) => {
    const cells = [];
    row.forEach((cell, cellOffset) => cells.push({ cell, pos: tablePos + 1 + rowOffset + 1 + cellOffset }));
    rows.push(cells);
  });
  const isHeader = (c) => c.cell.type.name === "tableHeader";
  const toFix = [];
  // Rows below the first made entirely of header cells.
  rows.forEach((cells, i) => { if (i > 0 && cells.length && cells.every(isHeader)) toFix.push(...cells); });
  // Columns right of the first made entirely of header cells (keeping the header row's own cell).
  const cols = Math.max(0, ...rows.map((r) => r.length));
  if (rows.length > 1) {
    for (let j = 1; j < cols; j++) {
      const col = rows.map((r) => r[j]).filter(Boolean);
      if (col.length === rows.length && col.every(isHeader)) toFix.push(...col.slice(1));
    }
  }
  const cellType = table.type.schema.nodes.tableCell;
  for (const { cell, pos } of new Set(toFix)) {
    if (isHeader({ cell })) tr.setNodeMarkup(tr.mapping.map(pos), cellType, cell.attrs);
  }
}

/** Pass `tableHeaderFix()` in the editor's `extensions`. */
export const tableHeaderFix = createExtension(() => ({
  key: "psTableHeaderFix",
  prosemirrorPlugins: [
    new Plugin({
      key: new PluginKey("psTableHeaderFix"),
      appendTransaction(transactions, _old, state) {
        if (!transactions.some((t) => t.docChanged)) return null;
        const tr = state.tr;
        state.doc.descendants((node, pos) => {
          if (node.type.name === "table") { fixTable(tr, node, pos); return false; }
          return true;
        });
        return tr.docChanged ? tr : null;
      },
    }),
  ],
}));
