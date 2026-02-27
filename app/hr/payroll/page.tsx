'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Stats } from '@/components/ui/Stats';

export default function PayrollPage() {
  const router = useRouter();
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const fetchPayrolls = async () => {
    try {
      const res = await fetch('/api/hr/payroll');
      if (res.ok) {
        const data = await res.json();
        setPayrolls(data.payrolls || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #E5E7EB',
          borderTop: '4px solid #3B82F6',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}></div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <PageHeader
          title="💰 إدارة الرواتب"
          breadcrumbs={['الرئيسية', 'الموارد البشرية', 'الرواتب']}
          actions={
            <Button variant="success" onClick={() => router.push('/hr/payroll/generate')}>
              ➕ توليد رواتب
            </Button>
          }
        />

        <div style={{ marginBottom: '32px' }}>
          <Stats label="إجمالي الرواتب" value={payrolls.length} variant="blue" icon="💰" />
        </div>

        {payrolls.length === 0 ? (
          <Card variant="default">
            <div style={{ padding: '60px 40px', textAlign: 'center' }}>
              <div style={{ fontSize: '80px', marginBottom: '24px' }}>💰</div>
              <h3 style={{ fontSize: '24px', color: '#111827', fontWeight: '800', marginBottom: '12px' }}>
                لا توجد رواتب
              </h3>
              <Button variant="success" onClick={() => router.push('/hr/payroll/generate')}>
                ➕ توليد رواتب شهرية
              </Button>
            </div>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {payrolls.map((payroll) => (
              <Card key={payroll.id} variant="default" hover onClick={() => router.push(`/hr/payroll/${payroll.id}`)} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', marginBottom: '4px' }}>
                      رواتب {payroll.month}
                    </h3>
                    <p style={{ fontSize: '14px', color: '#6B7280', fontWeight: '600' }}>
                      {payroll.employeeCount} موظف
                    </p>
                  </div>
                  <p style={{ fontSize: '20px', fontWeight: '800', color: '#10B981' }}>
                    {payroll.totalAmount?.toLocaleString('ar-SA')} ر.س
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
