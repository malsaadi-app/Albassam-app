'use client';

import { useState, useEffect } from 'react';

type HistoryItem = {
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

const getActionEmoji = (action: string) => {
  const emojis: Record<string, string> = {
    created: '✨',
    updated: '✏️',
    commented: '💬',
    completed: '✅',
    assigned: '👤',
  };
  return emojis[action] || '📝';
};

const getActionText = (action: string, changes: string | null) => {
  if (action === 'created') return 'أنشأ المهمة';
  if (action === 'commented') return 'أضاف تعليقاً';
  if (action === 'completed') return 'أكمل المهمة';
  if (action === 'assigned') return 'أحال المهمة';
  
  if (action === 'updated' && changes) {
    try {
      const parsed = JSON.parse(changes);
      if (parsed.status) {
        const statusMap: Record<string, string> = {
          NEW: 'جديد',
          IN_PROGRESS: 'قيد التنفيذ',
          ON_HOLD: 'بانتظار',
          DONE: 'مكتمل',
        };
        return `غيّر الحالة من ${statusMap[parsed.status.from] || parsed.status.from} إلى ${statusMap[parsed.status.to] || parsed.status.to}`;
      }
      if (parsed.title) return 'غيّر العنوان';
      if (parsed.description !== undefined) return 'غيّر الوصف';
      if (parsed.category) return 'غيّر القسم';
      if (parsed.owner) return 'أحال المهمة لشخص آخر';
      if (parsed.checklist) return 'حدّث قائمة المهام';
    } catch (e) {
      // ignore
    }
  }
  
  return 'حدّث المهمة';
};

export default function Timeline({ taskId }: Props) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showTimeline, setShowTimeline] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (showTimeline && history.length === 0) {
      fetchHistory();
    }
  }, [showTimeline, taskId]);

  const fetchHistory = async () => {
    setLoading(true);
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

  const formatTime = (dateString: string) => {
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
    return date.toLocaleDateString('en-US');
  };

  return (
    <div style={{ marginTop: '1rem' }}>
      <button
        onClick={() => setShowTimeline(!showTimeline)}
        style={{
          background: 'rgba(45,27,78,0.05)',
          border: '1px solid rgba(45,27,78,0.1)',
          borderRadius: '8px',
          padding: '0.5rem 1rem',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: '600',
          color: '#2D1B4E',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(45,27,78,0.1)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(45,27,78,0.05)'}
      >
        <span>📜 السجل والتاريخ</span>
        <span>{showTimeline ? '▲' : '▼'}</span>
      </button>

      {showTimeline && (
        <div style={{
          marginTop: '1rem',
          background: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          border: '1px solid rgba(45,27,78,0.1)',
          padding: '1rem',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#9ca3af' }}>جاري التحميل...</div>
          ) : history.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
              لا يوجد سجل
            </p>
          ) : (
            <div style={{ position: 'relative' }}>
              {/* Vertical line */}
              <div style={{
                position: 'absolute',
                right: '1.25rem',
                top: '1rem',
                bottom: '1rem',
                width: '2px',
                background: 'linear-gradient(to bottom, rgba(45,27,78,0.2), rgba(45,27,78,0.05))'
              }} />

              {history.map((item, index) => (
                <div
                  key={item.id}
                  style={{
                    position: 'relative',
                    paddingRight: '3rem',
                    paddingBottom: index < history.length - 1 ? '1.5rem' : '0'
                  }}
                >
                  {/* Dot */}
                  <div style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '0.25rem',
                    width: '1rem',
                    height: '1rem',
                    borderRadius: '50%',
                    background: 'white',
                    border: '2px solid #2D1B4E',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.625rem',
                    zIndex: 1
                  }}>
                    {getActionEmoji(item.action)}
                  </div>

                  {/* Content */}
                  <div style={{
                    background: 'white',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>
                      {formatTime(item.createdAt)}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#374151' }}>
                      <span style={{ fontWeight: '600', color: '#2D1B4E' }}>
                        {item.user.displayName || item.user.username}
                      </span>
                      {' '}
                      {getActionText(item.action, item.changes)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
