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
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoaded, setAuditLoaded] = useState(false);
  const [actionModal, setActionModal] = useState<{ open: boolean; action: 'approve' | 'reject' | null }>({
    open: false,
    action: null
  });
  const [actionComment, setActionComment] = useState('');

  const [sendBackModal, setSendBackModal] = useState<{ open: boolean; target: 'REQUESTER' | 'PREVIOUS_STEP' }>(
    { open: false, target: 'REQUESTER' }
  );
  const [sendBackComment, setSendBackComment] = useState('');

  const [delegateModal, setDelegateModal] = useState<{ open: boolean; selectedUserIds: string[] }>(() => ({ open: false, selectedUserIds: [] }));
  const [delegateQuery, setDelegateQuery] = useState('');
  const [delegateComment, setDelegateComment] = useState('');
  const [delegateMode, setDelegateMode] = useState<'SINGLE' | 'POOL'>('SINGLE');
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);

  useEffect(() => {
    if (params.id) fetchRequest();
  }, [params.id]);

  const ensureUsers = async () => {
    if (usersLoaded) return;
    try {
      const res = await fetch('/api/users');
      if (!res.ok) return;
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
      setUsersLoaded(true);
    } catch {
      // ignore
    }
  };

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

      // audit timeline (for approvers/admin/hr only; requester won't see it)
      const auditRes = await fetch(`/api/hr/requests/${params.id}/audit`);
      if (auditRes.ok) {
        const a = await auditRes.json().catch(() => ({}));
        setAuditLogs(a.logs || []);
        setAuditLoaded(true);
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

            {(actionCtx?.canProcess || actionCtx?.canResubmit) && (
              <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {actionCtx?.canProcess && (
                  <>
                    <Button
                      variant="primary"
                      disabled={processing}
                      onClick={() => {
                        setActionComment('')
                        setActionModal({ open: true, action: 'approve' })
                      }}
                    >
                      ✅ اعتماد
                    </Button>

                    <Button
                      variant="outline"
                      disabled={processing}
                      onClick={() => {
                        setActionComment('')
                        setActionModal({ open: true, action: 'reject' })
                      }}
                    >
                      ❌ رفض
                    </Button>

                    <Button
                      variant="outline"
                      disabled={processing}
                      onClick={() => {
                        setSendBackComment('')
                        setSendBackModal({ open: true, target: 'REQUESTER' })
                      }}
                    >
                      ↩️ إرجاع
                    </Button>

                    <Button
                      variant="outline"
                      disabled={processing}
                      onClick={async () => {
                        await ensureUsers()
                        setDelegateQuery('')
                        setDelegateComment('')
                        setDelegateMode('SINGLE')
                        setDelegateModal({ open: true, selectedUserIds: [] })
                      }}
                    >
                      👤 إحالة
                    </Button>
                  </>
                )}

                {actionCtx?.canResubmit && (
                  <Button
                    variant="primary"
                    disabled={processing}
                    onClick={async () => {
                      const comment = prompt('تعليق إعادة الإرسال (مطلوب)')
                      if (!comment || comment.trim().length === 0) return
                      try {
                        setProcessing(true)
                        const res = await fetch(`/api/hr/requests/${params.id}/resubmit`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ comment })
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
                    🔁 إعادة إرسال
                  </Button>
                )}
              </div>
            )}

            {actionModal.open && actionModal.action && (
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(15, 23, 42, 0.45)',
                  zIndex: 80,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 16
                }}
                onClick={() => {
                  if (processing) return
                  setActionModal({ open: false, action: null })
                }}
              >
                <div
                  dir={dir}
                  style={{
                    width: '100%',
                    maxWidth: 520,
                    background: '#FFFFFF',
                    borderRadius: 16,
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
                    padding: 16
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                    <div style={{ fontWeight: 900, fontSize: 16, color: '#0F172A' }}>
                      {actionModal.action === 'approve' ? 'تعليق الموافقة (مطلوب)' : 'سبب الرفض (مطلوب)'}
                    </div>
                    <button
                      type="button"
                      onClick={() => setActionModal({ open: false, action: null })}
                      disabled={processing}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        fontSize: 20,
                        cursor: 'pointer',
                        color: '#64748B'
                      }}
                    >
                      ×
                    </button>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <textarea
                      value={actionComment}
                      onChange={(e) => setActionComment(e.target.value)}
                      rows={4}
                      style={{
                        width: '100%',
                        borderRadius: 12,
                        border: '1px solid #CBD5E1',
                        padding: 12,
                        fontSize: 14,
                        outline: 'none'
                      }}
                      placeholder={actionModal.action === 'approve' ? 'اكتب تعليق الموافقة...' : 'اكتب سبب الرفض...'}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                    <Button
                      variant="outline"
                      disabled={processing}
                      onClick={() => setActionModal({ open: false, action: null })}
                    >
                      {t('cancel')}
                    </Button>
                    <Button
                      variant={actionModal.action === 'approve' ? 'primary' : 'danger'}
                      disabled={processing}
                      onClick={async () => {
                        const comment = actionComment.trim()
                        if (!comment) {
                          alert(actionModal.action === 'approve' ? 'تعليق الموافقة مطلوب' : 'سبب الرفض مطلوب')
                          return
                        }

                        try {
                          setProcessing(true)
                          const res = await fetch(`/api/hr/requests/${params.id}/process-step`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: actionModal.action, comment })
                          })
                          const data = await res.json().catch(() => ({}))
                          if (!res.ok) throw new Error(data?.error || 'فشل')

                          setActionModal({ open: false, action: null })
                          await fetchRequest()
                        } catch (e: any) {
                          alert(e?.message || 'حدث خطأ')
                        } finally {
                          setProcessing(false)
                        }
                      }}
                    >
                      {actionModal.action === 'approve' ? 'اعتماد' : 'رفض'}
                    </Button>
                  </div>
                </div>
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

        {/* Timeline (visible to approvers/admin/hr; requester won't see it) */}
        {auditLoaded && actionCtx && !actionCtx.isOwner && !actionCtx.canResubmit && (
          <Card variant="default" style={{ marginTop: 16, marginBottom: 16 }}>
            <div style={{ padding: 16 }}>
              <div style={{ fontWeight: 900, marginBottom: 10 }}>🧾 سجل المعاملة</div>

              {auditLogs.length === 0 ? (
                <div style={{ color: '#6B7280' }}>لا يوجد سجل حتى الآن.</div>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {auditLogs.map((l: any) => {
                    const action = String(l.action || '')
                    const actionLabel =
                      action.includes('APPROV') ? 'تمت الموافقة' :
                      action.includes('REJECT') ? 'تم الرفض' :
                      action.includes('SEND_BACK') ? 'تم الإرجاع' :
                      action.includes('DELEGATION') ? 'تمت الإحالة' :
                      action.includes('RESUBMIT') ? 'تمت إعادة الإرسال' :
                      'تم تحديث الطلب'

                    return (
                      <div key={l.id} style={{
                        background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
                        border: '1px solid #E2E8F0',
                        borderRadius: 14,
                        padding: 12,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'baseline' }}>
                          <div style={{ fontWeight: 900, color: '#0F172A' }}>{actionLabel}</div>
                          <div style={{ color: '#64748B', fontSize: 12 }}>{new Date(l.createdAt).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}</div>
                        </div>

                        <div style={{ marginTop: 6, color: '#0F172A', fontWeight: 800 }}>
                          {l.actor?.displayName || '—'}
                        </div>

                        {l.message && (
                          <div style={{ marginTop: 6, color: '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                            {l.message}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Send-back modal */}
        {sendBackModal.open && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.45)',
              zIndex: 80,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16
            }}
            onClick={() => {
              if (processing) return
              setSendBackModal({ open: false, target: 'REQUESTER' })
            }}
          >
            <div
              dir={dir}
              style={{
                width: '100%',
                maxWidth: 560,
                background: '#FFFFFF',
                borderRadius: 16,
                border: '1px solid #E2E8F0',
                boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
                padding: 16
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                <div style={{ fontWeight: 900, fontSize: 16, color: '#0F172A' }}>↩️ إرجاع الطلب</div>
                <button
                  type="button"
                  onClick={() => setSendBackModal({ open: false, target: 'REQUESTER' })}
                  disabled={processing}
                  style={{ border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer', color: '#64748B' }}
                >
                  ×
                </button>
              </div>

              <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setSendBackModal({ open: true, target: 'REQUESTER' })}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: sendBackModal.target === 'REQUESTER' ? '1px solid #2563EB' : '1px solid #CBD5E1',
                      background: sendBackModal.target === 'REQUESTER' ? 'rgba(37, 99, 235, 0.08)' : '#FFFFFF',
                      fontWeight: 900,
                      cursor: 'pointer'
                    }}
                  >
                    مقدم الطلب
                  </button>
                  <button
                    type="button"
                    onClick={() => setSendBackModal({ open: true, target: 'PREVIOUS_STEP' })}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: sendBackModal.target === 'PREVIOUS_STEP' ? '1px solid #2563EB' : '1px solid #CBD5E1',
                      background: sendBackModal.target === 'PREVIOUS_STEP' ? 'rgba(37, 99, 235, 0.08)' : '#FFFFFF',
                      fontWeight: 900,
                      cursor: 'pointer'
                    }}
                  >
                    الخطوة السابقة
                  </button>
                </div>

                <textarea
                  value={sendBackComment}
                  onChange={(e) => setSendBackComment(e.target.value)}
                  rows={4}
                  style={{
                    width: '100%',
                    borderRadius: 12,
                    border: '1px solid #CBD5E1',
                    padding: 12,
                    fontSize: 14,
                    outline: 'none'
                  }}
                  placeholder="سبب الإرجاع (مطلوب)"
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <Button variant="outline" disabled={processing} onClick={() => setSendBackModal({ open: false, target: 'REQUESTER' })}>
                    {t('cancel')}
                  </Button>
                  <Button
                    variant="primary"
                    disabled={processing}
                    onClick={async () => {
                      const comment = sendBackComment.trim()
                      if (!comment) {
                        alert('سبب الإرجاع مطلوب')
                        return
                      }
                      try {
                        setProcessing(true)
                        const res = await fetch(`/api/hr/requests/${params.id}/send-back`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ target: sendBackModal.target, comment })
                        })
                        const data = await res.json().catch(() => ({}))
                        if (!res.ok) throw new Error(data?.error || 'فشل')
                        setSendBackModal({ open: false, target: 'REQUESTER' })
                        await fetchRequest()
                      } catch (e: any) {
                        alert(e?.message || 'حدث خطأ')
                      } finally {
                        setProcessing(false)
                      }
                    }}
                  >
                    تأكيد الإرجاع
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delegate modal */}
        {delegateModal.open && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.45)',
              zIndex: 80,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16
            }}
            onClick={() => {
              if (processing) return
              setDelegateModal({ open: false, selectedUserIds: [] })
            }}
          >
            <div
              dir={dir}
              style={{
                width: '100%',
                maxWidth: 560,
                background: '#FFFFFF',
                borderRadius: 16,
                border: '1px solid #E2E8F0',
                boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
                padding: 16
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                <div style={{ fontWeight: 900, fontSize: 16, color: '#0F172A' }}>👤 إحالة / توزيع</div>
                <button
                  type="button"
                  onClick={() => setDelegateModal({ open: false, selectedUserIds: [] })}
                  disabled={processing}
                  style={{ border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer', color: '#64748B' }}
                >
                  ×
                </button>
              </div>

              <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setDelegateMode('SINGLE')
                      setDelegateModal((p) => ({ ...p, selectedUserIds: p.selectedUserIds.slice(0, 1) }))
                    }}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: delegateMode === 'SINGLE' ? '1px solid #2563EB' : '1px solid #CBD5E1',
                      background: delegateMode === 'SINGLE' ? 'rgba(37, 99, 235, 0.08)' : '#FFFFFF',
                      fontWeight: 900,
                      cursor: 'pointer'
                    }}
                  >
                    لشخص واحد
                  </button>
                  <button
                    type="button"
                    onClick={() => setDelegateMode('POOL')}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: delegateMode === 'POOL' ? '1px solid #2563EB' : '1px solid #CBD5E1',
                      background: delegateMode === 'POOL' ? 'rgba(37, 99, 235, 0.08)' : '#FFFFFF',
                      fontWeight: 900,
                      cursor: 'pointer'
                    }}
                  >
                    Pool (عدة أشخاص)
                  </button>
                </div>

                <input
                  value={delegateQuery}
                  onChange={(e) => setDelegateQuery(e.target.value)}
                  placeholder="ابحث بالاسم أو اليوزر"
                  style={{
                    width: '100%',
                    borderRadius: 12,
                    border: '1px solid #CBD5E1',
                    padding: 12,
                    fontSize: 14,
                    outline: 'none'
                  }}
                />

                <div style={{ color: '#6B7280', fontSize: 12 }}>
                  المختارين: {delegateModal.selectedUserIds.length} {delegateMode === 'POOL' ? '(Pool)' : ''}
                </div>

                <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ maxHeight: 280, overflow: 'auto' }}>
                    {(users
                      .filter((u: any) => {
                        const q = delegateQuery.trim().toLowerCase()
                        if (!q) return true
                        return (
                          (u.displayName || '').toLowerCase().includes(q) ||
                          (u.username || '').toLowerCase().includes(q)
                        )
                      })
                      .slice(0, 50)
                      .map((u: any) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            if (delegateMode === 'SINGLE') {
                              setDelegateModal({ open: true, selectedUserIds: [u.id] })
                            } else {
                              setDelegateModal((p) => {
                                const set = new Set(p.selectedUserIds)
                                if (set.has(u.id)) set.delete(u.id)
                                else set.add(u.id)
                                return { ...p, selectedUserIds: Array.from(set) }
                              })
                            }
                          }}
                          style={{
                            width: '100%',
                            textAlign: 'start',
                            padding: 12,
                            border: 'none',
                            borderTop: '1px solid #E2E8F0',
                            background: delegateMode === 'POOL' && delegateModal.selectedUserIds.includes(u.id) ? 'rgba(37, 99, 235, 0.08)' : '#FFFFFF',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ fontWeight: 900, color: '#0F172A' }}>{u.displayName}</div>
                          <div style={{ fontSize: 12, color: '#64748B' }}>
                            {(u.jobTitle || '').trim() ? u.jobTitle : u.role}
                          </div>
                        </button>
                      )))}
                  </div>
                </div>

                <textarea
                  value={delegateComment}
                  onChange={(e) => setDelegateComment(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    borderRadius: 12,
                    border: '1px solid #CBD5E1',
                    padding: 12,
                    fontSize: 14,
                    outline: 'none'
                  }}
                  placeholder="سبب الإحالة (مطلوب)"
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <Button variant="outline" disabled={processing} onClick={() => setDelegateModal({ open: false, selectedUserIds: [] })}>
                    {t('cancel')}
                  </Button>
                  <Button
                    variant="primary"
                    disabled={processing}
                    onClick={async () => {
                      const delegatedToUserIds = delegateModal.selectedUserIds
                      const comment = delegateComment.trim()
                      if (!delegatedToUserIds || delegatedToUserIds.length === 0) {
                        alert('اختر موظف من القائمة')
                        return
                      }
                      if (!comment) {
                        alert('سبب الإحالة مطلوب')
                        return
                      }
                      try {
                        setProcessing(true)
                        const res = await fetch(`/api/hr/requests/${params.id}/delegate`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ delegatedToUserIds, comment })
                        })
                        const data = await res.json().catch(() => ({}))
                        if (!res.ok) throw new Error(data?.error || 'فشل')
                        setDelegateModal({ open: false, selectedUserIds: [] })
                        await fetchRequest()
                      } catch (e: any) {
                        alert(e?.message || 'حدث خطأ')
                      } finally {
                        setProcessing(false)
                      }
                    }}
                  >
                    تأكيد الإحالة
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
