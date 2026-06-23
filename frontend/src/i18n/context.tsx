import { createContext, useContext, useMemo, useState } from 'react';

import { DEFAULT_LOCALE, getTranslations } from './index';
import type { Locale, Translations } from './types';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

// Wraps the app so any component can read the active translations via
// useTranslations(). Defaults to English; setLocale is ready for a future
// language switch in the UI.
export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, t: getTranslations(locale) }),
    [locale]
  );
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

function useLocaleContext(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within a LocaleProvider');
  return ctx;
}

/** The active locale's string catalogue. */
export function useTranslations(): Translations {
  return useLocaleContext().t;
}

/** Active locale plus a setter, for a language switch. */
export function useLocale() {
  const { locale, setLocale } = useLocaleContext();
  return { locale, setLocale };
}
