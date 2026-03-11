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
  status: string;
  hasExcuseRequest: boolean;
  excuseRequestStatus: string | null;
  problemReason?: string; // سبب المشكلة
}

export default function NewAttendanceRequestPageEnhanced() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingDays, setLoadingDays] = useState(true);
  const [problematicDays, setProblematicDays] = useState<ProblematicDay[]>([]);
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
    }
  }, [formData.type]);

  const fetchProblematicDays = async () => {
    try {
      setLoadingDays(true);
      const res = await fetch('/api/hr/attendance/problematic-days');
      if (res.ok) {
        const data = await res.json();
        
        // Add problem reason for each day
        const enhancedData = data.map((day: ProblematicDay) => ({
          ...day,
          problemReason: getProblemReason(day)
        }));
        
        setProblematicDays(enhancedData);
      }
    } catch (error) {
      console.error('Error fetching problematic days:', error);
    } finally {
      setLoadingDays(false);
    }
  };

  const getProblemReason = (day: ProblematicDay): string => {
    if (day.status === 'ABSENT') return 'غياب كامل';
    if (day.status === 'LATE') {
      if (!day.checkIn) return 'لم يتم تسجيل الحضور';
      if (!day.checkOut) return 'لم يتم تسجيل الانصراف';
      return 'تأخر عن موعد الحضور';
    }
    if (!day.checkOut) return 'لم يتم تسجيل الانصراف';
    if (!day.checkIn) return 'لم يتم تسجيل الحضور';
    return 'مشكلة في الحضور';
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
                              <div style={{ fontSize: '15px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>
                                {new Date(day.date).toLocaleDateString('ar-SA', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </div>
                              <div style={{ fontSize: '13px', color: '#EF4444', fontWeight: '600', marginBottom: '6px' }}>
                                {day.problemReason}
                              </div>
                              <div style={{ fontSize: '12px', color: '#6B7280', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                <span>🕐 دخول: {formatTime(day.checkIn)}</span>
                                <span>🕐 خروج: {formatTime(day.checkOut)}</span>
                                {day.workHours !== null && <span>⏱️ ساعات: {day.workHours.toFixed(1)}</span>}
                              </div>
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
      </ResponsiveContainer>
    </div>
  );
}
