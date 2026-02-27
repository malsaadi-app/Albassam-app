'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import { useI18n } from '@/lib/useI18n';

export default function LanguageSettingsPage() {
  const { locale, setLocale, dir, t } = useI18n();

  return (
    <div dir={dir} style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <PageHeader title={t('languageSettings')} breadcrumbs={[t('settings'), t('languageSettings')]} />

        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #E5E7EB' }}>
          <div style={{ marginBottom: '12px', fontWeight: 700 }}>{t('languageSettings')}</div>
          <div style={{ color: '#6B7280', fontSize: '14px', marginBottom: '16px' }}>
            {t('languageDescription')}
          </div>

          <label style={{ display: 'block', fontSize: '13px', color: '#374151', marginBottom: '8px' }}>{t('select')}</label>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as any)}
            style={{
              width: '100%',
              maxWidth: '360px',
              padding: '10px 12px',
              border: '1px solid #D1D5DB',
              borderRadius: '10px',
              background: 'white',
            }}
          >
            <option value="ar">العربية</option>
            <option value="en">English</option>
          </select>

          <div style={{ marginTop: '16px', fontSize: '13px', color: '#6B7280' }}>
            {t('current')}: <b>{locale === 'ar' ? 'العربية' : 'English'}</b>
          </div>
        </div>
      </div>
    </div>
  );
}
