'use client';
import { PageHeader } from '@/components/ui/PageHeader';
export default function Page() {
  return (<div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}><div style={{ maxWidth: '1200px', margin: '0 auto' }}><PageHeader title="📄 تقارير متقدمة" breadcrumbs={['الرئيسية', 'تقارير متقدمة']} /><div style={{ background: 'white', borderRadius: '12px', padding: '60px', textAlign: 'center' }}><div style={{ fontSize: '48px', marginBottom: '16px' }}>🚧</div><div style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>صفحة قيد التطوير</div><div style={{ fontSize: '14px', color: '#6B7280', marginTop: '8px' }}>hr/attendance/advanced-reports</div></div></div></div>);
}
