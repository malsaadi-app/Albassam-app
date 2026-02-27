'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AttendanceSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/attendance');
      const data = await res.json();
      if (res.ok) {
        setSettings(data.settings);
      }
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings/attendance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'حدث خطأ');
        return;
      }
      setSettings(data.settings);
      alert('✅ تم حفظ الإعدادات بنجاح');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setSettings({ ...settings, [field]: value });
  };

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 20px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {/* Professional Header */}
        <div style={{ 
          background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
          borderRadius: 20,
          padding: '32px 28px',
          marginBottom: 24,
          boxShadow: '0 10px 25px rgba(59,130,246,0.15)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <h1 style={{ 
                fontSize: 36, 
                fontWeight: 900, 
                color: 'white', 
                margin: 0,
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>⚙️ إعدادات الحضور والانصراف</h1>
              <p style={{ 
                color: 'rgba(255,255,255,0.95)', 
                marginTop: 8,
                fontSize: 16,
                fontWeight: 500
              }}>تكوين أوقات العمل وإعدادات الرواتب</p>
            </div>
            <Link href="/settings" style={{
              padding: '12px 24px',
              borderRadius: 12,
              background: 'white',
              color: '#3B82F6',
              textDecoration: 'none',
              fontWeight: 800,
              fontSize: 15,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transition: 'all 0.3s ease',
              display: 'inline-block'
            }}>← رجوع للإعدادات</Link>
          </div>
        </div>

        {loading ? (
          <div style={{
            background: 'white',
            borderRadius: 16,
            padding: 60,
            textAlign: 'center',
            boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
            border: '1px solid #E5E7EB'
          }}>
            <div style={{ 
              width: 60, 
              height: 60, 
              margin: '0 auto 20px',
              border: '4px solid #E5E7EB',
              borderTopColor: '#3B82F6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1F2937' }}>جاري التحميل...</div>
          </div>
        ) : !settings ? (
          <div style={{
            background: 'white',
            borderRadius: 16,
            padding: 48,
            textAlign: 'center',
            boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
            border: '1px solid #E5E7EB'
          }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>⚠️</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1F2937' }}>لم يتم العثور على الإعدادات</div>
          </div>
        ) : (
          <>
            {/* Working Hours Card */}
            <div style={{
              background: 'white',
              borderRadius: 16,
              padding: 28,
              marginBottom: 20,
              boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <span style={{ fontSize: 32 }}>⏰</span>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1F2937', margin: 0 }}>أوقات العمل</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: 8
                  }}>وقت بداية الدوام</label>
                  <input 
                    type="time" 
                    value={settings.workStartTime} 
                    onChange={(e) => updateField('workStartTime', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: 10,
                      border: '1px solid #D1D5DB',
                      fontSize: 15,
                      transition: 'all 0.3s ease'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: 8
                  }}>وقت نهاية الدوام</label>
                  <input 
                    type="time" 
                    value={settings.workEndTime} 
                    onChange={(e) => updateField('workEndTime', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: 10,
                      border: '1px solid #D1D5DB',
                      fontSize: 15,
                      transition: 'all 0.3s ease'
                    }}
                  />
                </div>
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: 8
                }}>مدة السماح (دقائق)</label>
                <input 
                  type="number" 
                  value={settings.lateThresholdMinutes} 
                  onChange={(e) => updateField('lateThresholdMinutes', Number(e.target.value))}
                  min={0}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 10,
                    border: '1px solid #D1D5DB',
                    fontSize: 15,
                    transition: 'all 0.3s ease'
                  }}
                />
                <div style={{ color: '#6B7280', fontSize: 13, marginTop: 6 }}>
                  التأخير أو الانصراف المبكر خلال هذه المدة لا يُحتسب
                </div>
              </div>
            </div>

            {/* Payroll Calculations Card */}
            <div style={{
              background: 'white',
              borderRadius: 16,
              padding: 28,
              marginBottom: 20,
              boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <span style={{ fontSize: 32 }}>💰</span>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1F2937', margin: 0 }}>حسابات الرواتب</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: 8
                  }}>عدد ساعات اليوم</label>
                  <input 
                    type="number" 
                    value={settings.workHoursPerDay} 
                    onChange={(e) => updateField('workHoursPerDay', Number(e.target.value))}
                    min={1}
                    step={0.5}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: 10,
                      border: '1px solid #D1D5DB',
                      fontSize: 15,
                      transition: 'all 0.3s ease'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: 8
                  }}>عدد أيام العمل الشهرية</label>
                  <input 
                    type="number" 
                    value={settings.workingDaysPerMonth} 
                    onChange={(e) => updateField('workingDaysPerMonth', Number(e.target.value))}
                    min={1}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: 10,
                      border: '1px solid #D1D5DB',
                      fontSize: 15,
                      transition: 'all 0.3s ease'
                    }}
                  />
                </div>
              </div>
              <div style={{ 
                background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', 
                padding: 20, 
                borderRadius: 12, 
                border: '1px solid #BFDBFE',
                fontSize: 14, 
                color: '#1E40AF',
                lineHeight: 1.8
              }}>
                <strong style={{ fontSize: 15, display: 'block', marginBottom: 8 }}>💡 طريقة الحساب:</strong>
                <div>اليومية = الراتب الإجمالي / {settings.workingDaysPerMonth} يوم</div>
                <div>قيمة الساعة = اليومية / {settings.workHoursPerDay} ساعة</div>
                <div>الخصم = عدد ساعات التأخير × قيمة الساعة</div>
              </div>
            </div>

            {/* Other Settings Card */}
            <div style={{
              background: 'white',
              borderRadius: 16,
              padding: 28,
              marginBottom: 20,
              boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <span style={{ fontSize: 32 }}>🔧</span>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1F2937', margin: 0 }}>إعدادات إضافية</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 12, 
                  cursor: 'pointer',
                  padding: 16,
                  background: '#F9FAFB',
                  borderRadius: 10,
                  border: '1px solid #E5E7EB',
                  transition: 'all 0.3s ease'
                }}>
                  <input 
                    type="checkbox" 
                    checked={settings.requireCheckOut} 
                    onChange={(e) => updateField('requireCheckOut', e.target.checked)}
                    style={{ width: 20, height: 20, accentColor: '#3B82F6' }}
                  />
                  <span style={{ color: '#1F2937', fontSize: 15, fontWeight: 600 }}>إلزامية الانصراف</span>
                </label>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 12, 
                  cursor: 'pointer',
                  padding: 16,
                  background: '#F9FAFB',
                  borderRadius: 10,
                  border: '1px solid #E5E7EB',
                  transition: 'all 0.3s ease'
                }}>
                  <input 
                    type="checkbox" 
                    checked={settings.enableGpsTracking} 
                    onChange={(e) => updateField('enableGpsTracking', e.target.checked)}
                    style={{ width: 20, height: 20, accentColor: '#10B981' }}
                  />
                  <span style={{ color: '#1F2937', fontSize: 15, fontWeight: 600 }}>تتبع الموقع الجغرافي (GPS)</span>
                </label>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 12, 
                  cursor: 'pointer',
                  padding: 16,
                  background: '#F9FAFB',
                  borderRadius: 10,
                  border: '1px solid #E5E7EB',
                  transition: 'all 0.3s ease'
                }}>
                  <input 
                    type="checkbox" 
                    checked={settings.enableGeofencing} 
                    onChange={(e) => updateField('enableGeofencing', e.target.checked)}
                    style={{ width: 20, height: 20, accentColor: '#F59E0B' }}
                  />
                  <span style={{ color: '#1F2937', fontSize: 15, fontWeight: 600 }}>السياج الجغرافي (Geofencing)</span>
                </label>
              </div>
            </div>

            {/* Save Button */}
            <button 
              onClick={saveSettings} 
              disabled={saving}
              style={{ 
                width: '100%',
                padding: '16px 24px', 
                borderRadius: 12, 
                background: saving ? '#9CA3AF' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)', 
                border: 'none', 
                color: 'white', 
                fontSize: 17, 
                fontWeight: 900, 
                cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: saving ? 'none' : '0 4px 12px rgba(16,185,129,0.3)',
                transition: 'all 0.3s ease'
              }}
            >
              {saving ? '⏳ جاري الحفظ...' : '✅ حفظ جميع الإعدادات'}
            </button>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        input:focus {
          outline: none;
          border-color: #3B82F6 !important;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }
        label:hover {
          background: #F3F4F6 !important;
        }
        button:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(16,185,129,0.4) !important;
        }
      `}</style>
    </div>
  );
}
