'use client';

import { useState, useEffect, useRef } from 'react';

interface Attachment {
  id: string;
  name: string;
  filename: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
}

interface Props {
  taskId: string;
  canEdit: boolean;
}

export default function TaskAttachments({ taskId, canEdit }: Props) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAttachments();
  }, [taskId]);

  const fetchAttachments = async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/attachments`);
      if (res.ok) {
        const data = await res.json();
        setAttachments(data.attachments || []);
      }
    } catch (error) {
      console.error('Error fetching attachments:', error);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch(`/api/tasks/${taskId}/attachments`, {
          method: 'POST',
          body: formData
        });

        if (res.ok) {
          const data = await res.json();
          setAttachments(prev => [...prev, data.attachment]);
        } else {
          const error = await res.json();
          alert(`❌ ${error.error || 'فشل رفع الملف'}`);
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('❌ حدث خطأ أثناء رفع الملف');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المرفق؟')) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}/attachments?attachmentId=${attachmentId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setAttachments(prev => prev.filter(att => att.id !== attachmentId));
      } else {
        const error = await res.json();
        alert(`❌ ${error.error || 'فشل حذف المرفق'}`);
      }
    } catch (error) {
      console.error('Error deleting attachment:', error);
      alert('❌ حدث خطأ أثناء حذف المرفق');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type === 'application/pdf') return '📄';
    if (type.includes('word')) return '📝';
    if (type.includes('sheet') || type.includes('excel')) return '📊';
    if (type === 'text/plain') return '📋';
    return '📎';
  };

  return (
    <div style={{ marginTop: '24px' }}>
      <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        📎 المرفقات ({attachments.length})
      </h3>

      {/* Upload Area */}
      {canEdit && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: dragActive ? '2px dashed #667eea' : '2px dashed #D1D5DB',
            borderRadius: '12px',
            padding: '32px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragActive ? '#F3F4F6' : 'white',
            marginBottom: '20px',
            transition: 'all 0.2s'
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(e) => handleFileUpload(e.target.files)}
            style={{ display: 'none' }}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          />
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📁</div>
          <div style={{ fontSize: '16px', color: '#374151', fontWeight: '600', marginBottom: '8px' }}>
            {uploading ? '⏳ جاري الرفع...' : 'اسحب الملفات هنا أو اضغط للاختيار'}
          </div>
          <div style={{ fontSize: '14px', color: '#6B7280' }}>
            الصور، PDF، Word، Excel، TXT (حد أقصى 10MB)
          </div>
        </div>
      )}

      {/* Attachments List */}
      {attachments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
          📭 لا توجد مرفقات
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                background: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#667eea';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* File Icon */}
              <div style={{ fontSize: '32px' }}>
                {getFileIcon(attachment.type)}
              </div>

              {/* File Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {attachment.name}
                </div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>
                  {formatFileSize(attachment.size)} • {new Date(attachment.uploadedAt).toLocaleDateString('ar-SA')}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {/* Preview for images */}
                {attachment.type.startsWith('image/') && (
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '8px 16px',
                      background: '#3B82F6',
                      color: 'white',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    👁️ معاينة
                  </a>
                )}

                {/* Download */}
                <a
                  href={attachment.url}
                  download={attachment.name}
                  style={{
                    padding: '8px 16px',
                    background: '#10B981',
                    color: 'white',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  ⬇️ تحميل
                </a>

                {/* Delete */}
                {canEdit && (
                  <button
                    onClick={() => handleDelete(attachment.id)}
                    style={{
                      padding: '8px 16px',
                      background: '#EF4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    🗑️ حذف
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
