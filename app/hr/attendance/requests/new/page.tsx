'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { CardEnhanced, CardBody, CardHeader } from '@/components/ui/CardEnhanced';
import { ResponsiveContainer, ResponsiveGrid } from '@/components/layout/ResponsiveContainer';
import { FloatingInput, FloatingTextarea } from '@/components/ui/FormEnhanced';
import FileUpload, { UploadedFile } from '@/components/FileUpload';
import { SkeletonCard } from '@/components/ui/LoadingStates';

interface ProblematicDay {
  id: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
  workHours: number | null;
  requiredHours: number;
  missingHours: number;
  status: string;
  problemReason: string;
  expectedDeduction: number;
  hasExcuseRequest: boolean;
  excuseRequestStatus: string | null;
}

interface ApiResponse {
  records: ProblematicDay[];
  summary: {
    totalDays: number;
    totalDeductions: number;
    pendingRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
  };
}

interface HistoryItem {
  id: string;
  requestDate: Date;
  reason: string;
  status: string;
  createdAt: Date;
  reviewedAt: Date | null;
  reviewerName: string | null;
  daysSince: number;
  attendanceRecord: {
    status: string;
    workHours: number | null;
  } | null;
}

interface HistoryStats {
  total: number;
  approved: number;
  rejected: number;
  pending: number;
  approvalRate: number;
}

export default function NewAttendanceRequestPageEnhanced() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingDays, setLoadingDays] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [problematicDays, setProblematicDays] = useState<ProblematicDay[]>([]);
  const [summary, setSummary] = useState<ApiResponse['summary'] | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyStats, setHistoryStats] = useState<HistoryStats | null>(null);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    type: 'EXCUSE',
    reason: '',
    permissionDate: ''
  });
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);

  useEffect(() => {
    if (formData.type === 'EXCUSE') {
      fetchProblematicDays();
      fetchCorrectionHistory();
    }
  }, [formData.type]);

  const fetchProblematicDays = async () => {
    try {
      setLoadingDays(true);
      const res = await fetch('/api/hr/attendance/problematic-days');
      if (res.ok) {
        const data: ApiResponse = await res.json();
        setProblematicDays(data.records);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Error fetching problematic days:', error);
    } finally {
      setLoadingDays(false);
    }
  };

  const fetchCorrectionHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await fetch('/api/hr/attendance/correction-history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
        setHistoryStats(data.stats || null);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const toggleDate = (dateStr: string) => {
    const newSelected = new Set(selectedDates);
    if (newSelected.has(dateStr)) {
      newSelected.delete(dateStr);
    } else {
      newSelected.add(dateStr);
    }
    setSelectedDates(newSelected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.type === 'EXCUSE' && selectedDates.size === 0) {
      alert('⚠️ الرجاء اختيار يوم واحد على الأقل');
      return;
    }

    if (formData.type === 'PERMISSION' && !formData.permissionDate) {
      alert('⚠️ الرجاء تحديد تاريخ الاستئذان');
      return;
    }

    if (!formData.reason.trim()) {
      alert('⚠️ الرجاء كتابة سبب الطلب');
      return;
    }

    try {
      setLoading(true);

      const attachmentData = attachments.length > 0 ? JSON.stringify(attachments) : null;

      if (formData.type === 'EXCUSE') {
        const promises = Array.from(selectedDates).map(dateStr =>
          fetch('/api/hr/attendance/requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: formData.type,
              requestDate: dateStr,
              reason: formData.reason,
              attachment: attachmentData
            })
          })
        );

        const results = await Promise.all(promises);
        const allSuccess = results.every(res => res.ok);

        if (allSuccess) {
          alert(`✅ تم إرسال ${selectedDates.size} طلب بنجاح`);
          router.push('/hr/attendance/requests');
        } else {
          alert('⚠️ بعض الطلبات فشلت، الرجاء المحاولة مرة أخرى');
        }
      } else if (formData.type === 'PERMISSION') {
        const res = await fetch('/api/hr/attendance/requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: formData.type,
            requestDate: formData.permissionDate,
            reason: formData.reason,
            attachment: attachmentData
          })
        });

        if (res.ok) {
          alert('✅ تم إرسال طلب الاستئذان بنجاح');
          router.push('/hr/attendance/requests');
        } else {
          alert('❌ حدث خطأ أثناء إرسال الطلب');
        }
      }
    } catch (error) {
      console.error('Error creating request:', error);
      alert('❌ حدث خطأ أثناء إرسال الطلب');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string; text: string; icon: string }> = {
      LATE: { bg: '#FEF3C7', color: '#92400E', text: 'متأخر', icon: '⏰' },
      ABSENT: { bg: '#FEE2E2', color: '#991B1B', text: 'غائب', icon: '❌' }
    };
    const config = map[status] || map.LATE;
    return (
      <span
        style={{
          background: config.bg,
          color: config.color,
          padding: '6px 12px',
          borderRadius: '12px',
          fontSize: '13px',
          fontWeight: '600',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        <span>{config.icon}</span>
        <span>{config.text}</span>
      </span>
    );
  };

  const getExcuseStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string; text: string }> = {
      PENDING: { bg: '#FEF3C7', color: '#92400E', text: 'معلق' },
      APPROVED: { bg: '#D1FAE5', color: '#065F46', text: 'موافق' },
      REJECTED: { bg: '#FEE2E2', color: '#991B1B', text: 'مرفوض' }
    };
    const config = map[status] || map.PENDING;
    return (
      <span
        style={{
          background: config.bg,
          color: config.color,
          padding: '4px 10px',
          borderRadius: '10px',
          fontSize: '12px',
          fontWeight: '600'
        }}
      >
        {config.text}
      </span>
    );
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <ResponsiveContainer size="xl">
        <PageHeader
          title="📝 تصحيح الحضور"
          breadcrumbs={['الرئيسية', 'الحضور', 'تصحيح الحضور']}
          actions={
            <Link href="/hr/attendance/requests">
              <button
                style={{
                  background: 'white',
                  color: '#667eea',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ← طلباتي السابقة
              </button>
            </Link>
          }
        />

        {/* Info Banner */}
        <CardEnhanced variant="outlined" style={{ marginBottom: '24px', borderLeft: '4px solid #667eea' }}>
          <CardBody>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ fontSize: '32px' }}>ℹ️</div>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
                  تعليمات مهمة
                </h4>
                <ul style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.8', paddingRight: '20px', margin: 0 }}>
                  <li>اختر نوع الطلب: عذر غياب أو استئذان</li>
                  <li>حدد الأيام أو التاريخ المطلوب</li>
                  <li>اكتب سبب واضح ومحدد</li>
                  <li>يمكنك إرفاق مستندات داعمة (اختياري)</li>
                  <li>سيتم مراجعة الطلب من قبل المسؤولين</li>
                </ul>
              </div>
            </div>
          </CardBody>
        </CardEnhanced>

        <form onSubmit={handleSubmit}>
          <ResponsiveGrid columns={{ mobile: 1, desktop: 1 }} gap="lg">
            {/* Request Type Selection */}
            <CardEnhanced variant="elevated">
              <CardHeader title="1️⃣ اختر نوع الطلب" />
              <CardBody>
                <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, type: 'EXCUSE' });
                      setSelectedDates(new Set());
                    }}
                    style={{
                      padding: '20px',
                      borderRadius: '12px',
                      border: formData.type === 'EXCUSE' ? '2px solid #667eea' : '1px solid #E5E7EB',
                      background: formData.type === 'EXCUSE' ? 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)' : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>📋</div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>
                      عذر غياب
                    </div>
                    <div style={{ fontSize: '13px', color: '#6B7280' }}>
                      لتبرير الأيام المتأخرة أو الغياب
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, type: 'PERMISSION' });
                      setSelectedDates(new Set());
                    }}
                    style={{
                      padding: '20px',
                      borderRadius: '12px',
                      border: formData.type === 'PERMISSION' ? '2px solid #667eea' : '1px solid #E5E7EB',
                      background: formData.type === 'PERMISSION' ? 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)' : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>🚪</div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>
                      استئذان
                    </div>
                    <div style={{ fontSize: '13px', color: '#6B7280' }}>
                      للخروج خلال يوم العمل
                    </div>
                  </button>
                </div>
              </CardBody>
            </CardEnhanced>

            {/* Summary Statistics */}
            {formData.type === 'EXCUSE' && summary && !loadingDays && (
              <ResponsiveGrid columns={{ mobile: 2, tablet: 4, desktop: 4 }} gap="md" style={{ marginBottom: '24px' }}>
                <CardEnhanced variant="elevated">
                  <CardBody compact>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
                      <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '6px' }}>إجمالي الأيام</div>
                      <div style={{ fontSize: '28px', fontWeight: '800', color: '#EF4444' }}>
                        {summary.totalDays}
                      </div>
                    </div>
                  </CardBody>
                </CardEnhanced>

                <CardEnhanced variant="warning">
                  <CardBody compact>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>💰</div>
                      <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '6px' }}>الخصومات المتوقعة</div>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: '#F59E0B' }}>
                        {summary.totalDeductions.toFixed(2)} ر.س
                      </div>
                    </div>
                  </CardBody>
                </CardEnhanced>

                <CardEnhanced variant="gradient">
                  <CardBody compact>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏳</div>
                      <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '6px' }}>قيد المراجعة</div>
                      <div style={{ fontSize: '28px', fontWeight: '800', color: '#667eea' }}>
                        {summary.pendingRequests}
                      </div>
                    </div>
                  </CardBody>
                </CardEnhanced>

                <CardEnhanced variant="success">
                  <CardBody compact>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
                      <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '6px' }}>تمت الموافقة</div>
                      <div style={{ fontSize: '28px', fontWeight: '800', color: '#10B981' }}>
                        {summary.approvedRequests}
                      </div>
                    </div>
                  </CardBody>
                </CardEnhanced>
              </ResponsiveGrid>
            )}

            {/* Date Selection */}
            {formData.type === 'EXCUSE' && (
              <CardEnhanced variant="elevated">
                <CardHeader title={`2️⃣ اختر الأيام (${selectedDates.size} محدد)`} />
                <CardBody>
                  {loadingDays ? (
                    <SkeletonCard />
                  ) : problematicDays.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                      <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
                      <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#10B981', marginBottom: '8px' }}>
                        ممتاز! لا توجد مشاكل حضور
                      </h4>
                      <p style={{ fontSize: '14px', color: '#6B7280' }}>
                        سجل الحضور الخاص بك نظيف
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {problematicDays.map((day) => {
                        const isSelected = selectedDates.has(day.date);
                        const hasRequest = day.hasExcuseRequest;
                        const dayDate = new Date(day.date);
                        const daysOld = Math.floor((Date.now() - dayDate.getTime()) / (1000 * 60 * 60 * 24));
                        const isOld = daysOld > 7 && !hasRequest;
                        const isVeryOld = daysOld > 30 && !hasRequest;

                        return (
                          <button
                            key={day.id}
                            type="button"
                            onClick={() => !hasRequest && toggleDate(day.date)}
                            disabled={hasRequest}
                            style={{
                              padding: '16px',
                              borderRadius: '12px',
                              border: isSelected ? '2px solid #667eea' : '1px solid #E5E7EB',
                              background: isSelected
                                ? 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)'
                                : hasRequest
                                ? '#F3F4F6'
                                : 'white',
                              cursor: hasRequest ? 'not-allowed' : 'pointer',
                              transition: 'all 0.2s',
                              textAlign: 'right',
                              display: 'grid',
                              gridTemplateColumns: 'auto 1fr auto',
                              gap: '16px',
                              alignItems: 'center',
                              opacity: hasRequest ? 0.6 : 1
                            }}
                          >
                            {/* Checkbox */}
                            <div
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '6px',
                                border: '2px solid ' + (isSelected ? '#667eea' : '#D1D5DB'),
                                background: isSelected ? '#667eea' : 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: '700',
                                fontSize: '14px'
                              }}
                            >
                              {isSelected && '✓'}
                            </div>

                            {/* Day Info */}
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '15px', fontWeight: '700', color: '#111827' }}>
                                  {new Date(day.date).toLocaleDateString('ar-SA', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </span>
                                {isVeryOld && (
                                  <span style={{
                                    fontSize: '11px',
                                    padding: '3px 8px',
                                    background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
                                    color: '#991B1B',
                                    borderRadius: '12px',
                                    fontWeight: '700',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}>
                                    ⚠️ قديم جداً ({daysOld} يوم)
                                  </span>
                                )}
                                {isOld && !isVeryOld && (
                                  <span style={{
                                    fontSize: '11px',
                                    padding: '3px 8px',
                                    background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                                    color: '#92400E',
                                    borderRadius: '12px',
                                    fontWeight: '700',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}>
                                    ⏰ {daysOld} يوم
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '13px', color: '#EF4444', fontWeight: '600', marginBottom: '6px' }}>
                                {day.problemReason}
                              </div>
                              <div style={{ fontSize: '12px', color: '#6B7280', display: 'grid', gap: '6px', marginBottom: '8px' }}>
                                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                  <span>🕐 دخول: {formatTime(day.checkIn)}</span>
                                  <span>🕐 خروج: {formatTime(day.checkOut)}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                  {day.workHours !== null && <span>⏱️ ساعات عمل: {day.workHours.toFixed(1)} / {day.requiredHours}</span>}
                                  {day.missingHours > 0 && (
                                    <span style={{ color: '#F59E0B', fontWeight: '600' }}>
                                      ⚠️ ناقص: {day.missingHours.toFixed(1)} ساعة
                                    </span>
                                  )}
                                </div>
                              </div>
                              {day.expectedDeduction > 0 && (
                                <div style={{
                                  fontSize: '13px',
                                  fontWeight: '700',
                                  color: '#EF4444',
                                  background: '#FEE2E2',
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  display: 'inline-block'
                                }}>
                                  💰 خصم متوقع: {day.expectedDeduction.toFixed(2)} ر.س
                                </div>
                              )}
                            </div>

                            {/* Status Badge */}
                            <div>
                              {hasRequest ? (
                                <div>
                                  {getExcuseStatusBadge(day.excuseRequestStatus || 'PENDING')}
                                </div>
                              ) : (
                                getStatusBadge(day.status)
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </CardBody>
              </CardEnhanced>
            )}

            {formData.type === 'PERMISSION' && (
              <CardEnhanced variant="elevated">
                <CardHeader title="2️⃣ حدد تاريخ الاستئذان" />
                <CardBody>
                  <FloatingInput
                    label="التاريخ"
                    type="date"
                    value={formData.permissionDate}
                    onChange={(e) => setFormData({ ...formData, permissionDate: e.target.value })}
                    required
                  />
                </CardBody>
              </CardEnhanced>
            )}

            {/* Reason */}
            <CardEnhanced variant="elevated">
              <CardHeader title="3️⃣ اكتب السبب" />
              <CardBody>
                <FloatingTextarea
                  label="السبب التفصيلي"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={4}
                  placeholder="اكتب سبب واضح ومفصل..."
                  required
                />
                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '8px' }}>
                  💡 نصيحة: كلما كان السبب أوضح، زادت فرصة الموافقة
                </div>
              </CardBody>
            </CardEnhanced>

            {/* Attachments */}
            <CardEnhanced variant="elevated">
              <CardHeader title="4️⃣ إرفاق مستندات (اختياري)" />
              <CardBody>
                <FileUpload
                  multiple
                  onUpload={setAttachments}
                  accept="image/*,application/pdf"
                  maxSize={10}
                  label="إرفاق المستندات"
                  helperText="يمكنك إرفاق تقارير طبية، شهادات، أو أي مستندات داعمة (الحد الأقصى: 5 ملفات، 10 MB لكل ملف)"
                />
              </CardBody>
            </CardEnhanced>

            {/* Submit */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Link href="/hr/attendance/requests">
                <button
                  type="button"
                  disabled={loading}
                  style={{
                    padding: '14px 28px',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    background: 'white',
                    color: '#6B7280',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '15px'
                  }}
                >
                  إلغاء
                </button>
              </Link>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '14px 28px',
                  borderRadius: '8px',
                  border: 'none',
                  background: loading
                    ? '#9CA3AF'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  fontWeight: '700',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '15px',
                  transition: 'all 0.2s'
                }}
              >
                {loading ? '⏳ جاري الإرسال...' : '✅ إرسال الطلب'}
              </button>
            </div>
          </ResponsiveGrid>
        </form>

        {/* History & Statistics Section */}
        {formData.type === 'EXCUSE' && (
          <div style={{ marginTop: '32px' }}>
            {/* Statistics Panel */}
            {historyStats && (
              <CardEnhanced variant="elevated">
                <CardHeader 
                  title="📊 إحصائيات التصحيحات" 
                  action={
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      style={{
                        padding: '8px 16px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      {showHistory ? '🔼 إخفاء السجل' : '🔽 عرض السجل'}
                    </button>
                  }
                />
                <CardBody>
                  <ResponsiveGrid columns={{ mobile: 2, tablet: 4 }} gap="md">
                    <div style={{ textAlign: 'center', padding: '16px', background: '#F9FAFB', borderRadius: '12px' }}>
                      <div style={{ fontSize: '28px', fontWeight: '800', color: '#111827', marginBottom: '4px' }}>
                        {historyStats.total}
                      </div>
                      <div style={{ fontSize: '13px', color: '#6B7280' }}>إجمالي الطلبات</div>
                    </div>

                    <div style={{ textAlign: 'center', padding: '16px', background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)', borderRadius: '12px' }}>
                      <div style={{ fontSize: '28px', fontWeight: '800', color: '#065F46', marginBottom: '4px' }}>
                        {historyStats.approved}
                      </div>
                      <div style={{ fontSize: '13px', color: '#065F46' }}>تمت الموافقة</div>
                    </div>

                    <div style={{ textAlign: 'center', padding: '16px', background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)', borderRadius: '12px' }}>
                      <div style={{ fontSize: '28px', fontWeight: '800', color: '#991B1B', marginBottom: '4px' }}>
                        {historyStats.rejected}
                      </div>
                      <div style={{ fontSize: '13px', color: '#991B1B' }}>تم الرفض</div>
                    </div>

                    <div style={{ textAlign: 'center', padding: '16px', background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)', borderRadius: '12px' }}>
                      <div style={{ fontSize: '28px', fontWeight: '800', color: '#667eea', marginBottom: '4px' }}>
                        {historyStats.approvalRate.toFixed(0)}%
                      </div>
                      <div style={{ fontSize: '13px', color: '#667eea' }}>نسبة الموافقة</div>
                    </div>
                  </ResponsiveGrid>

                  {/* Approval Rate Progress Bar */}
                  <div style={{ marginTop: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>نسبة نجاح التصحيحات</span>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#667eea' }}>
                        {historyStats.approved} من {historyStats.total - historyStats.pending}
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '12px',
                      background: '#E5E7EB',
                      borderRadius: '6px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${historyStats.approvalRate}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)',
                        borderRadius: '6px',
                        transition: 'width 0.5s ease'
                      }} />
                    </div>
                  </div>
                </CardBody>
              </CardEnhanced>
            )}

            {/* Timeline Section */}
            {showHistory && (
              <CardEnhanced variant="elevated" style={{ marginTop: '24px' }}>
                <CardHeader title="📋 سجل التصحيحات السابقة" />
                <CardBody>
                  {loadingHistory ? (
                    <SkeletonCard />
                  ) : history.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                      <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
                      <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#6B7280' }}>
                        لا توجد تصحيحات سابقة
                      </h4>
                    </div>
                  ) : (
                    <div style={{ position: 'relative' }}>
                      {/* Timeline Line */}
                      <div style={{
                        position: 'absolute',
                        right: '16px',
                        top: '20px',
                        bottom: '20px',
                        width: '2px',
                        background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
                        opacity: 0.3
                      }} />

                      {/* Timeline Items */}
                      <div style={{ display: 'grid', gap: '16px' }}>
                        {history.map((item, index) => {
                          const isOld = item.daysSince > 30;
                          const statusColor = 
                            item.status === 'APPROVED' ? '#10B981' :
                            item.status === 'REJECTED' ? '#EF4444' :
                            '#F59E0B';
                          const statusIcon =
                            item.status === 'APPROVED' ? '✅' :
                            item.status === 'REJECTED' ? '❌' :
                            '⏳';

                          return (
                            <div
                              key={item.id}
                              style={{
                                position: 'relative',
                                paddingRight: '48px',
                                paddingLeft: '16px',
                                paddingTop: '16px',
                                paddingBottom: '16px',
                                background: index % 2 === 0 ? '#F9FAFB' : 'white',
                                borderRadius: '12px',
                                border: '1px solid #E5E7EB'
                              }}
                            >
                              {/* Timeline Dot */}
                              <div style={{
                                position: 'absolute',
                                right: '8px',
                                top: '24px',
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                background: statusColor,
                                border: '3px solid white',
                                boxShadow: '0 0 0 2px ' + statusColor + '40'
                              }} />

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '18px' }}>{statusIcon}</span>
                                    <span style={{ fontSize: '15px', fontWeight: '700', color: '#111827' }}>
                                      {new Date(item.requestDate).toLocaleDateString('ar-SA', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                      })}
                                    </span>
                                    {isOld && (
                                      <span style={{
                                        fontSize: '11px',
                                        padding: '2px 8px',
                                        background: '#FEF3C7',
                                        color: '#92400E',
                                        borderRadius: '12px',
                                        fontWeight: '600'
                                      }}>
                                        قديم
                                      </span>
                                    )}
                                  </div>

                                  <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px', lineHeight: '1.6' }}>
                                    {item.reason}
                                  </div>

                                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#9CA3AF', flexWrap: 'wrap' }}>
                                    <span>📅 {item.daysSince} يوم مضى</span>
                                    {item.reviewerName && <span>👤 {item.reviewerName}</span>}
                                    {item.attendanceRecord && (
                                      <span>🔖 {item.attendanceRecord.status === 'ABSENT' ? 'غياب' : 'تأخير'}</span>
                                    )}
                                  </div>
                                </div>

                                <div style={{
                                  padding: '6px 12px',
                                  background: statusColor + '20',
                                  color: statusColor,
                                  borderRadius: '8px',
                                  fontSize: '13px',
                                  fontWeight: '700'
                                }}>
                                  {item.status === 'APPROVED' ? 'موافق عليه' :
                                   item.status === 'REJECTED' ? 'مرفوض' :
                                   'قيد المراجعة'}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardBody>
              </CardEnhanced>
            )}
          </div>
        )}
      </ResponsiveContainer>
    </div>
  );
}
