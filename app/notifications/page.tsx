'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Stats } from '@/components/ui/Stats';
import { Badge } from '@/components/ui/Badge';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId })
      });

      if (res.ok) {
        setNotifications(notifications.map(n => 
          n.id === notificationId ? { ...n, isRead: true } : n
        ));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true })
      });

      if (res.ok) {
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    // Navigate to related entity
    if (notification.relatedId && notification.type.includes('request')) {
      router.push(`/hr/requests/${notification.relatedId}`);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getNotificationIcon = (type: string) => {
    if (type.includes('approved')) return '✅';
    if (type.includes('rejected')) return '❌';
    if (type.includes('returned')) return '↩️';
    if (type.includes('submitted')) return '📥';
    if (type.includes('pending')) return '⏳';
    return '🔔';
  };

  const getNotificationVariant = (type: string): 'blue' | 'green' | 'red' | 'yellow' | 'gray' => {
    if (type.includes('approved')) return 'green';
    if (type.includes('rejected')) return 'red';
    if (type.includes('returned')) return 'yellow';
    if (type.includes('submitted')) return 'blue';
    return 'gray';
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #E5E7EB',
          borderTop: '4px solid #3B82F6',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}></div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Page Header */}
        <PageHeader
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <span>🔔 الإشعارات</span>
              {unreadCount > 0 && (
                <Badge variant="red" size="lg" pulse>
                  {unreadCount} جديد
                </Badge>
              )}
            </div>
          }
          breadcrumbs={['الرئيسية', 'الإشعارات']}
          actions={
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {unreadCount > 0 && (
                <Button variant="success" onClick={markAllAsRead}>
                  ✓ تحديد الكل كمقروء
                </Button>
              )}
              <Button variant="outline" onClick={() => router.push('/dashboard')}>
                ← العودة
              </Button>
            </div>
          }
        />

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          <Stats
            label="إجمالي الإشعارات"
            value={notifications.length}
            variant="blue"
          />
          <Stats
            label="غير المقروءة"
            value={unreadCount}
            variant="red"
            trend={unreadCount > 0 ? 'up' : undefined}
          />
          <Stats
            label="المقروءة"
            value={notifications.length - unreadCount}
            variant="green"
          />
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <Card variant="default">
            <div style={{ padding: '60px 40px', textAlign: 'center' }}>
              <div style={{ fontSize: '80px', marginBottom: '24px' }}>📭</div>
              <h3 style={{ fontSize: '24px', color: '#111827', fontWeight: '800', marginBottom: '12px' }}>
                لا توجد إشعارات
              </h3>
              <p style={{ fontSize: '16px', color: '#6B7280', fontWeight: '500' }}>
                ستظهر إشعاراتك هنا عندما تكون متاحة
              </p>
            </div>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                variant={notification.isRead ? 'default' : 'outlined'}
                hover={!!notification.relatedId}
                onClick={() => handleNotificationClick(notification)}
                style={{
                  cursor: notification.relatedId ? 'pointer' : 'default',
                  background: notification.isRead ? '#FFFFFF' : '#EFF6FF',
                  borderColor: notification.isRead ? '#E5E7EB' : '#3B82F6',
                  borderWidth: notification.isRead ? '1px' : '2px'
                }}
              >
                <div style={{ display: 'flex', gap: '20px', alignItems: 'start' }}>
                  {/* Icon */}
                  <div style={{
                    fontSize: '40px',
                    flexShrink: 0,
                    opacity: notification.isRead ? 0.5 : 1,
                    transition: 'opacity 0.2s'
                  }}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start',
                      marginBottom: '12px',
                      gap: '16px',
                      flexWrap: 'wrap'
                    }}>
                      <h3 style={{
                        color: notification.isRead ? '#6B7280' : '#111827',
                        fontSize: '18px',
                        fontWeight: '800',
                        margin: 0,
                        flex: 1
                      }}>
                        {notification.title}
                      </h3>
                      <span style={{
                        color: '#9CA3AF',
                        fontSize: '14px',
                        fontWeight: '600',
                        whiteSpace: 'nowrap'
                      }}>
                        {formatDate(notification.createdAt)}
                      </span>
                    </div>

                    <p style={{
                      color: notification.isRead ? '#9CA3AF' : '#374151',
                      fontSize: '15px',
                      margin: '0 0 16px 0',
                      lineHeight: '1.6',
                      fontWeight: '500'
                    }}>
                      {notification.message}
                    </p>

                    {/* Badges */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {!notification.isRead && (
                        <Badge variant="red" pulse>
                          جديد
                        </Badge>
                      )}
                      <Badge variant={getNotificationVariant(notification.type)}>
                        {notification.type.includes('approved') && 'موافق'}
                        {notification.type.includes('rejected') && 'مرفوض'}
                        {notification.type.includes('returned') && 'معاد'}
                        {notification.type.includes('submitted') && 'مقدم'}
                        {notification.type.includes('pending') && 'قيد الانتظار'}
                        {!notification.type.match(/(approved|rejected|returned|submitted|pending)/) && 'إشعار'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
