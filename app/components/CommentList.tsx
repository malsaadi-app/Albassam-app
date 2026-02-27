'use client';

import { useEffect, useState } from 'react';

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  mentions: string | null;
  user: {
    id: string;
    username: string;
    displayName: string;
  };
};

type User = {
  id: string;
  username: string;
  displayName: string;
};

type Props = {
  taskId: string;
  currentUserId: string;
  allUsers: User[];
};

export default function CommentList({ taskId, currentUserId, allUsers }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');

  useEffect(() => {
    fetchComments();
  }, [taskId]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      // Extract mentions (@username)
      const mentionRegex = /@(\w+)/g;
      const mentionedUsernames = newComment.match(mentionRegex)?.map(m => m.slice(1)) || [];
      const mentionedUserIds = allUsers
        .filter(u => mentionedUsernames.includes(u.username))
        .map(u => u.id);

      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment,
          mentions: mentionedUserIds
        })
      });

      if (res.ok) {
        setNewComment('');
        await fetchComments();
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const insertMention = (username: string) => {
    setNewComment(prev => prev + `@${username} `);
    setShowMentionMenu(false);
    setMentionSearch('');
  };

  const filteredUsers = allUsers.filter(u => 
    u.username.toLowerCase().includes(mentionSearch.toLowerCase()) &&
    u.id !== currentUserId
  );

  const highlightMentions = (text: string) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span key={i} style={{ 
            color: '#10b981', 
            fontWeight: 600,
            background: 'rgba(16, 185, 129, 0.1)',
            padding: '2px 6px',
            borderRadius: '4px'
          }}>
            {part}
          </span>
        );
      }
      return part;
    });
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

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>جاري التحميل...</div>;
  }

  return (
    <div style={{ marginTop: '20px' }}>
      <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#f1f5f9' }}>
        💬 التعليقات ({comments.length})
      </h3>

      {/* Comments List */}
      <div style={{ marginBottom: '20px', maxHeight: '400px', overflowY: 'auto' }}>
        {comments.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '32px', 
            color: '#94a3b8',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            border: '1px dashed rgba(255,255,255,0.1)'
          }}>
            لا توجد تعليقات بعد. كن أول من يعلّق!
          </div>
        ) : (
          comments.map(comment => (
            <div
              key={comment.id}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '12px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div>
                  <span style={{ fontWeight: 700, color: '#10b981' }}>
                    {comment.user.displayName}
                  </span>
                  <span style={{ fontSize: '12px', color: '#94a3b8', marginRight: '8px' }}>
                    @{comment.user.username}
                  </span>
                </div>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  {formatDate(comment.createdAt)}
                </span>
              </div>
              <div style={{ color: '#e2e8f0', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {highlightMentions(comment.content)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Comment Form */}
      <form onSubmit={handleSubmit}>
        <div style={{ position: 'relative' }}>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="اكتب تعليقك... (استخدم @ لذكر شخص)"
            rows={3}
            disabled={submitting}
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '12px',
              color: '#f1f5f9',
              fontSize: '14px',
              resize: 'vertical',
              outline: 'none',
              fontFamily: 'inherit'
            }}
          />
          
          {showMentionMenu && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              right: 0,
              marginBottom: '8px',
              background: 'rgba(30, 41, 59, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '12px',
              maxHeight: '200px',
              overflowY: 'auto',
              boxShadow: '0 -4px 6px rgba(0, 0, 0, 0.1)'
            }}>
              {filteredUsers.map(user => (
                <div
                  key={user.id}
                  onClick={() => insertMention(user.username)}
                  style={{
                    padding: '12px',
                    cursor: 'pointer',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{user.displayName}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>@{user.username}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
          <button
            type="button"
            onClick={() => setShowMentionMenu(!showMentionMenu)}
            style={{
              padding: '8px 16px',
              background: 'rgba(59, 130, 246, 0.2)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '8px',
              color: '#3b82f6',
              fontSize: '14px',
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
            @ ذكر شخص
          </button>

          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            style={{
              flex: 1,
              padding: '8px 16px',
              background: submitting || !newComment.trim() 
                ? 'rgba(100, 100, 100, 0.3)' 
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: submitting || !newComment.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: submitting || !newComment.trim() ? 0.5 : 1
            }}
          >
            {submitting ? 'جاري الإرسال...' : '💬 إرسال التعليق'}
          </button>
        </div>
      </form>
    </div>
  );
}
