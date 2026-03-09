'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Notification {
  id: string;
  type: 'reminder' | 'warning' | 'info';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  actionUrl?: string;
  actionLabel?: string;
}

interface Props {
  compact?: boolean;
}

export function AttendanceNotifications({ compact = false }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchNotifications();
    // Refresh every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/attendance/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = (id: string) => {
    setDismissed(prev => new Set(prev).add(id));
  };

  const visibleNotifications = notifications.filter(n => !dismissed.has(n.id));

  if (loading) {
    return compact ? null : (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', color: '#6B7280' }}>جاري التحميل...</div>
      </div>
    );
  }

  if (visibleNotifications.length === 0) {
    return compact ? null : (
      <div style={{
        background: '#F0FDF4',
        border: '1px solid #BBF7D0',
        borderRadius: '12px',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
        <div style={{ fontSize: '14px', fontWeight: '600', color: '#166534' }}>
          لا توجد إشعارات
        </div>
        <div style={{ fontSize: '12px', color: '#15803D', marginTop: '4px' }}>
          كل شيء على ما يرام
        </div>
      </div>
    );
  }

  const getNotificationStyle = (type: string, priority: string) => {
    if (type === 'reminder' || priority === 'high') {
      return {
        bg: '#FEE2E2',
        border: '#FECACA',
        text: '#991B1B',
        icon: '⏰'
      };
    }
    if (type === 'warning' || priority === 'medium') {
      return {
        bg: '#FEF3C7',
        border: '#FDE68A',
        text: '#92400E',
        icon: '⚠️'
      };
    }
    return {
      bg: '#DBEAFE',
      border: '#BFDBFE',
      text: '#1E40AF',
      icon: 'ℹ️'
    };
  };

  if (compact) {
    const highPriorityCount = visibleNotifications.filter(n => n.priority === 'high').length;
    
    return (
      <div style={{
        position: 'relative',
        display: 'inline-block'
      }}>
        <div style={{
          padding: '8px 12px',
          background: highPriorityCount > 0 ? '#FEE2E2' : '#F3F4F6',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: '600',
          color: highPriorityCount > 0 ? '#991B1B' : '#6B7280',
          cursor: 'pointer'
        }}>
          🔔 {visibleNotifications.length}
        </div>
        {highPriorityCount > 0 && (
          <div style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            width: '8px',
            height: '8px',
            background: '#EF4444',
            borderRadius: '50%',
            border: '2px solid white'
          }} />
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {visibleNotifications.map(notification => {
        const style = getNotificationStyle(notification.type, notification.priority);
        
        return (
          <div
            key={notification.id}
            style={{
              background: style.bg,
              border: `1px solid ${style.border}`,
              borderRadius: '12px',
              padding: '16px',
              position: 'relative'
            }}
          >
            <button
              onClick={() => handleDismiss(notification.id)}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: 'transparent',
                border: 'none',
                color: style.text,
                fontSize: '18px',
                cursor: 'pointer',
                opacity: 0.6,
                transition: 'opacity 0.2s',
                padding: '4px 8px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
            >
              ×
            </button>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '24px', flexShrink: 0 }}>
                {style.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: style.text, marginBottom: '4px' }}>
                  {notification.title}
                </div>
                <div style={{ fontSize: '13px', color: style.text, opacity: 0.9, lineHeight: '1.5' }}>
                  {notification.message}
                </div>
                {notification.actionUrl && (
                  <Link
                    href={notification.actionUrl}
                    style={{
                      display: 'inline-block',
                      marginTop: '12px',
                      padding: '8px 16px',
                      background: 'white',
                      color: style.text,
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                      border: `1px solid ${style.border}`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {notification.actionLabel}
                  </Link>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
