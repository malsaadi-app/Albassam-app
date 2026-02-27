'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';

export default function MaintenanceRequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) fetchRequest();
  }, [params.id]);

  const fetchRequest = async () => {
    try {
      const res = await fetch(`/api/maintenance/requests/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setRequest(data.request);
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

  if (!request) {
    return (
      <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
        <Card variant="default" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ padding: '60px 40px', textAlign: 'center' }}>
            <div style={{ fontSize: '80px', marginBottom: '24px' }}>❌</div>
            <h3 style={{ fontSize: '24px', color: '#111827', fontWeight: '800' }}>
              الطلب غير موجود
            </h3>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <PageHeader
          title={`🔧 ${request.title || 'طلب صيانة'}`}
          breadcrumbs={['الرئيسية', 'الصيانة', 'الطلبات', 'التفاصيل']}
          actions={
            <Button variant="outline" onClick={() => router.push('/maintenance/requests')}>
              ← رجوع
            </Button>
          }
        />

        <Card variant="default">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#111827' }}>
              {request.title}
            </h2>
            <Badge variant={request.status === 'PENDING' ? 'yellow' : request.status === 'IN_PROGRESS' ? 'purple' : 'green'}>
              {request.status === 'PENDING' ? 'معلقة' : request.status === 'IN_PROGRESS' ? 'قيد التنفيذ' : 'مكتملة'}
            </Badge>
          </div>

          <div style={{ display: 'grid', gap: '20px' }}>
            {request.description && (
              <div>
                <p style={{ fontSize: '14px', color: '#6B7280', fontWeight: '700', marginBottom: '8px' }}>الوصف</p>
                <p style={{ fontSize: '16px', color: '#111827', fontWeight: '600' }}>{request.description}</p>
              </div>
            )}

            {request.asset && (
              <div>
                <p style={{ fontSize: '14px', color: '#6B7280', fontWeight: '700', marginBottom: '8px' }}>الأصل</p>
                <p style={{ fontSize: '16px', color: '#111827', fontWeight: '800' }}>🏢 {request.asset.name}</p>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '700', marginBottom: '4px' }}>تاريخ الإنشاء</p>
                <p style={{ fontSize: '16px', color: '#111827', fontWeight: '800' }}>
                  {new Date(request.createdAt).toLocaleDateString('ar-SA')}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
