'use client';

import { useState, useEffect } from 'react';

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  user: {
    username: string;
    displayName: string;
  };
};

type Props = {
  taskId: string;
};

export default function CommentList({ taskId }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments, taskId]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      });

      if (res.ok) {
        setNewComment('');
        fetchComments();
      }
    } catch (error) {
      console.error('Error posting comment:', error);
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
        onClick={() => setShowComments(!showComments)}
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
        <span>💬 التعليقات ({comments.length})</span>
        <span>{showComments ? '▲' : '▼'}</span>
      </button>

      {showComments && (
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
          {/* Comments List */}
          <div style={{ marginBottom: '1rem' }}>
            {comments.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
                لا توجد تعليقات
              </p>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  style={{
                    background: 'white',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    marginBottom: '0.5rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#2D1B4E' }}>
                      {comment.user.displayName || comment.user.username}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                      {formatTime(comment.createdAt)}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#374151', whiteSpace: 'pre-wrap', margin: 0 }}>
                    {comment.content}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* New Comment Form */}
          <form onSubmit={handleSubmit}>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="اكتب تعليقاً... (استخدم @username للإشارة)"
              style={{
                width: '100%',
                minHeight: '60px',
                padding: '0.5rem',
                borderRadius: '8px',
                border: '1px solid rgba(45,27,78,0.2)',
                fontSize: '0.875rem',
                resize: 'vertical',
                marginBottom: '0.5rem'
              }}
            />
            <button
              type="submit"
              disabled={loading || !newComment.trim()}
              style={{
                background: loading ? '#9ca3af' : '#2D1B4E',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
                width: '100%'
              }}
            >
              {loading ? 'جاري الإرسال...' : 'إرسال'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
