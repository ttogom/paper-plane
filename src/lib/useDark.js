import { useEffect, useState } from "react";

/**
 * True when the page should render dark. Follows the OS setting, and an
 * explicit data-theme="dark" | "light" on <html> when one is set.
 */
export function useDark() {
  const read = () => {
    const t = document.documentElement.getAttribute("data-theme");
    if (t === "dark" || t === "light") return t === "dark";
    try { return window.matchMedia("(prefers-color-scheme: dark)").matches; } catch { return false; }
  };
  const [dark, setDark] = useState(read);

  useEffect(() => {
    const update = () => setDark(read());
    let mq;
    try { mq = window.matchMedia("(prefers-color-scheme: dark)"); mq.addEventListener("change", update); } catch {}
    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => { mo.disconnect(); try { mq?.removeEventListener("change", update); } catch {} };
  }, []);

  return dark;
}
