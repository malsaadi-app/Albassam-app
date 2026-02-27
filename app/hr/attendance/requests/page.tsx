'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';

export default function AttendanceRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/hr/attendance/requests');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
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
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <PageHeader
          title="📝 طلبات تعديل الحضور"
          breadcrumbs={['الرئيسية', 'الموارد البشرية', 'الحضور', 'الطلبات']}
        />

        {requests.length === 0 ? (
          <Card variant="default">
            <div style={{ padding: '60px 40px', textAlign: 'center' }}>
              <div style={{ fontSize: '80px', marginBottom: '24px' }}>📝</div>
              <h3 style={{ fontSize: '24px', color: '#111827', fontWeight: '800', marginBottom: '12px' }}>
                لا توجد طلبات
              </h3>
            </div>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {requests.map((req) => (
              <Card
                key={req.id}
                variant="default"
                hover
                onClick={() => router.push(`/hr/attendance/requests/${req.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '20px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#111827', marginBottom: '8px' }}>
                      {req.employee?.displayName}
                    </h3>
                    <p style={{ fontSize: '14px', color: '#6B7280', fontWeight: '600' }}>
                      {new Date(req.date).toLocaleDateString('ar-SA')}
                    </p>
                    {req.reason && (
                      <p style={{ fontSize: '13px', color: '#9CA3AF', fontWeight: '600', marginTop: '4px' }}>
                        {req.reason}
                      </p>
                    )}
                  </div>
                  <Badge variant={req.status === 'PENDING' ? 'yellow' : req.status === 'APPROVED' ? 'green' : 'red'}>
                    {req.status === 'PENDING' ? 'معلق' : req.status === 'APPROVED' ? 'موافق' : 'مرفوض'}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
