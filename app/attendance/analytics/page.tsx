'use client';

import { usePermissions } from '@/hooks/usePermissions';
import { AttendanceAnalytics } from '@/components/AttendanceAnalytics';
import { AttendanceNotifications } from '@/components/AttendanceNotifications';
import Link from 'next/link';

export default function AttendanceAnalyticsPage() {
  const { hasPermission, loading, user } = usePermissions();

  const canViewOwn = hasPermission('attendance.view_own');
  const canViewTeam = hasPermission('attendance.view_team');
  const canViewAll = hasPermission('attendance.view');

  if (loading) {
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

  if (!canViewOwn && !canViewTeam && !canViewAll) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB', padding: '20px' }}>
        <div style={{ textAlign: 'center', maxWidth: '500px' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔒</div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '12px' }}>
            ليس لديك صلاحية الوصول
          </h1>
          <p style={{ color: '#6B7280', marginBottom: '24px' }}>
            للوصول إلى التحليلات، يجب أن يكون لديك صلاحية عرض الحضور.
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

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '20px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '14px', color: '#6B7280' }}>
            <Link href="/" style={{ color: '#6B7280', textDecoration: 'none' }}>الرئيسية</Link>
            <span>/</span>
            <Link href="/attendance/dashboard" style={{ color: '#6B7280', textDecoration: 'none' }}>الحضور</Link>
            <span>/</span>
            <span style={{ color: '#111827', fontWeight: '500' }}>التحليلات</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
                📊 تحليلات الحضور
              </h1>
              <p style={{ color: '#6B7280', fontSize: '16px' }}>
                تحليل شامل لأداء الحضور والانصراف
              </p>
            </div>
            <Link
              href="/attendance/dashboard"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'white',
                color: '#667eea',
                padding: '12px 20px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '600',
                border: '1px solid #E5E7EB',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#667eea';
                e.currentTarget.style.background = '#F9FAFB';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB';
                e.currentTarget.style.background = 'white';
              }}
            >
              ← العودة إلى لوحة الحضور
            </Link>
          </div>
        </div>

        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px', alignItems: 'start' }}>
          
          {/* Analytics Section */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
          }}>
            <AttendanceAnalytics />
          </div>

          {/* Notifications Sidebar */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            position: 'sticky',
            top: '20px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
              🔔 الإشعارات
            </h3>
            <AttendanceNotifications />
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          marginTop: '24px'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
            🔗 روابط سريعة
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <Link
              href="/attendance"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                background: '#F9FAFB',
                borderRadius: '12px',
                textDecoration: 'none',
                color: '#111827',
                transition: 'all 0.2s',
                border: '1px solid transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#EEF2FF';
                e.currentTarget.style.borderColor = '#667eea';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#F9FAFB';
                e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              <span style={{ fontSize: '24px' }}>⏰</span>
              <div>
                <div style={{ fontWeight: '600', fontSize: '14px' }}>تسجيل الحضور</div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>دخول/خروج</div>
              </div>
            </Link>

            {(canViewTeam || canViewAll) && (
              <Link
                href="/hr/attendance"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  background: '#F9FAFB',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  color: '#111827',
                  transition: 'all 0.2s',
                  border: '1px solid transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#EEF2FF';
                  e.currentTarget.style.borderColor = '#667eea';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#F9FAFB';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              >
                <span style={{ fontSize: '24px' }}>👥</span>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '14px' }}>السجلات</div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>عرض كل السجلات</div>
                </div>
              </Link>
            )}

            <Link
              href="/hr/attendance/requests/new"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                background: '#F9FAFB',
                borderRadius: '12px',
                textDecoration: 'none',
                color: '#111827',
                transition: 'all 0.2s',
                border: '1px solid transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#EEF2FF';
                e.currentTarget.style.borderColor = '#667eea';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#F9FAFB';
                e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              <span style={{ fontSize: '24px' }}>📝</span>
              <div>
                <div style={{ fontWeight: '600', fontSize: '14px' }}>طلب جديد</div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>تبرير أو تصحيح</div>
              </div>
            </Link>

            {canViewAll && (
              <Link
                href="/hr/attendance/reports"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  background: '#F9FAFB',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  color: '#111827',
                  transition: 'all 0.2s',
                  border: '1px solid transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#EEF2FF';
                  e.currentTarget.style.borderColor = '#667eea';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#F9FAFB';
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
