"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  defaultLanguage,
  getDirection,
  isLanguage,
  translate,
  type Language,
  type TranslationKey,
} from "./config";

type LanguageContextValue = {
  language: Language;
  isArabic: boolean;
  changeLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext =
  createContext<LanguageContextValue | null>(null);

type LanguageProviderProps = {
  children: ReactNode;
};

export function LanguageProvider({
  children,
}: LanguageProviderProps) {
  const [language, setLanguage] =
    useState<Language>(defaultLanguage);

  useEffect(() => {
    const savedLanguage =
      localStorage.getItem("language");

    const initialLanguage =
      savedLanguage &&
      isLanguage(savedLanguage)
        ? savedLanguage
        : defaultLanguage;

    setLanguage(initialLanguage);

    document.documentElement.lang =
      initialLanguage;

    document.documentElement.dir =
      getDirection(initialLanguage);
  }, []);

  const changeLanguage = useCallback(
    (newLanguage: Language) => {
      localStorage.setItem(
        "language",
        newLanguage,
      );

      document.documentElement.lang =
        newLanguage;

      document.documentElement.dir =
        getDirection(newLanguage);

      setLanguage(newLanguage);
    },
    [],
  );

  const t = useCallback(
    (key: TranslationKey) => {
      return translate(language, key);
    },
    [language],
  );

  const value = useMemo(
    () => ({
      language,
      isArabic: language === "ar",
      changeLanguage,
      t,
    }),
    [
      language,
      changeLanguage,
      t,
    ],
  );

  return (
    <LanguageContext.Provider
      value={value}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context =
    useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider",
    );
  }

  return context;
}