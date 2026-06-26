"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "bolao-theme";

type Theme = "light" | "dark";

function getPreferredTheme(): Theme {
  if (typeof window === "undefined") return "light";

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  window.localStorage.setItem(STORAGE_KEY, theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const current = getPreferredTheme();
    applyTheme(current);
    setTheme(current);
    setReady(true);
  }, []);

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  }

  return (
    <button
      aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
      className={`theme-toggle ${ready ? "theme-toggle--ready" : ""} ${
        theme === "dark" ? "theme-toggle--dark" : ""
      }`}
      onClick={toggleTheme}
      type="button"
    >
      <span className="theme-toggle__track" aria-hidden="true">
        <span className="theme-toggle__thumb">
          <span className="theme-toggle__icon theme-toggle__icon--sun">☀️</span>
          <span className="theme-toggle__icon theme-toggle__icon--moon">🌙</span>
        </span>
      </span>
      <span className="theme-toggle__label" suppressHydrationWarning>
        {ready ? (theme === "dark" ? "Claro" : "Escuro") : "Tema"}
      </span>
    </button>
  );
}
