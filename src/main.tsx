import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./app/App";
import "./styles/index.css";

declare global {
  interface Window {
    __akaReveal?: number;
    __akaIntroT?: number;
    __akaIntroSkip?: () => void;
    __akaIntroMounted?: boolean;
  }
}

// The bundle arrived: cancel the no-JS reveal fallback from index.html
// (and undo it if a very slow connection already triggered it — motion takes over now)
window.clearTimeout(window.__akaReveal);
document.documentElement.classList.remove("reveal-all");

const root = document.getElementById("root")!;
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

// Production HTML is prerendered (scripts/prerender.mjs) → hydrate; dev server → render.
if (root.hasChildNodes()) hydrateRoot(root, app);
else createRoot(root).render(app);
