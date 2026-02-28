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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionCtx, setActionCtx] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (params.id) fetchRequest();
  }, [params.id]);

  const fetchRequest = async () => {
    try {
      setLoadError(null);

      const res = await fetch(`/api/hr/requests/${params.id}`);
      if (!res.ok) {
        if (res.status === 403) {
          setLoadError(locale === 'ar' ? 'غير مصرح لك بعرض هذا الطلب' : 'Forbidden');
        } else if (res.status === 404) {
          setLoadError(locale === 'ar' ? 'الطلب غير موجود' : 'Not found');
        } else {
          setLoadError(locale === 'ar' ? 'حدث خطأ' : 'Error');
        }
        setRequest(null);
        return;
      }

      const data = await res.json();
      setRequest(data);

      const ctxRes = await fetch(`/api/hr/requests/${params.id}/action-context`);
      if (ctxRes.ok) {
        setActionCtx(await ctxRes.json());
      }
    } catch (error) {
      console.error('Error:', error);
      setLoadError(locale === 'ar' ? 'حدث خطأ' : 'Error');
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
              {loadError || t('requestNotFound')}
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
              {request.type}
            </h3>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <Badge variant={request.status === 'PENDING_REVIEW' || request.status === 'PENDING_APPROVAL' ? 'yellow' : request.status === 'APPROVED' ? 'green' : 'red'}>
                {request.status === 'PENDING_REVIEW' || request.status === 'PENDING_APPROVAL'
                  ? t('pendingReview')
                  : request.status === 'APPROVED'
                    ? t('approved')
                    : t('rejected')}
              </Badge>

              {actionCtx?.stepName && (
                <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 700 }}>
                  {actionCtx.stepName}
                </span>
              )}
            </div>

            {actionCtx?.canProcess && (
              <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Button
                  variant="primary"
                  disabled={processing}
                  onClick={async () => {
                    try {
                      setProcessing(true)
                      const res = await fetch(`/api/hr/requests/${params.id}/process-step`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'approve' })
                      })
                      const data = await res.json().catch(() => ({}))
                      if (!res.ok) throw new Error(data?.error || 'فشل')
                      await fetchRequest()
                    } catch (e: any) {
                      alert(e?.message || 'حدث خطأ')
                    } finally {
                      setProcessing(false)
                    }
                  }}
                >
                  ✅ اعتماد
                </Button>

                <Button
                  variant="outline"
                  disabled={processing}
                  onClick={async () => {
                    const reason = prompt('سبب الرفض (مطلوب)')
                    if (!reason || reason.trim().length === 0) return
                    try {
                      setProcessing(true)
                      const res = await fetch(`/api/hr/requests/${params.id}/process-step`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'reject', comment: reason })
                      })
                      const data = await res.json().catch(() => ({}))
                      if (!res.ok) throw new Error(data?.error || 'فشل')
                      await fetchRequest()
                    } catch (e: any) {
                      alert(e?.message || 'حدث خطأ')
                    } finally {
                      setProcessing(false)
                    }
                  }}
                >
                  ❌ رفض
                </Button>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600', marginBottom: '4px' }}>{t('employee')}</p>
              <p style={{ fontSize: '16px', color: '#111827', fontWeight: '800' }}>
                {request.employee?.displayName || '-'}
              </p>
            </div>
            {/* Show key fields depending on request type */}
            {request.type === 'LEAVE' && (
              <div>
                <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600', marginBottom: '4px' }}>{t('leaveType')}</p>
                <p style={{ fontSize: '15px', color: '#111827', fontWeight: '800' }}>{request.leaveType || '-'}</p>
                <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600', marginTop: 10, marginBottom: '4px' }}>{t('startDate')}</p>
                <p style={{ fontSize: '15px', color: '#111827', fontWeight: '600' }}>{request.startDate ? new Date(request.startDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US') : '-'}</p>
                <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600', marginTop: 10, marginBottom: '4px' }}>{t('endDate')}</p>
                <p style={{ fontSize: '15px', color: '#111827', fontWeight: '600' }}>{request.endDate ? new Date(request.endDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US') : '-'}</p>

                {(request.reason || request.recipientOrganization) && (
                  <>
                    <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600', marginTop: 10, marginBottom: '4px' }}>{t('notes')}</p>
                    <p style={{ fontSize: '15px', color: '#111827', fontWeight: '600', whiteSpace: 'pre-wrap' }}>{request.reason || request.recipientOrganization}</p>
                  </>
                )}
              </div>
            )}

            {(request.type === 'VISA_EXIT_REENTRY_SINGLE' || request.type === 'VISA_EXIT_REENTRY_MULTI') && (
              <div>
                <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600', marginBottom: '4px' }}>{t('departureDate')}</p>
                <p style={{ fontSize: '15px', color: '#111827', fontWeight: '600' }}>{request.departureDate ? new Date(request.departureDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US') : '-'}</p>
                <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600', marginTop: 10, marginBottom: '4px' }}>{t('returnDate')}</p>
                <p style={{ fontSize: '15px', color: '#111827', fontWeight: '600' }}>{request.returnDate ? new Date(request.returnDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US') : '-'}</p>
                <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600', marginTop: 10, marginBottom: '4px' }}>{t('reason')}</p>
                <p style={{ fontSize: '15px', color: '#111827', fontWeight: '600', whiteSpace: 'pre-wrap' }}>{request.reason || '-'}</p>
              </div>
            )}

            {(request.type === 'TICKET_ALLOWANCE' || request.type === 'FLIGHT_BOOKING') && (
              <div>
                <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600', marginBottom: '4px' }}>{t('destination')}</p>
                <p style={{ fontSize: '15px', color: '#111827', fontWeight: '600' }}>{request.destination || '-'}</p>
              </div>
            )}

            {request.type === 'SALARY_CERTIFICATE' && (
              <div>
                <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600', marginBottom: '4px' }}>{t('purpose')}</p>
                <p style={{ fontSize: '15px', color: '#111827', fontWeight: '600', whiteSpace: 'pre-wrap' }}>{request.purpose || '-'}</p>
              </div>
            )}

            {request.type === 'HOUSING_ALLOWANCE' && (
              <div>
                <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600', marginBottom: '4px' }}>{t('amount')}</p>
                <p style={{ fontSize: '15px', color: '#111827', fontWeight: '800' }}>{request.amount ?? '-'}</p>
                <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600', marginTop: 10, marginBottom: '4px' }}>{t('period')}</p>
                <p style={{ fontSize: '15px', color: '#111827', fontWeight: '600' }}>{request.period || '-'}</p>
              </div>
            )}

            {request.type === 'RESIGNATION' && (
              <div>
                <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600', marginBottom: '4px' }}>{t('endDate')}</p>
                <p style={{ fontSize: '15px', color: '#111827', fontWeight: '600' }}>{request.endDate ? new Date(request.endDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US') : '-'}</p>
                <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600', marginTop: 10, marginBottom: '4px' }}>{t('reason')}</p>
                <p style={{ fontSize: '15px', color: '#111827', fontWeight: '600', whiteSpace: 'pre-wrap' }}>{request.reason || '-'}</p>
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
