'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Input, Select } from '@/components/ui/Input';

export default function AttendanceReportsPage() {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState('DAILY');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleGenerate = async () => {
    if (!startDate || !endDate) {
      alert('يرجى تحديد تاريخ البداية والنهاية');
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch('/api/hr/attendance/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportType, startDate, endDate })
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance-report-${startDate}-${endDate}.xlsx`;
        a.click();
      } else {
        alert('حدث خطأ');
      }
    } catch (error) {
      alert('حدث خطأ');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <PageHeader
          title="📊 تقارير الحضور"
          breadcrumbs={['الرئيسية', 'الموارد البشرية', 'الحضور', 'التقارير']}
          actions={
            <Button variant="outline" onClick={() => router.push('/hr/attendance')}>
              ← رجوع
            </Button>
          }
        />

        <Card variant="default">
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', marginBottom: '20px' }}>
            إنشاء تقرير جديد
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginBottom: '24px' }}>
            <Select
              label="نوع التقرير"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="DAILY">يومي</option>
              <option value="WEEKLY">أسبوعي</option>
              <option value="MONTHLY">شهري</option>
              <option value="CUSTOM">مخصص</option>
            </Select>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <Input
                label="تاريخ البداية"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                label="تاريخ النهاية"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <Button variant="success" loading={generating} onClick={handleGenerate}>
            📥 إنشاء وتحميل التقرير
          </Button>
        </Card>
      </div>
    </div>
  );
}
