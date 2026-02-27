'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Stats } from '@/components/ui/Stats';
import { Input } from '@/components/ui/Input';

export default function HRAttendancePage() {
  const router = useRouter();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchRecords();
  }, [date]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/hr/attendance?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
      }
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: records.length,
    present: records.filter(r => r.status === 'PRESENT').length,
    absent: records.filter(r => r.status === 'ABSENT').length,
    late: records.filter(r => r.status === 'LATE').length,
    onLeave: records.filter(r => r.status === 'ON_LEAVE').length
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
          title="⏰ سجل الحضور"
          breadcrumbs={['الرئيسية', 'الموارد البشرية', 'الحضور']}
          actions={
            <>
              <Button variant="outline" onClick={() => router.push('/hr/attendance/reports')}>
                📊 التقارير
              </Button>
              <Button variant="outline" onClick={() => router.push('/hr/attendance/correction')}>
                ✏️ التصحيح
              </Button>
              <Button variant="outline" onClick={() => router.push('/hr/attendance/settings')}>
                ⚙️ الإعدادات
              </Button>
            </>
          }
        />

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          <Stats label="إجمالي الموظفين" value={stats.total} variant="blue" icon="👥" />
          <Stats label="حاضر" value={stats.present} variant="green" icon="✅" />
          <Stats label="غائب" value={stats.absent} variant="red" icon="❌" />
          <Stats label="متأخر" value={stats.late} variant="yellow" icon="⏰" />
          <Stats label="في إجازة" value={stats.onLeave} variant="purple" icon="🌴" />
        </div>

        <Card variant="default" style={{ marginBottom: '24px' }}>
          <Input
            label="التاريخ"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Card>

        <Card variant="default">
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', marginBottom: '20px' }}>
            سجلات اليوم ({records.length})
          </h3>

          {records.length === 0 ? (
            <div style={{ padding: '60px 40px', textAlign: 'center' }}>
              <div style={{ fontSize: '80px', marginBottom: '24px' }}>📋</div>
              <p style={{ fontSize: '16px', color: '#6B7280' }}>
                لا توجد سجلات لهذا التاريخ
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '700', color: '#374151' }}>الموظف</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '700', color: '#374151' }}>الحالة</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '700', color: '#374151' }}>الدخول</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '700', color: '#374151' }}>الخروج</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '700', color: '#374151' }}>ساعات العمل</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <td style={{ padding: '12px', fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                        {record.employee?.displayName || '-'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '13px',
                          fontWeight: '700',
                          background: record.status === 'PRESENT' ? '#D1FAE5' : record.status === 'ABSENT' ? '#FEE2E2' : record.status === 'LATE' ? '#FEF3C7' : '#E9D5FF',
                          color: record.status === 'PRESENT' ? '#059669' : record.status === 'ABSENT' ? '#DC2626' : record.status === 'LATE' ? '#D97706' : '#A855F7'
                        }}>
                          {record.status === 'PRESENT' ? 'حاضر' : record.status === 'ABSENT' ? 'غائب' : record.status === 'LATE' ? 'متأخر' : 'إجازة'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', fontWeight: '600', color: '#6B7280' }}>
                        {record.checkIn ? new Date(record.checkIn).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', fontWeight: '600', color: '#6B7280' }}>
                        {record.checkOut ? new Date(record.checkOut).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', fontWeight: '700', color: '#111827' }}>
                        {record.workHours || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
