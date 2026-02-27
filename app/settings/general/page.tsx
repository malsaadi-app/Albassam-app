'use client';
import { PageHeader } from '@/components/ui/PageHeader';
export default function GeneralSettingsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <PageHeader title="⚙️ الإعدادات العامة" breadcrumbs={['الرئيسية', 'الإعدادات', 'عام']} />
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>إعدادات النظام</h3>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div><label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>اسم المؤسسة</label><input type="text" defaultValue="مجمع البسام التعليمي" style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px' }} /></div>
              <div><label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>البريد الإلكتروني</label><input type="email" defaultValue="info@albassam-app.com" style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px' }} /></div>
              <div><label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>الهاتف</label><input type="text" defaultValue="+966 XX XXX XXXX" style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px' }} /></div>
            </div>
            <button style={{ marginTop: '16px', padding: '10px 24px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>حفظ التغييرات</button>
          </div>
        </div>
      </div>
    </div>
  );
}
