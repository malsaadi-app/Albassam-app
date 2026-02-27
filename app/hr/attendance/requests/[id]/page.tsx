'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Input';

export default function AttendanceRequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (params.id) fetchRequest();
  }, [params.id]);

  const fetchRequest = async () => {
    try {
      const res = await fetch(`/api/hr/attendance/requests/${params.id}`);
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

  const handleApprove = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/hr/attendance/requests/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED', reviewNotes: notes })
      });

      if (res.ok) {
        alert('تمت الموافقة');
        router.push('/hr/attendance/requests');
      } else {
        alert('حدث خطأ');
      }
    } catch (error) {
      alert('حدث خطأ');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!notes.trim()) {
      alert('يرجى كتابة سبب الرفض');
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch(`/api/hr/attendance/requests/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED', reviewNotes: notes })
      });

      if (res.ok) {
        alert('تم الرفض');
        router.push('/hr/attendance/requests');
      } else {
        alert('حدث خطأ');
      }
    } catch (error) {
      alert('حدث خطأ');
    } finally {
      setProcessing(false);
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
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <PageHeader
          title="📝 تفاصيل طلب التعديل"
          breadcrumbs={['الرئيسية', 'الموارد البشرية', 'الحضور', 'الطلبات', 'التفاصيل']}
          actions={
            <Button variant="outline" onClick={() => router.push('/hr/attendance/requests')}>
              ← رجوع
            </Button>
          }
        />

        <Card variant="default" style={{ marginBottom: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#111827', marginBottom: '12px' }}>
              {request.employee?.displayName}
            </h3>
            <Badge variant={request.status === 'PENDING' ? 'yellow' : request.status === 'APPROVED' ? 'green' : 'red'}>
              {request.status === 'PENDING' ? 'معلق' : request.status === 'APPROVED' ? 'موافق' : 'مرفوض'}
            </Badge>
          </div>

          <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
            <div>
              <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600', marginBottom: '4px' }}>التاريخ</p>
              <p style={{ fontSize: '16px', color: '#111827', fontWeight: '800' }}>
                {new Date(request.date).toLocaleDateString('ar-SA')}
              </p>
            </div>
            {request.reason && (
              <div>
                <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600', marginBottom: '4px' }}>السبب</p>
                <p style={{ fontSize: '15px', color: '#111827', fontWeight: '600' }}>{request.reason}</p>
              </div>
            )}
          </div>

          {request.status === 'PENDING' && (
            <>
              <Textarea
                label="ملاحظات المراجعة"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="اكتب ملاحظاتك هنا..."
              />

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <Button variant="success" onClick={handleApprove} loading={processing} style={{ flex: 1 }}>
                  ✓ موافقة
                </Button>
                <Button variant="danger" onClick={handleReject} loading={processing} style={{ flex: 1 }}>
                  ✗ رفض
                </Button>
              </div>
            </>
          )}

          {request.reviewNotes && (
            <div style={{ marginTop: '20px', padding: '16px', background: '#F9FAFB', borderRadius: '12px' }}>
              <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '700', marginBottom: '8px' }}>
                ملاحظات المراجعة
              </p>
              <p style={{ fontSize: '14px', color: '#111827', fontWeight: '600' }}>
                {request.reviewNotes}
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
