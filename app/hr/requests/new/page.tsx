'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Input, Textarea, Select } from '@/components/ui/Input';
import FileUpload, { UploadedFile } from '@/components/FileUpload';
import { useI18n } from '@/lib/useI18n';

export default function NewHRRequestPage() {
  const router = useRouter();
  const { dir, t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<any>(null);
  const [leaveBalanceError, setLeaveBalanceError] = useState<string>('');

  const [formData, setFormData] = useState({
    type: '' as string,
    // Leave
    startDate: '',
    endDate: '',
    leaveType: '',
    // Common
    destination: '',
    travelDate: '',
    departureDate: '',
    returnDate: '',
    amount: '' as any,
    period: '',
    purpose: '',
    recipientOrganization: '',
    reason: ''
  });

  // Fetch leave balance when the user selects LEAVE (UX only; server enforces balance too)
  useEffect(() => {
    if (formData.type !== 'LEAVE') return;

    let cancelled = false;
    setLeaveBalanceError('');

    fetch('/api/hr/leave-balance')
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data?.error || 'failed');
        return data;
      })
      .then((data) => {
        if (!cancelled) setLeaveBalance(data);
      })
      .catch((e) => {
        if (!cancelled) setLeaveBalanceError(String(e?.message || e));
      });

    return () => {
      cancelled = true;
    };
  }, [formData.type]);

  const requestedLeaveDays = useMemo(() => {
    if (formData.type !== 'LEAVE' || !formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return 0;

    // Simple day count (inclusive). Note: backend uses working-days logic.
    const diff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff + 1;
  }, [formData.type, formData.startDate, formData.endDate]);

  const availableAfterPending = leaveBalance?.balance?.availableAfterPending;
  const leaveInsufficient = typeof availableAfterPending === 'number' && requestedLeaveDays > 0 && requestedLeaveDays > availableAfterPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.type) {
      alert(t('requiredFields'));
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        type: formData.type,
        ...(formData.startDate ? { startDate: formData.startDate } : {}),
        ...(formData.endDate ? { endDate: formData.endDate } : {}),
        ...(formData.leaveType ? { leaveType: formData.leaveType } : {}),
        ...(formData.destination ? { destination: formData.destination } : {}),
        ...(formData.travelDate ? { travelDate: formData.travelDate } : {}),
        ...(formData.departureDate ? { departureDate: formData.departureDate } : {}),
        ...(formData.returnDate ? { returnDate: formData.returnDate } : {}),
        ...(formData.amount !== '' && formData.amount !== null && formData.amount !== undefined
          ? { amount: Number(formData.amount) }
          : {}),
        ...(formData.period ? { period: formData.period } : {}),
        ...(formData.purpose ? { purpose: formData.purpose } : {}),
        ...(formData.recipientOrganization ? { recipientOrganization: formData.recipientOrganization } : {}),
        ...(formData.reason ? { reason: formData.reason } : {}),
        ...(attachments.length > 0 ? { attachments } : {}),
      };

      const res = await fetch('/api/hr/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert(t('requestCreated')); 
        router.push('/hr/requests');
      } else {
        const data = await res.json();
        alert(data.error || t('errorOccurred'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert(t('requestSendError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir={dir} style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <PageHeader
          title={`➕ ${t('newRequest')}`}
          breadcrumbs={[t('home'), t('hr'), t('hrRequests'), t('new')]}
          actions={
            <Button variant="outline" onClick={() => router.push('/hr/requests')}>
              ← {t('back')}
            </Button>
          }
        />

        <Card variant="default">
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gap: '24px' }}>
              <Select
                label={`${t('requestType')} *`}
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
              >
                <option value="">{t('selectRequestType')}</option>
                <option value="LEAVE">{t('hrTypeLeave')}</option>
                <option value="TICKET_ALLOWANCE">{t('hrTypeTicketAllowance')}</option>
                <option value="FLIGHT_BOOKING">{t('hrTypeFlightBooking')}</option>
                <option value="SALARY_CERTIFICATE">{t('hrTypeSalaryCertificate')}</option>
                <option value="HOUSING_ALLOWANCE">{t('hrTypeHousingAllowance')}</option>
                <option value="VISA_EXIT_REENTRY_SINGLE">{t('hrTypeVisaSingle')}</option>
                <option value="VISA_EXIT_REENTRY_MULTI">{t('hrTypeVisaMulti')}</option>
                <option value="RESIGNATION">{t('hrTypeResignation')}</option>
              </Select>

              {formData.type === 'LEAVE' && (
                <>
                  <Input
                    label={`${t('startDate')} *`}
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                  <Input
                    label={`${t('endDate')} *`}
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                  <Select
                    label={`${t('leaveType')} *`}
                    value={formData.leaveType}
                    onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                    required
                  >
                    <option value="">—</option>
                    <option value="annual">{t('leaveAnnual')}</option>
                    <option value="sick">{t('leaveSick')}</option>
                    <option value="emergency">{t('leaveEmergency')}</option>
                  </Select>

                  {/* Leave balance widget (UX) */}
                  <div style={{
                    padding: '14px 16px',
                    borderRadius: 12,
                    border: '1px solid #E5E7EB',
                    background: leaveInsufficient ? '#FEF3C7' : '#F3F4F6',
                    color: '#111827'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ fontWeight: 900 }}>🌴 رصيد الإجازات</div>
                      {requestedLeaveDays > 0 && (
                        <div style={{ fontWeight: 800 }}>
                          الأيام المطلوبة: {requestedLeaveDays}
                        </div>
                      )}
                    </div>

                    {leaveBalanceError ? (
                      <div style={{ marginTop: 8, color: '#B91C1C', fontWeight: 700 }}>
                        ⚠️ تعذر جلب رصيد الإجازات: {leaveBalanceError}
                      </div>
                    ) : leaveBalance?.balance ? (
                      <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                        <div>المتبقي: <strong>{leaveBalance.balance.remaining}</strong></div>
                        <div>معلّق: <strong>{leaveBalance.balance.pending}</strong></div>
                        <div>المتاح بعد المعلّق: <strong>{leaveBalance.balance.availableAfterPending}</strong></div>
                      </div>
                    ) : (
                      <div style={{ marginTop: 8, color: '#6B7280' }}>جاري تحميل الرصيد…</div>
                    )}

                    {leaveInsufficient && (
                      <div style={{ marginTop: 10, fontWeight: 800, color: '#92400E' }}>
                        ⚠️ الأيام المطلوبة تتجاوز المتاح بعد الطلبات المعلّقة.
                      </div>
                    )}
                  </div>

                  {/* Attachments placeholder */}
                  <div style={{ marginTop: 4 }}>
                    <div style={{ fontWeight: 800, marginBottom: 8 }}>📎 مرفقات (اختياري)</div>
                    <FileUpload onUpload={setAttachments} />
                  </div>
                </>
              )}

              {(formData.type === 'TICKET_ALLOWANCE' || formData.type === 'FLIGHT_BOOKING') && (
                <Input
                  label={`${t('destination')} *`}
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  required
                />
              )}

              {formData.type === 'TICKET_ALLOWANCE' && (
                <>
                  <Input
                    label={`${t('travelDate')} *`}
                    type="date"
                    value={formData.travelDate}
                    onChange={(e) => setFormData({ ...formData, travelDate: e.target.value })}
                    required
                  />
                  <Input
                    label={`${t('amount')} *`}
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </>
              )}

              {formData.type === 'FLIGHT_BOOKING' && (
                <>
                  <Input
                    label={`${t('departureDate')} *`}
                    type="date"
                    value={formData.departureDate}
                    onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                    required
                  />
                  <Input
                    label={`${t('returnDate')} *`}
                    type="date"
                    value={formData.returnDate}
                    onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                    required
                  />
                </>
              )}

              {formData.type === 'SALARY_CERTIFICATE' && (
                <Textarea
                  label={`${t('purpose')} *`}
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  rows={3}
                  placeholder={t('writeDetailsHere')}
                  required
                />
              )}

              {formData.type === 'HOUSING_ALLOWANCE' && (
                <>
                  <Input
                    label={`${t('amount')} *`}
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                  <Input
                    label={`${t('period')} *`}
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                    required
                  />
                </>
              )}

              {(formData.type === 'VISA_EXIT_REENTRY_SINGLE' || formData.type === 'VISA_EXIT_REENTRY_MULTI') && (
                <>
                  <Input
                    label={`${t('departureDate')} *`}
                    type="date"
                    value={formData.departureDate}
                    onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                    required
                  />
                  <Input
                    label={`${t('returnDate')} *`}
                    type="date"
                    value={formData.returnDate}
                    onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                    required
                  />
                  <Textarea
                    label={`${t('reason')} *`}
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    rows={3}
                    placeholder={t('writeDetailsHere')}
                    required
                  />
                </>
              )}

              {formData.type === 'RESIGNATION' && (
                <>
                  <Input
                    label={`${t('endDate')} *`}
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                  <Textarea
                    label={`${t('reason')} *`}
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    rows={3}
                    placeholder={t('writeDetailsHere')}
                    required
                  />
                </>
              )}

              {/* Optional */}
              <Textarea
                label={t('notes')}
                value={formData.recipientOrganization}
                onChange={(e) => setFormData({ ...formData, recipientOrganization: e.target.value })}
                rows={2}
                placeholder={t('notesOptional')}
              />

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #E5E7EB' }}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/hr/requests')}
                  disabled={loading}
                >
                  {t('cancel')}
                </Button>
                <Button
                  type="submit"
                  variant="success"
                  loading={loading}
                >
                  📝 {t('submit')}
                </Button>
              </div>
            </div>
          </form>
        </Card>

        {/* Help Card */}
        <Card variant="outlined" style={{ marginTop: '24px', background: '#F0F9FF' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#111827', marginBottom: '12px' }}>
            💡 نصائح عند إنشاء الطلب:
          </h3>
          <ul style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.8', paddingRight: '20px' }}>
            <li>اختر نوع الطلب المناسب بدقة</li>
            <li>اكتب وصفاً واضحاً ومفصلاً</li>
            <li>حدد الأولوية بناءً على الاستعجال الفعلي</li>
            <li>أرفق أي مستندات داعمة إن وجدت</li>
            <li>سيتم إشعارك عند مراجعة الطلب</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
