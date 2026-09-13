"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import {
  translate,
  type AppLanguage,
  type AppTheme,
} from "@/lib/i18n";

type PreferencesContextValue = {
  language: AppLanguage;
  theme: AppTheme;
  resolvedTheme: "light" | "dark";
  setLanguage: (language: AppLanguage) => void;
  setTheme: (theme: AppTheme) => void;
  t: typeof translate;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

function getStoredLanguage(): AppLanguage {
  return window.localStorage.getItem("app_lang") === "sw" ? "sw" : "en";
}

function getStoredTheme(): AppTheme {
  const saved = window.localStorage.getItem("app_theme");

  if (saved === "light" || saved === "dark") {
    return saved;
  }

  return "light";
}

function resolveTheme(theme: AppTheme): "light" | "dark" {
  if (theme !== "system") return theme;

  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }

  return "light";
}

export function AppPreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [language, setLanguageState] = useState<AppLanguage>("en");
  const [theme, setThemeState] = useState<AppTheme>("light");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useIsomorphicLayoutEffect(() => {
    const storedLanguage = getStoredLanguage();
    const storedTheme = getStoredTheme();
    const nextTheme = resolveTheme(storedTheme);

    setLanguageState(storedLanguage);
    setThemeState(storedTheme);
    setResolvedTheme(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.lang = storedLanguage;
  }, []);

  useIsomorphicLayoutEffect(() => {
    const nextTheme = resolveTheme(theme);
    setResolvedTheme(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    document.documentElement.dataset.theme = nextTheme;
  }, [theme]);

  useIsomorphicLayoutEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    if (theme !== "system") return;

    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => {
      const nextTheme = resolveTheme("system");
      setResolvedTheme(nextTheme);
      document.documentElement.classList.toggle("dark", nextTheme === "dark");
      document.documentElement.dataset.theme = nextTheme;
    };

    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }, [theme]);

  const setLanguage = useCallback((nextLanguage: AppLanguage) => {
    window.localStorage.setItem("app_lang", nextLanguage);
    setLanguageState(nextLanguage);
  }, []);

  const setTheme = useCallback((nextTheme: AppTheme) => {
    window.localStorage.setItem("app_theme", nextTheme);
    setThemeState(nextTheme);
  }, []);

  const value = useMemo(
    () => ({
      language,
      theme,
      resolvedTheme,
      setLanguage,
      setTheme,
      t: translate,
    }),
    [language, resolvedTheme, setLanguage, setTheme, theme],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function useAppPreferences() {
  const value = useContext(PreferencesContext);

  if (!value) {
    throw new Error("useAppPreferences must be used inside AppPreferencesProvider.");
  }

  return value;
}
