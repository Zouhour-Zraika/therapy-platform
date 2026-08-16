import englishTranslations from "./generated/en.json";
import arabicTranslations from "./generated/ar.json";

export const supportedLanguages = [
  "en",
  "ar",
] as const;

export type Language =
  (typeof supportedLanguages)[number];

export const defaultLanguage: Language =
  "en";

export const translations = {
  en: englishTranslations,
  ar: arabicTranslations,
} as const;

/*
 * Clés provenant automatiquement du fichier anglais.
 */
type GeneratedTranslationKey =
  keyof typeof englishTranslations;

/*
 * Clés récemment ajoutées au système de réservation.
 *
 * Elles sont aussi présentes dans en.json et ar.json,
 * mais on les déclare ici explicitement pour que
 * TypeScript les reconnaisse immédiatement.
 */
type BookingSessionTranslationKey =
  | "booking.session.selectedTherapist"
  | "booking.session.changeTherapist"
  | "booking.session.eyebrow"
  | "booking.session.title"
  | "booking.session.description"
  | "booking.session.noSlots"
  | "booking.session.continueToPayment"
  | "booking.actions.seeMatches";

export type TranslationKey =
  | GeneratedTranslationKey
  | BookingSessionTranslationKey;

export function isLanguage(
  value: string,
): value is Language {
  return supportedLanguages.includes(
    value as Language,
  );
}

export function getDirection(
  language: Language,
): "ltr" | "rtl" {
  return language === "ar"
    ? "rtl"
    : "ltr";
}

export function translate(
  language: Language,
  key: TranslationKey,
): string {
  const selectedTranslations =
    translations[language] as Record<
      string,
      string
    >;

  const fallbackTranslations =
    translations.en as Record<
      string,
      string
    >;

  return (
    selectedTranslations[key] ??
    fallbackTranslations[key] ??
    key
  );
}