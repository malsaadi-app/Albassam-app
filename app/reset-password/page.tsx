'use client';
import { PageHeader } from '@/components/ui/PageHeader';
export default function Page() {
  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <PageHeader title="إعادة تعيين كلمة المرور" breadcrumbs={['الرئيسية', 'إعادة تعيين كلمة المرور']} />
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px' }}>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
              إعادة تعيين كلمة المرور
            </h2>
            <p style={{ color: '#6B7280', fontSize: '14px' }}>
              الصفحة قيد التطوير - reset-password
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
