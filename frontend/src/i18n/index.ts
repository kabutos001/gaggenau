import { de } from './de';
import { en } from './en';
import type { Locale, Translations } from './types';

// English is the product default. A language toggle can later flip this via the
// LocaleProvider (see context.tsx) without touching any component string.
export const DEFAULT_LOCALE: Locale = 'en';

export const CATALOGS: Record<Locale, Translations> = { en, de };

export function getTranslations(locale: Locale): Translations {
  return CATALOGS[locale];
}

export type { Locale, Translations } from './types';
