import { createExtension } from "@blocknote/core";
import { Plugin, PluginKey } from "prosemirror-state";
import { columnResizingPluginKey } from "prosemirror-tables";

const DETENT = 40; // px of mouse travel the table edge stays stuck at the line
const SHOW_WITHIN = 80; // px from the line at which the guide appears

/**
 * Resizing table columns in the editor: when the table's right edge reaches
 * the text column's edge (the page's normal width), a guide line appears there
 * and the edge sticks to it for a short stretch of mouse travel before going
 * on, in either direction, so it's easy to line a table up with the text.
 *
 * BlockNote's column resizing (prosemirror-tables) reads clientX from window
 * mousemove/mouseup events. During a column drag this listens first (capture
 * phase) and hands it an adjusted copy of each event.
 */
function limitPlugin() {
  return new Plugin({
    key: new PluginKey("psTableResizeLimit"),
    view(view) {
      const win = view.dom.ownerDocument.defaultView || window;
      let drag = null; // { startX, crossX, dir, limitX, table }
      let guide = null;

      const begin = (state) => {
        const td = view.nodeDOM(state.activeHandle);
        const table = td?.closest?.("table");
        const column = table?.closest(".bn-block-content");
        if (!table || !column) return null;
        const limitX = column.getBoundingClientRect().right;
        const right = table.getBoundingClientRect().right;
        const { startX } = state.dragging;
        // Where the mouse is when the table's edge meets the line, and which way the line is.
        return { startX, crossX: startX + (limitX - right), dir: right <= limitX ? 1 : -1, limitX, table };
      };

      /** Mouse x as the resizer should see it. */
      const adjust = (x) => {
        const past = (x - drag.crossX) * drag.dir; // how far beyond the line, heading away from the start
        if (past <= 0) return x;
        if (past <= DETENT) return drag.crossX;
        return x - drag.dir * DETENT;
      };

      const showGuide = (edgeX) => {
        const near = Math.abs(edgeX - drag.limitX) <= SHOW_WITHIN || (edgeX - drag.limitX) * drag.dir > 0;
        if (!near) { guide?.remove(); guide = null; return; }
        if (!guide) {
          guide = document.createElement("div");
          guide.className = "ps-table-limit";
          document.body.appendChild(guide);
        }
        const r = drag.table.getBoundingClientRect();
        guide.style.left = `${drag.limitX}px`;
        guide.style.top = `${r.top - 8}px`;
        guide.style.height = `${r.height + 16}px`;
        guide.classList.toggle("is-on", Math.abs(edgeX - drag.limitX) < 1);
      };

      const end = () => { drag = null; guide?.remove(); guide = null; };

      const onMouse = (e) => {
        if (e.psAdjusted) return;
        const state = columnResizingPluginKey.getState(view.state);
        if (!state?.dragging) { if (drag) end(); return; }
        if (!drag || drag.startX !== state.dragging.startX) drag = begin(state);
        if (!drag) return;
        const x = adjust(e.clientX);
        // The table's right edge follows the mouse one-for-one while a column is dragged.
        showGuide(drag.limitX + (x - drag.crossX));
        if (e.type === "mouseup") end();
        if (x === e.clientX) return;
        e.stopImmediatePropagation();
        const copy = new MouseEvent(e.type, {
          clientX: x, clientY: e.clientY, screenX: e.screenX, screenY: e.screenY,
          button: e.button, buttons: e.buttons, bubbles: true, cancelable: true,
          shiftKey: e.shiftKey, altKey: e.altKey, ctrlKey: e.ctrlKey, metaKey: e.metaKey,
        });
        copy.psAdjusted = true;
        win.dispatchEvent(copy);
      };

      win.addEventListener("mousemove", onMouse, true);
      win.addEventListener("mouseup", onMouse, true);
      return {
        destroy() {
          win.removeEventListener("mousemove", onMouse, true);
          win.removeEventListener("mouseup", onMouse, true);
          end();
        },
      };
    },
  });
}

/** Pass `tableResizeLimit()` in the editor's `extensions`. */
export const tableResizeLimit = createExtension(() => ({
  key: "psTableResizeLimit",
  prosemirrorPlugins: [limitPlugin()],
}));
