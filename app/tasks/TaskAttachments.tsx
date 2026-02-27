'use client';

import { useState } from 'react';

type Attachment = {
  id: string;
  filename: string;
  storedFilename: string;
  size: number;
  type: string;
  uploadedAt: string;
  uploadedBy: string;
};

type TaskAttachmentsProps = {
  taskId: string;
  attachments: Attachment[];
  canEdit: boolean;
  onAttachmentsChange: () => void;
};

export default function TaskAttachments({ taskId, attachments, canEdit, onAttachmentsChange }: TaskAttachmentsProps) {
  const [uploading, setUploading] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('image')) return '🖼️';
    if (type.includes('zip') || type.includes('compressed')) return '🗜️';
    return '📎';
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      alert('حجم الملف يجب أن لا يتجاوز 10MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/tasks/${taskId}/attachments`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        onAttachmentsChange();
      } else {
        const data = await res.json();
        alert(data.error || 'فشل رفع الملف');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('حدث خطأ أثناء رفع الملف');
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleDownload = (attachmentId: string, filename: string) => {
    const url = `/api/tasks/${taskId}/attachments/download?attachmentId=${attachmentId}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  const handleDelete = async (attachmentId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الملف؟')) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}/attachments?attachmentId=${attachmentId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        onAttachmentsChange();
      } else {
        alert('فشل حذف الملف');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('حدث خطأ أثناء حذف الملف');
    }
  };

  return (
    <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #f3f4f6' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <button
          onClick={() => setShowAttachments(!showAttachments)}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem',
            color: '#6b7280',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0',
            fontWeight: '500'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#2D1B4E'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
        >
          <span>📎 المرفقات ({attachments.length})</span>
          <span style={{ fontSize: '0.75rem' }}>{showAttachments ? '▼' : '◀'}</span>
        </button>

        {canEdit && (
          <label
            style={{
              background: 'linear-gradient(135deg, #D4A574 0%, #E67E22 100%)',
              color: 'white',
              padding: '0.25rem 0.75rem',
              borderRadius: '6px',
              fontSize: '0.75rem',
              cursor: uploading ? 'not-allowed' : 'pointer',
              opacity: uploading ? 0.6 : 1,
              display: 'inline-block',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!uploading) {
                e.currentTarget.style.transform = 'scale(1.05)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <input
              type="file"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
              disabled={uploading}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.zip"
            />
            {uploading ? '⏳ جاري الرفع...' : '+ رفع ملف'}
          </label>
        )}
      </div>

      {/* Attachments List */}
      {showAttachments && attachments.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
          {attachments.map((att) => (
            <div
              key={att.id}
              style={{
                background: 'rgba(212,165,116,0.05)',
                border: '1px solid rgba(212,165,116,0.2)',
                borderRadius: '8px',
                padding: '0.75rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(212,165,116,0.1)';
                e.currentTarget.style.borderColor = 'rgba(212,165,116,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(212,165,116,0.05)';
                e.currentTarget.style.borderColor = 'rgba(212,165,116,0.2)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                <span style={{ fontSize: '1.25rem' }}>{getFileIcon(att.type)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: '0.813rem',
                      color: '#374151',
                      fontWeight: '500',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      margin: 0
                    }}
                    title={att.filename}
                  >
                    {att.filename}
                  </p>
                  <p style={{ fontSize: '0.688rem', color: '#9ca3af', margin: 0 }}>
                    {formatFileSize(att.size)} • {att.uploadedBy}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => handleDownload(att.id, att.filename)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.125rem',
                    padding: '0.25rem',
                    color: '#6b7280',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#2D1B4E'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
                  title="تحميل"
                >
                  ⬇️
                </button>
                {canEdit && (
                  <button
                    onClick={() => handleDelete(att.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '1.125rem',
                      padding: '0.25rem',
                      color: '#6b7280',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
                    title="حذف"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
