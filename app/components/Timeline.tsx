'use client';

import { useEffect, useState } from 'react';

type ActivityLog = {
  id: string;
  action: string;
  changes: string | null;
  createdAt: string;
  user: {
    username: string;
    displayName: string;
  };
};

type Props = {
  taskId: string;
};

const actionEmoji: Record<string, string> = {
  created: '✨',
  updated: '✏️',
  status_changed: '📊',
  priority_changed: '🎯',
  owner_changed: '👤',
  checklist_updated: '✅',
  dependencies_updated: '🔗',
  comment_added: '💬'
};

const statusNames: Record<string, string> = {
  NEW: 'جديد',
  IN_PROGRESS: 'قيد التنفيذ',
  ON_HOLD: 'بانتظار',
  DONE: 'مكتمل'
};

const priorityNames: Record<string, string> = {
  LOW: 'منخفضة',
  MEDIUM: 'متوسطة',
  HIGH: 'عالية'
};

export default function Timeline({ taskId }: Props) {
  const [history, setHistory] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [taskId]);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/history`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    if (days < 7) return `منذ ${days} يوم`;
    return date.toLocaleDateString('en-US');
  };

  const formatChanges = (action: string, changesJson: string | null) => {
    if (!changesJson) return '';

    try {
      const changes = JSON.parse(changesJson);
      
      if (action === 'created') {
        return 'أنشأ المهمة';
      }

      if (action === 'status_changed' && changes.status) {
        const from = statusNames[changes.status.from] || changes.status.from;
        const to = statusNames[changes.status.to] || changes.status.to;
        return `غيّر الحالة من "${from}" إلى "${to}"`;
      }

      if (action === 'priority_changed' && changes.priority) {
        const from = priorityNames[changes.priority.from] || changes.priority.from;
        const to = priorityNames[changes.priority.to] || changes.priority.to;
        return `غيّر الأولوية من "${from}" إلى "${to}"`;
      }

      if (action === 'owner_changed' && changes.owner) {
        return `أحال المهمة إلى "${changes.owner.to}"`;
      }

      if (action === 'updated') {
        const parts = [];
        if (changes.title) parts.push(`العنوان`);
        if (changes.description) parts.push(`الوصف`);
        if (changes.category) parts.push(`التصنيف`);
        if (changes.status) {
          const to = statusNames[changes.status.to] || changes.status.to;
          parts.push(`الحالة إلى "${to}"`);
        }
        return `عدّل ${parts.join(', ')}`;
      }

      if (action === 'checklist_updated') {
        return 'حدّث قائمة المهام الفرعية';
      }

      if (action === 'dependencies_updated') {
        return 'حدّث المهام المرتبطة';
      }

      return action;
    } catch {
      return action;
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>جاري التحميل...</div>;
  }

  if (history.length === 0) {
    return null;
  }

  const displayedHistory = expanded ? history : history.slice(0, 3);

  return (
    <div style={{ marginTop: '20px' }}>
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '16px'
        }}
      >
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f1f5f9' }}>
          📜 سجل النشاطات ({history.length})
        </h3>
        
        {history.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              padding: '6px 12px',
              background: 'rgba(59, 130, 246, 0.2)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '8px',
              color: '#3b82f6',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
            }}
          >
            {expanded ? 'إخفاء' : 'عرض الكل'}
          </button>
        )}
      </div>

      <div style={{ position: 'relative', paddingRight: '24px' }}>
        {/* Timeline Line */}
        <div style={{
          position: 'absolute',
          right: '8px',
          top: '8px',
          bottom: '8px',
          width: '2px',
          background: 'linear-gradient(to bottom, rgba(16, 185, 129, 0.3), rgba(16, 185, 129, 0.1))',
        }} />

        {displayedHistory.map((log, index) => (
          <div
            key={log.id}
            style={{
              position: 'relative',
              marginBottom: '16px',
              paddingRight: '16px'
            }}
          >
            {/* Timeline Dot */}
            <div style={{
              position: 'absolute',
              right: '0',
              top: '4px',
              width: '18px',
              height: '18px',
              background: index === 0 
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'rgba(100, 116, 139, 0.5)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              border: '2px solid #1e293b',
              boxShadow: index === 0 ? '0 0 12px rgba(16, 185, 129, 0.4)' : 'none'
            }}>
              {actionEmoji[log.action] || '📝'}
            </div>

            {/* Activity Card */}
            <div style={{
              background: index === 0 
                ? 'rgba(16, 185, 129, 0.08)'
                : 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: index === 0 
                ? '1px solid rgba(16, 185, 129, 0.2)'
                : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '12px 16px',
              transition: 'all 0.2s'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '12px'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontWeight: 600, 
                    color: index === 0 ? '#10b981' : '#f1f5f9',
                    marginBottom: '4px'
                  }}>
                    {log.user.displayName}
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    color: '#94a3b8',
                    lineHeight: '1.5'
                  }}>
                    {formatChanges(log.action, log.changes)}
                  </div>
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: '#64748b',
                  whiteSpace: 'nowrap'
                }}>
                  {formatDate(log.createdAt)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
