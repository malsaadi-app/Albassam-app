'use client';

import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';

export default function PayrollDetailPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <PageHeader
          title="💰 تفاصيل الراتب"
          breadcrumbs={['الرئيسية', 'الموارد البشرية', 'الرواتب', 'تفاصيل']}
        />
        <Card variant="default">
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#111827' }}>
              تفاصيل الراتب
            </h3>
          </div>
        </Card>
      </div>
    </div>
  );
}
