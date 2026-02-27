'use client';

import { UploadedFile } from './FileUpload';

interface AttachmentsViewerProps {
  attachments: UploadedFile[] | string | null;
  title?: string;
}

export default function AttachmentsViewer({ 
  attachments, 
  title = '📎 المرفقات' 
}: AttachmentsViewerProps) {
  // Parse attachments if it's a string
  let files: UploadedFile[] = [];
  
  if (!attachments) {
    return null;
  }

  if (typeof attachments === 'string') {
    try {
      files = JSON.parse(attachments);
    } catch (e) {
      console.error('Failed to parse attachments:', e);
      return null;
    }
  } else if (Array.isArray(attachments)) {
    files = attachments;
  }

  if (!files || files.length === 0) {
    return null;
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('zip') || type.includes('rar')) return '🗜️';
    return '📎';
  };

  const isImage = (type: string) => type.startsWith('image/');

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.08)',
      borderRadius: '12px',
      padding: '20px',
      marginTop: '20px'
    }}>
      <h3 style={{
        color: 'white',
        fontSize: '16px',
        fontWeight: '600',
        marginBottom: '16px'
      }}>
        {title} ({files.length})
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '12px'
      }}>
        {files.map((file, index) => (
          <div
            key={index}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              transition: 'all 0.2s ease',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            {/* Preview for images */}
            {isImage(file.type) && (
              <div style={{
                width: '100%',
                height: '150px',
                borderRadius: '8px',
                overflow: 'hidden',
                background: 'rgba(0, 0, 0, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img
                  src={file.path}
                  alt={file.filename}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain'
                  }}
                />
              </div>
            )}

            {/* File info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px' }}>{getFileIcon(file.type)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {file.filename}
                </div>
                <div style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '12px'
                }}>
                  {formatFileSize(file.size)}
                </div>
              </div>
            </div>

            {/* Download/View button */}
            <a
              href={file.path}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '8px 12px',
                background: 'rgba(139, 92, 246, 0.2)',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                borderRadius: '6px',
                color: 'white',
                fontSize: '13px',
                fontWeight: '600',
                textAlign: 'center',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
              }}
            >
              <span>{isImage(file.type) ? '👁️' : '⬇️'}</span>
              <span>{isImage(file.type) ? 'عرض' : 'تحميل'}</span>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
