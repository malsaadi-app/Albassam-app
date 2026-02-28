'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { getInitialLocale } from '@/lib/i18n';
import { useI18n } from '@/lib/useI18n';

export default function HRRequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { dir, t, locale } = useI18n();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) fetchRequest();
  }, [params.id]);

  const fetchRequest = async () => {
    try {
      const res = await fetch(`/api/hr/requests/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        // API returns the request object directly
        setRequest(data);
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
      <div dir={dir} style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
        <Card variant="default" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ padding: '60px 40px', textAlign: 'center' }}>
            <div style={{ fontSize: '80px', marginBottom: '24px' }}>❌</div>
            <h3 style={{ fontSize: '24px', color: '#111827', fontWeight: '800' }}>
              {t('requestNotFound')}
            </h3>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div dir={dir} style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <PageHeader
          title={`📋 ${request.requestNumber || t('hrRequests')}`}
          breadcrumbs={[t('home'), t('hr'), t('hrRequests'), t('details')]}
          actions={
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                variant="outline"
                onClick={() => {
                  const locale = getInitialLocale();
                  window.open(`/print/hr/requests/${params.id}?locale=${locale}`, '_blank');
                }}
              >
                🖨️ طباعة
              </Button>
              <Button variant="outline" onClick={() => router.push('/hr/requests')}>
                ← {t('back')}
              </Button>
            </div>
          }
        />

        <Card variant="default">
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#111827', marginBottom: '12px' }}>
              {request.requestType}
            </h3>
            <Badge variant={request.status === 'PENDING_REVIEW' ? 'yellow' : request.status === 'APPROVED' ? 'green' : 'red'}>
              {request.status === 'PENDING_REVIEW' ? t('pendingReview') : request.status === 'APPROVED' ? t('approved') : t('rejected')}
            </Badge>
          </div>

          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600', marginBottom: '4px' }}>{t('employee')}</p>
              <p style={{ fontSize: '16px', color: '#111827', fontWeight: '800' }}>
                {request.employee?.displayName || '-'}
              </p>
            </div>
            {request.description && (
              <div>
                <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600', marginBottom: '4px' }}>{t('description')}</p>
                <p style={{ fontSize: '15px', color: '#111827', fontWeight: '600' }}>{request.description}</p>
              </div>
            )}
            <div>
              <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600', marginBottom: '4px' }}>{t('createdAt')}</p>
              <p style={{ fontSize: '15px', color: '#111827', fontWeight: '600' }}>
                {new Date(request.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
