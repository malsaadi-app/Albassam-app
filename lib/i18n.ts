import { translations, type TranslationKey } from '@/app/translations';

export type Locale = 'ar' | 'en';

const COOKIE_NAME = 'lang';
const ONE_YEAR = 60 * 60 * 24 * 365;

export function normalizeLocale(input?: string | null): Locale {
  const val = (input || '').toLowerCase();
  if (val.startsWith('en')) return 'en';
  return 'ar';
}

export function getCookieLocale(): Locale | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  if (!match) return null;
  try {
    return normalizeLocale(decodeURIComponent(match[1]));
  } catch {
    return normalizeLocale(match[1]);
  }
}

export function setCookieLocale(locale: Locale) {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(locale)}; Max-Age=${ONE_YEAR}; Path=/; SameSite=Lax`;
}

export function detectDeviceLocale(): Locale {
  if (typeof navigator === 'undefined') return 'ar';
  return normalizeLocale(navigator.language);
}

export function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'ar';

  // Priority: explicit cookie -> localStorage -> device locale
  const fromCookie = getCookieLocale();
  if (fromCookie) return fromCookie;

  const fromStorage = window.localStorage.getItem(COOKIE_NAME);
  if (fromStorage) return normalizeLocale(fromStorage);

  return detectDeviceLocale();
}

export function applyDocumentDirection(locale: Locale) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
}

export function t(locale: Locale, key: TranslationKey): string {
  const table = translations[locale] || translations.ar;
  return (table as any)[key] ?? (translations.ar as any)[key] ?? key;
}
