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
      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
      border: '1px solid rgba(102, 126, 234, 0.15)',
      borderRadius: '12px',
      padding: '12px',
      margin: '0'
    }}>
      {/* Header - Compact */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: '10px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '16px' }}>⏰</span>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>
            تسجيل سريع
          </span>
        </div>
        <div style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: getStatusColor(),
          boxShadow: `0 0 6px ${getStatusColor()}`
        }} />
      </div>

      {/* Status - Compact */}
      {todayStatus?.checkInTime && (
        <div style={{
          fontSize: '11px',
          color: '#64748b',
          marginBottom: '10px',
          padding: '6px 8px',
          background: 'white',
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <span style={{ fontWeight: '600' }}>
            {todayStatus.isCheckedIn ? '✅ مسجل دخول' : '✓ حضرت اليوم'}
          </span>
          <div style={{ fontSize: '10px', marginTop: '2px', opacity: 0.8 }}>
            {new Date(todayStatus.checkInTime).toLocaleTimeString('ar-SA', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })}
          </div>
        </div>
      )}

      {/* Buttons - Compact */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
        <button
          onClick={() => handleQuickAction('check-in')}
          disabled={actionLoading || todayStatus?.isCheckedIn}
          style={{
            flex: 1,
            background: todayStatus?.isCheckedIn 
              ? '#F3F4F6' 
              : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            color: todayStatus?.isCheckedIn ? '#9CA3AF' : 'white',
            border: 'none',
            padding: '10px 8px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: todayStatus?.isCheckedIn || actionLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            boxShadow: todayStatus?.isCheckedIn ? 'none' : '0 2px 8px rgba(16, 185, 129, 0.3)'
          }}
          onMouseEnter={(e) => {
            if (!todayStatus?.isCheckedIn && !actionLoading) {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = todayStatus?.isCheckedIn ? 'none' : '0 2px 8px rgba(16, 185, 129, 0.3)';
          }}
        >
          {actionLoading ? '⏳' : '🟢 دخول'}
        </button>
        <button
          onClick={() => handleQuickAction('check-out')}
          disabled={actionLoading || !todayStatus?.isCheckedIn}
          style={{
            flex: 1,
            background: !todayStatus?.isCheckedIn 
              ? '#F3F4F6' 
              : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
            color: !todayStatus?.isCheckedIn ? '#9CA3AF' : 'white',
            border: 'none',
            padding: '10px 8px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: !todayStatus?.isCheckedIn || actionLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            boxShadow: !todayStatus?.isCheckedIn ? 'none' : '0 2px 8px rgba(239, 68, 68, 0.3)'
          }}
          onMouseEnter={(e) => {
            if (todayStatus?.isCheckedIn && !actionLoading) {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = !todayStatus?.isCheckedIn ? 'none' : '0 2px 8px rgba(239, 68, 68, 0.3)';
          }}
        >
          {actionLoading ? '⏳' : '🔴 خروج'}
        </button>
      </div>

      {/* Link - Compact */}
      <Link
        href="/attendance/dashboard"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          padding: '6px',
          background: 'white',
          borderRadius: '6px',
          textDecoration: 'none',
          color: '#667eea',
          fontSize: '11px',
          fontWeight: '600',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#F9FAFB';
          e.currentTarget.style.color = '#764ba2';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'white';
          e.currentTarget.style.color = '#667eea';
        }}
      >
        📊 لوحة الحضور
      </Link>
    </div>
  );
}
