import englishTranslations from "./generated/en.json";
import arabicTranslations from "./generated/ar.json";

export const supportedLanguages = ["en", "ar"] as const;

export type Language = (typeof supportedLanguages)[number];

export const defaultLanguage: Language = "en";

export const translations = {
  en: englishTranslations,
  ar: arabicTranslations,
} as const;

export type TranslationKey = keyof typeof englishTranslations;

export function isLanguage(value: string): value is Language {
  return supportedLanguages.includes(value as Language);
}

export function getDirection(language: Language): "ltr" | "rtl" {
  return language === "ar" ? "rtl" : "ltr";
}

export function translate(
  language: Language,
  key: TranslationKey,
): string {
  return translations[language][key] ?? translations.en[key] ?? key;
}