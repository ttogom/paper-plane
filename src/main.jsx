import React from "react";
import { createRoot } from "react-dom/client";
import "@blocknote/mantine/style.css";
import "./styles/fonts.css";
import "./styles/app.css";
import { App } from "./App.jsx";
import { pickBackend } from "./backend/index.js";
import { session, AFTER_SAVE_KEY } from "./lib/storage.js";

// Where to land after a save that reloaded the page (read once, then cleared).
const pendingAfter = session.take(AFTER_SAVE_KEY);
const backend = pickBackend();

createRoot(document.getElementById("root")).render(<App backend={backend} pendingAfter={pendingAfter} />);
