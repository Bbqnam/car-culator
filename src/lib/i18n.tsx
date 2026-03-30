import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Language = "en" | "sv";

type LocalizedText = Record<Language, string>;

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  locale: string;
  t: (text: LocalizedText) => string;
}

const LANGUAGE_STORAGE_KEY = "carculator_language";

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function isLanguage(value: string): value is Language {
  return value === "en" || value === "sv";
}

function readInitialLanguage(): Language {
  if (typeof window === "undefined") return "en";
  const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (saved && isLanguage(saved)) return saved;
  return window.navigator.language.toLowerCase().startsWith("sv") ? "sv" : "en";
}

export function localize(language: Language, text: LocalizedText): string {
  return text[language] ?? text.en;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(readInitialLanguage);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => {
    const locale = language === "sv" ? "sv-SE" : "en-US";
    return {
      language,
      setLanguage,
      locale,
      t: (text) => localize(language, text),
    };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useI18n must be used within a LanguageProvider");
  }
  return context;
}
