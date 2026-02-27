'use client';

import { useEffect, useMemo, useState } from 'react';
import type { TranslationKey } from '@/app/translations';
import {
  applyDocumentDirection,
  getInitialLocale,
  setCookieLocale,
  t as translate,
  type Locale,
} from '@/lib/i18n';

export function useI18n() {
  const [locale, setLocaleState] = useState<Locale>('ar');

  useEffect(() => {
    const initial = getInitialLocale();
    setLocaleState(initial);
    applyDocumentDirection(initial);
  }, []);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem('lang', next);
    } catch {
      // ignore
    }
    setCookieLocale(next);
    applyDocumentDirection(next);
  };

  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  const t = useMemo(() => {
    return (key: TranslationKey) => translate(locale, key);
  }, [locale]);

  return { locale, setLocale, dir, t };
}
