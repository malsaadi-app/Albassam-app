'use client';

import { useState, useRef } from 'react';

interface FileUploadProps {
  onUpload: (files: UploadedFile[]) => void;
  multiple?: boolean;
  accept?: string;
  maxSize?: number; // in MB
  label?: string;
  helperText?: string;
}

export interface UploadedFile {
  filename: string;
  path: string;
  size: number;
  type: string;
}

export default function FileUpload({
  onUpload,
  multiple = true,
  accept = '*/*',
  maxSize = 10,
  label = '📎 إرفاق ملفات',
  helperText = 'اختر الملفات للرفع (حد أقصى 10 ميجابايت لكل ملف)'
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError(null);
    setUploading(true);

    const uploaded: UploadedFile[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate size
        if (file.size > maxSize * 1024 * 1024) {
          setError(`الملف "${file.name}" يتجاوز ${maxSize} ميجابايت`);
          continue;
        }

        // Upload file
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (res.ok) {
          const data = await res.json();
          uploaded.push({
            filename: data.filename,
            path: data.path,
            size: data.size,
            type: data.type
          });
        } else {
          const errorData = await res.json();
          setError(errorData.error || 'فشل رفع الملف');
        }
      }

      if (uploaded.length > 0) {
        const allFiles = [...uploadedFiles, ...uploaded];
        setUploadedFiles(allFiles);
        onUpload(allFiles);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('حدث خطأ أثناء رفع الملفات');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = (index: number) => {
    const updated = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(updated);
    onUpload(updated);
  };

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

  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{
        display: 'block',
        color: 'white',
        marginBottom: '8px',
        fontSize: '14px',
        fontWeight: '600'
      }}>
        {label}
      </label>

      {/* Upload Button */}
      <div style={{ marginBottom: '12px' }}>
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            background: uploading ? 'rgba(156, 163, 175, 0.5)' : 'rgba(139, 92, 246, 0.9)',
            border: 'none',
            borderRadius: '10px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '600',
            cursor: uploading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          <span style={{ fontSize: '20px' }}>📎</span>
          <span>{uploading ? 'جاري الرفع...' : 'اختر ملفات'}</span>
        </label>
      </div>

      {/* Helper Text */}
      {helperText && (
        <p style={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '13px',
          marginBottom: '12px'
        }}>
          {helperText}
        </p>
      )}

      {/* Error Message */}
      {error && (
        <div style={{
          padding: '12px',
          background: 'rgba(239, 68, 68, 0.2)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          color: 'white',
          fontSize: '14px',
          marginBottom: '12px'
        }}>
          ❌ {error}
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          padding: '12px'
        }}>
          <p style={{
            color: 'white',
            fontSize: '13px',
            fontWeight: '600',
            marginBottom: '8px'
          }}>
            الملفات المرفقة ({uploadedFiles.length}):
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '13px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '20px' }}>{getFileIcon(file.type)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: '600',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {file.filename}
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                      {formatFileSize(file.size)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  style={{
                    padding: '6px 12px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    flexShrink: 0
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                  }}
                >
                  🗑️ حذف
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
