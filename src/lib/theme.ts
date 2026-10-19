export type Theme = "dark" | "light";

const KEY = "aka-theme";

/** Mirrors the inline script in index.html that runs before first paint */
export function readTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("light") ? "light" : "dark";
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("light", theme === "light");
  root.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* private mode — theme just won't persist */
  }
  window.dispatchEvent(new CustomEvent("themechange", { detail: theme }));
}
