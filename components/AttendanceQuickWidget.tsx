'use client';

import { useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import Link from 'next/link';

interface TodayStatus {
  isCheckedIn: boolean;
  checkInTime: string | null;
  status: string;
}

export function AttendanceQuickWidget() {
  const { hasPermission, loading } = usePermissions();
  const [todayStatus, setTodayStatus] = useState<TodayStatus | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const canSubmit = hasPermission('attendance.submit');
  const canView = hasPermission('attendance.view_own');

  useEffect(() => {
    if (!loading && (canSubmit || canView)) {
      fetchTodayStatus();
    }
  }, [loading, canSubmit, canView]);

  const fetchTodayStatus = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/attendance?date=${today}`);
      if (res.ok) {
        const data = await res.json();
        const records = data.records || [];
        const activeSession = records.find((r: any) => !r.checkOut);
        const lastRecord = records[0];

        setTodayStatus({
          isCheckedIn: !!activeSession,
          checkInTime: lastRecord?.checkIn || null,
          status: lastRecord?.status || 'NOT_CHECKED_IN'
        });
      }
    } catch (error) {
      console.error('Error fetching today status:', error);
    }
  };

  const handleQuickAction = async (action: 'check-in' | 'check-out') => {
    setActionLoading(true);
    try {
      let location: string | null = null;
      
      if (action === 'check-in' && 'geolocation' in navigator) {
        location = await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              resolve(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
            },
            () => resolve(null),
            { timeout: 3000 }
          );
        });
      }

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, location })
      });

      if (res.ok) {
        fetchTodayStatus();
      }
    } catch (error) {
      console.error('Quick action error:', error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !canSubmit) {
    return null;
  }

  const getStatusColor = () => {
    if (!todayStatus) return '#6B7280';
    if (todayStatus.isCheckedIn) return '#10B981';
    if (todayStatus.status === 'LATE') return '#F59E0B';
    if (todayStatus.status === 'PRESENT') return '#10B981';
    return '#6B7280';
  };

  return (
    <div style={{
      background: 'white',
      border: '1px solid #E5E7EB',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '16px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>⏰</span>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
            تسجيل سريع
          </span>
        </div>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: getStatusColor(),
          boxShadow: `0 0 8px ${getStatusColor()}`
        }} />
      </div>

      {todayStatus?.checkInTime && (
        <div style={{
          fontSize: '11px',
          color: '#6B7280',
          marginBottom: '12px',
          padding: '6px 8px',
          background: '#F9FAFB',
          borderRadius: '6px'
        }}>
          {todayStatus.isCheckedIn ? '✅ حاضر' : '✓ سجلت اليوم'}
          <div style={{ fontSize: '10px', marginTop: '2px' }}>
            {new Date(todayStatus.checkInTime).toLocaleTimeString('ar-SA', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => handleQuickAction('check-in')}
          disabled={actionLoading || todayStatus?.isCheckedIn}
          style={{
            flex: 1,
            background: todayStatus?.isCheckedIn ? '#F3F4F6' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            color: todayStatus?.isCheckedIn ? '#9CA3AF' : 'white',
            border: 'none',
            padding: '8px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: todayStatus?.isCheckedIn || actionLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }}
        >
          {actionLoading ? '...' : '🟢'}
        </button>
        <button
          onClick={() => handleQuickAction('check-out')}
          disabled={actionLoading || !todayStatus?.isCheckedIn}
          style={{
            flex: 1,
            background: !todayStatus?.isCheckedIn ? '#F3F4F6' : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
            color: !todayStatus?.isCheckedIn ? '#9CA3AF' : 'white',
            border: 'none',
            padding: '8px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: !todayStatus?.isCheckedIn || actionLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }}
        >
          {actionLoading ? '...' : '🔴'}
        </button>
      </div>

      <Link
        href="/attendance/dashboard"
        style={{
          display: 'block',
          marginTop: '12px',
          padding: '8px',
          background: '#F9FAFB',
          borderRadius: '8px',
          textAlign: 'center',
          textDecoration: 'none',
          color: '#667eea',
          fontSize: '12px',
          fontWeight: '600',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#E5E7EB';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#F9FAFB';
        }}
      >
        📊 لوحة الحضور
      </Link>
    </div>
  );
}
