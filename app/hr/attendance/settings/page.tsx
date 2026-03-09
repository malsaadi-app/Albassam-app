'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/components/Toast';
import Link from 'next/link';

interface AttendanceSettings {
  id: string;
  lateThresholdMinutes: number;
  workHoursPerDay: number;
  workingDaysPerMonth: number;
  workStartTime: string;
  workEndTime: string;
  requireCheckOut: boolean;
  enableGpsTracking: boolean;
  enableGeofencing: boolean;
  officeLatitude: number | null;
  officeLongitude: number | null;
  maxDistanceMeters: number;
}

export default function AttendanceSettingsPage() {
  const router = useRouter();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const { showToast, ToastContainer } = useToast();
  const [settings, setSettings] = useState<AttendanceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const canManage = hasPermission('attendance.manage');

  useEffect(() => {
    if (!permissionsLoading) {
      if (!canManage) {
        router.push('/');
        return;
      }
      fetchSettings();
    }
  }, [permissionsLoading, canManage]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/attendance/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      } else {
        const data = await res.json();
        showToast(data.error || 'فشل جلب الإعدادات', 'error');
      }
    } catch (error) {
      showToast('حدث خطأ أثناء جلب الإعدادات', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);

    try {
      const res = await fetch('/api/attendance/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      const data = await res.json();

      if (res.ok) {
        showToast(data.message || 'تم حفظ الإعدادات بنجاح ✅', 'success');
        setSettings(data.settings);
      } else {
        showToast(data.error || 'فشل حفظ الإعدادات', 'error');
      }
    } catch (error) {
      showToast('حدث خطأ أثناء حفظ الإعدادات', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading || permissionsLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #E5E7EB',
          borderTop: '4px solid #667eea',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}></div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!settings) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB', padding: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>⚠️</div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '12px' }}>
            فشل تحميل الإعدادات
          </h1>
          <button
            onClick={fetchSettings}
            style={{
              padding: '12px 24px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '20px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '14px', color: '#6B7280' }}>
            <Link href="/" style={{ color: '#6B7280', textDecoration: 'none' }}>الرئيسية</Link>
            <span>/</span>
            <Link href="/hr/attendance" style={{ color: '#6B7280', textDecoration: 'none' }}>الحضور</Link>
            <span>/</span>
            <span style={{ color: '#111827', fontWeight: '500' }}>الإعدادات</span>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
            ⚙️ إعدادات الحضور
          </h1>
          <p style={{ color: '#6B7280', fontSize: '16px' }}>
            إدارة أوقات العمل والتأخير والـ GPS
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gap: '24px' }}>
            
            {/* Working Hours Section */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                ⏰ أوقات العمل
              </h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                    بداية الدوام
                  </label>
                  <input
                    type="time"
                    value={settings.workStartTime}
                    onChange={(e) => setSettings({ ...settings, workStartTime: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                    نهاية الدوام
                  </label>
                  <input
                    type="time"
                    value={settings.workEndTime}
                    onChange={(e) => setSettings({ ...settings, workEndTime: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                    ساعات العمل اليومية
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="24"
                    value={settings.workHoursPerDay}
                    onChange={(e) => setSettings({ ...settings, workHoursPerDay: parseFloat(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                    أيام العمل الشهرية
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={settings.workingDaysPerMonth}
                    onChange={(e) => setSettings({ ...settings, workingDaysPerMonth: parseInt(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Late Threshold Section */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                ⏱️ حد التأخير
              </h2>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  عدد الدقائق المسموحة للتأخير
                </label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={settings.lateThresholdMinutes}
                  onChange={(e) => setSettings({ ...settings, lateThresholdMinutes: parseInt(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '6px' }}>
                  💡 مثال: إذا كان الحد 15 دقيقة، التسجيل بعد 08:15 يعتبر متأخراً
                </div>
              </div>
            </div>

            {/* GPS & Geofencing Section */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                📍 GPS والموقع
              </h2>
              
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.enableGpsTracking}
                    onChange={(e) => setSettings({ ...settings, enableGpsTracking: e.target.checked })}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                    تفعيل تتبع GPS
                  </span>
                </label>
                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '6px', marginRight: '32px' }}>
                  حفظ موقع الموظف عند التسجيل
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.enableGeofencing}
                    onChange={(e) => setSettings({ ...settings, enableGeofencing: e.target.checked })}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                    تفعيل السياج الجغرافي (Geofencing)
                  </span>
                </label>
                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '6px', marginRight: '32px' }}>
                  السماح بالتسجيل فقط ضمن نطاق محدد من المكتب
                </div>
              </div>

              {settings.enableGeofencing && (
                <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px', marginTop: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                        خط العرض (Latitude)
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        value={settings.officeLatitude || ''}
                        onChange={(e) => setSettings({ ...settings, officeLatitude: e.target.value ? parseFloat(e.target.value) : null })}
                        placeholder="24.7136"
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '8px',
                          border: '1px solid #D1D5DB',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                        خط الطول (Longitude)
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        value={settings.officeLongitude || ''}
                        onChange={(e) => setSettings({ ...settings, officeLongitude: e.target.value ? parseFloat(e.target.value) : null })}
                        placeholder="46.6753"
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '8px',
                          border: '1px solid #D1D5DB',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                      المسافة المسموحة (بالمتر)
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="10000"
                      value={settings.maxDistanceMeters}
                      onChange={(e) => setSettings({ ...settings, maxDistanceMeters: parseInt(e.target.value) })}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #D1D5DB',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                    <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '6px' }}>
                      💡 مثال: 500 متر = يمكن التسجيل ضمن دائرة نصف كيلو من المكتب
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Other Settings */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                🔧 إعدادات أخرى
              </h2>
              
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.requireCheckOut}
                    onChange={(e) => setSettings({ ...settings, requireCheckOut: e.target.checked })}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                    تسجيل الخروج مطلوب
                  </span>
                </label>
                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '6px', marginRight: '32px' }}>
                  إلزام الموظفين بتسجيل الخروج
                </div>
              </div>
            </div>

          </div>

          {/* Save Button */}
          <div style={{ marginTop: '32px', display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
            <Link
              href="/hr/attendance"
              style={{
                padding: '14px 28px',
                background: '#F3F4F6',
                color: '#374151',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                textDecoration: 'none',
                display: 'inline-block'
              }}
            >
              إلغاء
            </Link>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '14px 28px',
                background: saving ? '#9CA3AF' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {saving ? '⏳ جاري الحفظ...' : '💾 حفظ الإعدادات'}
            </button>
          </div>
        </form>

      </div>

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}
