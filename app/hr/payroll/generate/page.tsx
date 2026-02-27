'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Input, Select } from '@/components/ui/Input';

export default function GeneratePayrollPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    month: new Date().toISOString().substring(0, 7),
    branchId: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/hr/payroll/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert('تم توليد الرواتب بنجاح');
        router.push('/hr/payroll');
      } else {
        alert('حدث خطأ');
      }
    } catch (error) {
      alert('حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <PageHeader
          title="➕ توليد رواتب شهرية"
          breadcrumbs={['الرئيسية', 'الموارد البشرية', 'الرواتب', 'توليد']}
          actions={
            <Button variant="outline" onClick={() => router.push('/hr/payroll')}>
              ← رجوع
            </Button>
          }
        />

        <Card variant="default">
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gap: '20px' }}>
              <Input
                label="الشهر *"
                type="month"
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                required
              />

              <Select
                label="الفرع (اختياري)"
                value={formData.branchId}
                onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
              >
                <option value="">جميع الفروع</option>
              </Select>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #E5E7EB' }}>
                <Button type="button" variant="outline" onClick={() => router.push('/hr/payroll')}>
                  إلغاء
                </Button>
                <Button type="submit" variant="success" loading={loading}>
                  💰 توليد الرواتب
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
