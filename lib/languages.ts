// Languages the AI can write in. Stored in profiles.preferred_language (and a cookie for visitors).
export const LANGUAGES = ["English", "Afrikaans", "Oshiwambo"] as const;
export type Language = (typeof LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = "English";
export const LANGUAGE_COOKIE = "mulastream_language";

export function isLanguage(value: unknown): value is Language {
  return typeof value === "string" && (LANGUAGES as readonly string[]).includes(value);
}

export function toLanguage(value: unknown): Language {
  return isLanguage(value) ? value : DEFAULT_LANGUAGE;
}
