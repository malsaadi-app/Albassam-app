'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import Link from 'next/link';

interface DashboardStats {
  today: {
    status: 'PRESENT' | 'LATE' | 'ABSENT' | 'NOT_CHECKED_IN';
    checkInTime: string | null;
    checkOutTime: string | null;
    workHours: number | null;
    isActiveSession: boolean;
  };
  month: {
    present: number;
    late: number;
    absent: number;
    onLeave: number;
    totalDays: number;
  };
  quickStats: {
    avgCheckInTime: string;
    totalWorkHours: number;
    punctualityRate: number;
  };
}

export default function AttendanceDashboard() {
  const router = useRouter();
  const { hasPermission, loading: permissionsLoading, user } = usePermissions();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check permissions
  const canSubmit = hasPermission('attendance.submit');
  const canViewOwn = hasPermission('attendance.view_own');
  const canViewTeam = hasPermission('attendance.view_team');
  const canViewAll = hasPermission('attendance.view');

  useEffect(() => {
    if (!permissionsLoading) {
      fetchDashboardData();
    }
  }, [permissionsLoading]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch today's records
      const today = new Date().toISOString().split('T')[0];
      const todayRes = await fetch(`/api/attendance?date=${today}`);
      const todayData = await todayRes.json();
      const todayRecords = todayData.records || [];

      // Fetch month's records
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const monthRes = await fetch(`/api/attendance?startDate=${startOfMonth.toISOString().split('T')[0]}&endDate=${today}`);
      const monthData = await monthRes.json();
      const monthRecords = monthData.records || [];

      // Calculate today's status
      const activeSession = todayRecords.find((r: any) => !r.checkOut);
      const lastRecord = todayRecords[0];
      
      let todayStatus: 'PRESENT' | 'LATE' | 'ABSENT' | 'NOT_CHECKED_IN' = 'NOT_CHECKED_IN';
      if (lastRecord) {
        todayStatus = lastRecord.status;
      }

      // Calculate month stats
      const present = monthRecords.filter((r: any) => r.status === 'PRESENT').length;
      const late = monthRecords.filter((r: any) => r.status === 'LATE').length;
      const absent = 0; // Would need absence tracking
      const onLeave = 0; // Would need leave tracking
      
      // Calculate avg check-in time
      const checkInTimes = monthRecords.map((r: any) => new Date(r.checkIn).getHours() * 60 + new Date(r.checkIn).getMinutes());
      const avgMinutes = checkInTimes.length > 0 ? checkInTimes.reduce((a: number, b: number) => a + b, 0) / checkInTimes.length : 0;
      const avgHours = Math.floor(avgMinutes / 60);
      const avgMins = Math.round(avgMinutes % 60);

      // Calculate total work hours
      const totalWorkHours = monthRecords.reduce((sum: number, r: any) => sum + (r.workHours || 0), 0);

      // Calculate punctuality rate
      const punctualityRate = monthRecords.length > 0 ? (present / monthRecords.length) * 100 : 100;

      setStats({
        today: {
          status: todayStatus,
          checkInTime: lastRecord?.checkIn || null,
          checkOutTime: lastRecord?.checkOut || null,
          workHours: activeSession ? null : (lastRecord?.workHours || null),
          isActiveSession: !!activeSession
        },
        month: {
          present,
          late,
          absent,
          onLeave,
          totalDays: new Date().getDate()
        },
        quickStats: {
          avgCheckInTime: `${avgHours.toString().padStart(2, '0')}:${avgMins.toString().padStart(2, '0')}`,
          totalWorkHours: Math.round(totalWorkHours * 10) / 10,
          punctualityRate: Math.round(punctualityRate)
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setActionLoading(true);
    setMessage('');

    try {
      const location = await getLocation();

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check-in', location })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
        setMessageType('success');
        fetchDashboardData();
      } else {
        setMessage(data.error);
        setMessageType('error');
      }
    } catch (error) {
      setMessage('حدث خطأ أثناء تسجيل الدخول');
      setMessageType('error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check-out' })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
        setMessageType('success');
        fetchDashboardData();
      } else {
        setMessage(data.error);
        setMessageType('error');
      }
    } catch (error) {
      setMessage('حدث خطأ أثناء تسجيل الخروج');
      setMessageType('error');
    } finally {
      setActionLoading(false);
    }
  };

  const getLocation = (): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!('geolocation' in navigator)) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          resolve(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        },
        (error) => {
          console.log('GPS not available:', error);
          resolve(null);
        },
        { timeout: 5000 }
      );
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return { bg: '#D1FAE5', border: '#A7F3D0', text: '#065F46', icon: '✅', label: 'حاضر' };
      case 'LATE':
        return { bg: '#FEF3C7', border: '#FDE68A', text: '#92400E', icon: '⏰', label: 'متأخر' };
      case 'ABSENT':
        return { bg: '#FEE2E2', border: '#FECACA', text: '#991B1B', icon: '❌', label: 'غائب' };
      default:
        return { bg: '#F3F4F6', border: '#E5E7EB', text: '#6B7280', icon: '⏳', label: 'لم يسجل بعد' };
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

  if (!canViewOwn && !canSubmit) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB', padding: '20px' }}>
        <div style={{ textAlign: 'center', maxWidth: '500px' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔒</div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '12px' }}>
            ليس لديك صلاحية الوصول
          </h1>
          <p style={{ color: '#6B7280', marginBottom: '24px', lineHeight: '1.6' }}>
            للوصول إلى نظام الحضور، يجب أن يكون لديك صلاحية تسجيل الحضور أو عرض السجلات.
            يرجى التواصل مع مدير الموارد البشرية.
          </p>
          <Link
            href="/"
            style={{
              display: 'inline-block',
              background: '#667eea',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600'
            }}
          >
            العودة إلى الصفحة الرئيسية
          </Link>
        </div>
      </div>
    );
  }

  const statusStyle = stats ? getStatusColor(stats.today.status) : getStatusColor('NOT_CHECKED_IN');

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '14px', color: '#6B7280' }}>
            <Link href="/" style={{ color: '#6B7280', textDecoration: 'none' }}>الرئيسية</Link>
            <span>/</span>
            <span style={{ color: '#111827', fontWeight: '500' }}>لوحة الحضور</span>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
            مرحباً، {user?.displayName || user?.username || 'Guest'} 👋
          </h1>
          <p style={{ color: '#6B7280', fontSize: '16px' }}>
            {formatDate(currentTime)}
          </p>
        </div>

        {/* Message */}
        {message && (
          <div style={{
            marginBottom: '20px',
            padding: '14px 18px',
            borderRadius: '12px',
            border: '1px solid',
            fontSize: '14px',
            fontWeight: '500',
            ...(messageType === 'success' 
              ? { background: '#D1FAE5', borderColor: '#A7F3D0', color: '#065F46' }
              : { background: '#FEE2E2', borderColor: '#FECACA', color: '#991B1B' })
          }}>
            {message}
          </div>
        )}

        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          
          {/* Today Status Card */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                حالة الحضور اليوم
              </h3>
              <div style={{ fontSize: '32px' }}>
                {statusStyle.icon}
              </div>
            </div>
            <div style={{
              background: statusStyle.bg,
              border: `2px solid ${statusStyle.border}`,
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: statusStyle.text, marginBottom: '4px' }}>
                {statusStyle.label}
              </div>
              {stats?.today.checkInTime && (
                <div style={{ fontSize: '14px', color: statusStyle.text, opacity: 0.8 }}>
                  دخول: {new Date(stats.today.checkInTime).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </div>
              )}
            </div>
            
            {stats?.today.isActiveSession && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>
                  ⏱️ الوقت الحالي
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#667eea', fontFamily: 'monospace' }}>
                  {formatTime(currentTime)}
                </div>
              </div>
            )}

            {stats?.today.workHours !== null && !stats?.today.isActiveSession && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '4px' }}>
                  ⏰ ساعات العمل
                </div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>
                  {stats.today.workHours.toFixed(1)} ساعة
                </div>
              </div>
            )}

            {canSubmit && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                <button
                  onClick={handleCheckIn}
                  disabled={actionLoading || stats?.today.isActiveSession}
                  style={{
                    background: stats?.today.isActiveSession ? '#E5E7EB' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: stats?.today.isActiveSession ? '#9CA3AF' : 'white',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: stats?.today.isActiveSession || actionLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  🟢 دخول
                </button>
                <button
                  onClick={handleCheckOut}
                  disabled={actionLoading || !stats?.today.isActiveSession}
                  style={{
                    background: !stats?.today.isActiveSession ? '#E5E7EB' : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                    color: !stats?.today.isActiveSession ? '#9CA3AF' : 'white',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: !stats?.today.isActiveSession || actionLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  🔴 خروج
                </button>
              </div>
            )}
          </div>

          {/* Month Stats Card */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
              📊 إحصائيات الشهر
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ background: '#D1FAE5', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#065F46' }}>
                  {stats?.month.present || 0}
                </div>
                <div style={{ fontSize: '12px', color: '#065F46', marginTop: '4px' }}>
                  ✅ حاضر
                </div>
              </div>
              <div style={{ background: '#FEF3C7', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#92400E' }}>
                  {stats?.month.late || 0}
                </div>
                <div style={{ fontSize: '12px', color: '#92400E', marginTop: '4px' }}>
                  ⏰ متأخر
                </div>
              </div>
              <div style={{ background: '#FEE2E2', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#991B1B' }}>
                  {stats?.month.absent || 0}
                </div>
                <div style={{ fontSize: '12px', color: '#991B1B', marginTop: '4px' }}>
                  ❌ غائب
                </div>
              </div>
              <div style={{ background: '#E0E7FF', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3730A3' }}>
                  {stats?.month.onLeave || 0}
                </div>
                <div style={{ fontSize: '12px', color: '#3730A3', marginTop: '4px' }}>
                  🌴 إجازة
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Card */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
            color: 'white'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>
              ⚡ ملخص سريع
            </h3>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px' }}>
                متوسط وقت الوصول
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'monospace' }}>
                {stats?.quickStats.avgCheckInTime || '--:--'}
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px' }}>
                إجمالي ساعات العمل
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {stats?.quickStats.totalWorkHours || 0} ساعة
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px' }}>
                معدل الالتزام
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {stats?.quickStats.punctualityRate || 0}%
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          marginBottom: '24px'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
            🚀 إجراءات سريعة
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <Link
              href="/attendance"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: '#F3F4F6',
                padding: '16px',
                borderRadius: '12px',
                textDecoration: 'none',
                color: '#111827',
                transition: 'all 0.2s',
                border: '2px solid transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#E5E7EB';
                e.currentTarget.style.borderColor = '#667eea';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#F3F4F6';
                e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              <span style={{ fontSize: '24px' }}>⏰</span>
              <div>
                <div style={{ fontWeight: '600', fontSize: '14px' }}>تسجيل الحضور</div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>تسجيل دخول/خروج</div>
              </div>
            </Link>

            {(canViewTeam || canViewAll) && (
              <Link
                href="/hr/attendance"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: '#F3F4F6',
                  padding: '16px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  color: '#111827',
                  transition: 'all 0.2s',
                  border: '2px solid transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#E5E7EB';
                  e.currentTarget.style.borderColor = '#667eea';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#F3F4F6';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              >
                <span style={{ fontSize: '24px' }}>👥</span>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '14px' }}>سجل الحضور</div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>عرض السجلات</div>
                </div>
              </Link>
            )}

            <Link
              href="/hr/attendance/requests/new"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: '#F3F4F6',
                padding: '16px',
                borderRadius: '12px',
                textDecoration: 'none',
                color: '#111827',
                transition: 'all 0.2s',
                border: '2px solid transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#E5E7EB';
                e.currentTarget.style.borderColor = '#667eea';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#F3F4F6';
                e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              <span style={{ fontSize: '24px' }}>📝</span>
              <div>
                <div style={{ fontWeight: '600', fontSize: '14px' }}>طلب جديد</div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>تبرير أو تصحيح</div>
              </div>
            </Link>

            {(canViewAll) && (
              <Link
                href="/hr/attendance/reports"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: '#F3F4F6',
                  padding: '16px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  color: '#111827',
                  transition: 'all 0.2s',
                  border: '2px solid transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#E5E7EB';
                  e.currentTarget.style.borderColor = '#667eea';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#F3F4F6';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              >
                <span style={{ fontSize: '24px' }}>📊</span>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '14px' }}>التقارير</div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>تقارير مفصلة</div>
                </div>
              </Link>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
