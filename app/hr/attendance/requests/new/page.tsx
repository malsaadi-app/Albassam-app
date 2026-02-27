'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import FileUpload, { UploadedFile } from '@/components/FileUpload';

interface ProblematicDay {
  id: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
  workHours: number | null;
  status: string;
  hasExcuseRequest: boolean;
  excuseRequestStatus: string | null;
}

export default function NewAttendanceRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingDays, setLoadingDays] = useState(true);
  const [problematicDays, setProblematicDays] = useState<ProblematicDay[]>([]);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    type: 'EXCUSE',
    reason: '',
    permissionDate: '' // للاستئذان
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
        setProblematicDays(data);
      }
    } catch (error) {
      console.error('Error fetching problematic days:', error);
    } finally {
      setLoadingDays(false);
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
      alert('الرجاء اختيار يوم واحد على الأقل');
      return;
    }

    if (formData.type === 'PERMISSION' && !formData.permissionDate) {
      alert('الرجاء تحديد تاريخ الاستئذان');
      return;
    }

    if (!formData.reason) {
      alert('الرجاء كتابة السبب');
      return;
    }

    try {
      setLoading(true);

      const attachmentData = attachments.length > 0 ? JSON.stringify(attachments) : null;

      if (formData.type === 'EXCUSE') {
        // Submit multiple requests for selected dates
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
        // Submit single permission request
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
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      LATE: { bg: '#f59e0b', text: '#ffffff', label: 'متأخر' },
      ABSENT: { bg: '#ef4444', text: '#ffffff', label: 'غائب' }
    };

    const config = styles[status] || styles.LATE;

    return (
      <span style={{
        display: 'inline-block',
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '600',
        background: config.bg,
        color: config.text
      }}>
        {config.label}
      </span>
    );
  };

  const getExcuseStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      PENDING: { bg: '#f59e0b', text: '#ffffff', label: 'معلق' },
      APPROVED: { bg: '#10b981', text: '#ffffff', label: 'موافق عليه' },
      REJECTED: { bg: '#ef4444', text: '#ffffff', label: 'مرفوض' }
    };

    const config = styles[status] || styles.PENDING;

    return (
      <span style={{
        display: 'inline-block',
        padding: '3px 8px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: '600',
        background: config.bg,
        color: config.text
      }}>
        {config.label}
      </span>
    );
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F9FAFB',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <Link 
            href="/hr/attendance/requests"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: '#6B7280',
              textDecoration: 'none',
              marginBottom: '16px',
              fontSize: '14px',
              padding: '8px 16px',
              background: 'white',
              borderRadius: '0.5rem'
            }}
          >
            <span>←</span>
            <span>رجوع إلى الطلبات</span>
          </Link>

          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 'bold', 
            color: '#111827',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '36px' }}>📝</span>
            طلب حضور جديد
          </h1>
          <p style={{ 
            color: '#6B7280', 
            fontSize: '14px' 
          }}>
            تبرير غياب/تأخر أو طلب استئذان
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          
          {/* Request Type Selection */}
          <div style={{
            background: 'white',
            
            borderRadius: '0.75rem',
            padding: '24px',
            border: '1px solid #E5E7EB',
            marginBottom: '20px'
          }}>
            <h3 style={{ 
              color: '#111827', 
              fontSize: '16px', 
              fontWeight: '600',
              marginBottom: '16px'
            }}>
              نوع الطلب
            </h3>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  setFormData({ ...formData, type: 'EXCUSE', permissionDate: '' });
                  setSelectedDates(new Set());
                }}
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '16px',
                  background: formData.type === 'EXCUSE' 
                    ? 'rgba(239, 68, 68, 0.3)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  border: formData.type === 'EXCUSE'
                    ? '2px solid rgba(239, 68, 68, 0.6)'
                    : '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.5rem',
                  color: '#111827',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ fontSize: '32px' }}>⚠️</span>
                <div>
                  <div>تبرير غياب أو تأخر</div>
                  <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                    للأيام التي حصل فيها غياب أو تأخير
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFormData({ ...formData, type: 'PERMISSION', permissionDate: '' });
                  setSelectedDates(new Set());
                }}
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '16px',
                  background: formData.type === 'PERMISSION' 
                    ? 'rgba(59, 130, 246, 0.3)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  border: formData.type === 'PERMISSION'
                    ? '2px solid rgba(59, 130, 246, 0.6)'
                    : '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.5rem',
                  color: '#111827',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ fontSize: '32px' }}>🚪</span>
                <div>
                  <div>طلب استئذان</div>
                  <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                    مغادرة مبكرة أو تأخير متوقع
                  </div>
                </div>
              </button>
            </div>
          </div>
          
          {/* Permission Date Selection */}
          {formData.type === 'PERMISSION' && (
            <div style={{
              background: 'white',
              
              borderRadius: '0.75rem',
              padding: '24px',
              border: '1px solid #E5E7EB',
              marginBottom: '20px'
            }}>
              <label style={{ 
                display: 'block', 
                color: '#111827', 
                marginBottom: '10px',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                تاريخ الاستئذان <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="date"
                value={formData.permissionDate}
                onChange={(e) => setFormData({ ...formData, permissionDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '0.5rem',
                  border: '1px solid #E5E7EB',
                  background: 'white',
                  color: '#111827',
                  fontSize: '14px'
                }}
              />
              <div style={{ 
                marginTop: '8px',
                fontSize: '12px',
                color: '#9CA3AF',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span>ℹ️</span>
                <span>يمكنك طلب الاستئذان لليوم الحالي أو أي يوم قادم</span>
              </div>
            </div>
          )}

          
          {/* Problematic Days List */}
          {formData.type === 'EXCUSE' && (
            <div style={{
              background: 'white',
              
              borderRadius: '0.75rem',
              padding: '24px',
              border: '1px solid #E5E7EB',
              marginBottom: '20px'
            }}>
              <h3 style={{ 
                color: '#111827', 
                fontSize: '18px', 
                fontWeight: '600',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>⚠️</span>
                الأيام المتأخر أو الغائب فيها
              </h3>

              {loadingDays ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px',
                  color: '#111827' 
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
                  <div>جاري التحميل...</div>
                </div>
              ) : problematicDays.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px',
                  color: '#111827' 
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '6px' }}>
                    لا توجد أيام تحتاج تبرير
                  </div>
                  <div style={{ fontSize: '13px', opacity: 0.8 }}>
                    سجل الحضور الخاص بك ممتاز!
                  </div>
                </div>
              ) : (
                <div style={{ 
                  overflowX: 'auto',
                  borderRadius: '0.5rem'
                }}>
                  <table style={{ 
                    width: '100%', 
                    borderCollapse: 'separate',
                    borderSpacing: '0 6px',
                    color: '#111827'
                  }}>
                    <thead>
                      <tr style={{ 
                        background: 'white',
                        borderRadius: '0.5rem'
                      }}>
                        <th style={{ 
                          padding: '10px', 
                          textAlign: 'center', 
                          fontWeight: '600', 
                          fontSize: '13px',
                          borderTopRightRadius: '8px',
                          borderBottomRightRadius: '8px',
                          width: '50px'
                        }}>
                          اختيار
                        </th>
                        <th style={{ padding: '10px', textAlign: 'center', fontWeight: '600', fontSize: '13px' }}>
                          التاريخ
                        </th>
                        <th style={{ padding: '10px', textAlign: 'center', fontWeight: '600', fontSize: '13px' }}>
                          الحالة
                        </th>
                        <th style={{ padding: '10px', textAlign: 'center', fontWeight: '600', fontSize: '13px' }}>
                          الحضور
                        </th>
                        <th style={{ padding: '10px', textAlign: 'center', fontWeight: '600', fontSize: '13px' }}>
                          الانصراف
                        </th>
                        <th style={{ padding: '10px', textAlign: 'center', fontWeight: '600', fontSize: '13px' }}>
                          ساعات العمل
                        </th>
                        <th style={{ 
                          padding: '10px', 
                          textAlign: 'center', 
                          fontWeight: '600', 
                          fontSize: '13px',
                          borderTopLeftRadius: '8px',
                          borderBottomLeftRadius: '8px'
                        }}>
                          طلب تبرير
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {problematicDays.map((day) => {
                        const dateStr = new Date(day.date).toISOString().split('T')[0];
                        const isSelected = selectedDates.has(dateStr);
                        const isDisabled = day.hasExcuseRequest;

                        return (
                          <tr 
                            key={day.id}
                            style={{ 
                              background: isSelected 
                                ? 'rgba(16, 185, 129, 0.2)' 
                                : 'rgba(255, 255, 255, 0.05)',
                              opacity: isDisabled ? 0.5 : 1,
                              transition: 'all 0.2s ease',
                              borderRadius: '0.5rem'
                            }}
                          >
                            <td style={{ 
                              padding: '12px',
                              textAlign: 'center',
                              borderTopRightRadius: '8px',
                              borderBottomRightRadius: '8px'
                            }}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={isDisabled}
                                onChange={() => toggleDate(dateStr)}
                                style={{
                                  width: '18px',
                                  height: '18px',
                                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                                  accentColor: '#10b981'
                                }}
                              />
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center', fontSize: '13px' }}>
                              {new Date(day.date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              {getStatusBadge(day.status)}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center', fontSize: '13px' }}>
                              {formatTime(day.checkIn)}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center', fontSize: '13px' }}>
                              {formatTime(day.checkOut)}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center', fontSize: '13px' }}>
                              {day.workHours ? `${day.workHours.toFixed(1)} س` : '-'}
                            </td>
                            <td style={{ 
                              padding: '12px', 
                              textAlign: 'center',
                              borderTopLeftRadius: '8px',
                              borderBottomLeftRadius: '8px'
                            }}>
                              {day.hasExcuseRequest && day.excuseRequestStatus ? (
                                getExcuseStatusBadge(day.excuseRequestStatus)
                              ) : (
                                <span style={{ fontSize: '11px', opacity: 0.7 }}>-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {problematicDays.length > 0 && (
                <div style={{ 
                  marginTop: '12px',
                  fontSize: '12px',
                  color: '#6B7280',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>ℹ️</span>
                  <span>
                    تم تحديد {selectedDates.size} من {problematicDays.length} يوم
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Reason */}
          <div style={{
            background: 'white',
            
            borderRadius: '0.75rem',
            padding: '24px',
            border: '1px solid #E5E7EB',
            marginBottom: '20px'
          }}>
            <label style={{ 
              display: 'block', 
              color: '#111827', 
              marginBottom: '10px',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              السبب <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder={
                formData.type === 'EXCUSE'
                  ? "اكتب سبب التبرير بالتفصيل... (مثال: كان لدي ظرف طارئ، موعد طبي، إلخ)"
                  : "اكتب سبب الاستئذان... (مثال: موعد طبي، إجراء حكومي، ظرف عائلي، إلخ)"
              }
              rows={5}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '0.5rem',
                border: '1px solid #E5E7EB',
                background: 'white',
                color: '#111827',
                fontSize: '14px',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Attachments */}
          <div style={{
            background: 'white',
            
            borderRadius: '0.75rem',
            padding: '24px',
            border: '1px solid #E5E7EB',
            marginBottom: '20px'
          }}>
            <FileUpload
              onUpload={setAttachments}
              multiple={true}
              label="📎 إرفاق مستندات (اختياري)"
              helperText="يمكنك إرفاق شهادة طبية، إذن رسمي، أو أي مستندات داعمة (حد أقصى 10 ميجابايت لكل ملف)"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || (formData.type === 'EXCUSE' && selectedDates.size === 0) || (formData.type === 'PERMISSION' && !formData.permissionDate)}
            style={{
              width: '100%',
              padding: '16px',
              background: loading || (formData.type === 'EXCUSE' && selectedDates.size === 0) || (formData.type === 'PERMISSION' && !formData.permissionDate)
                ? 'rgba(156, 163, 175, 0.5)' 
                : 'rgba(16, 185, 129, 0.9)',
              border: 'none',
              borderRadius: '0.5rem',
              color: '#111827',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading || (formData.type === 'EXCUSE' && selectedDates.size === 0) || (formData.type === 'PERMISSION' && !formData.permissionDate) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            <span style={{ fontSize: '22px' }}>📤</span>
            <span>
              {loading 
                ? 'جاري الإرسال...' 
                : formData.type === 'EXCUSE' && selectedDates.size > 0 
                  ? `إرسال ${selectedDates.size} ${selectedDates.size === 1 ? 'طلب تبرير' : 'طلبات تبرير'}` 
                  : formData.type === 'PERMISSION'
                    ? 'إرسال طلب الاستئذان'
                    : 'إرسال الطلب'
              }
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
