'use client';

import { forwardRef, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, useState } from 'react';
import styles from './FormEnhanced.module.css';
import { HiOutlineX, HiOutlineCheck, HiOutlineExclamationCircle, HiOutlineUpload, HiOutlineDocument } from 'react-icons/hi';

// Input Props
interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  error?: string;
  success?: string;
  helper?: string;
  icon?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
}

// Floating Label Input
export const FloatingInput = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, success, helper, icon, clearable, onClear, className, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleClear = () => {
      if (onClear) {
        onClear();
      }
    };

    return (
      <div className={styles.formGroup}>
        <div className={styles.inputWrapper}>
          <input
            ref={ref}
            className={`${styles.floatingInput} ${error ? styles.hasError : ''} ${
              success ? styles.hasSuccess : ''
            } ${icon ? styles.inputWithIcon : ''} ${className || ''}`}
            placeholder=" "
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
          <label className={styles.floatingLabel}>{label}</label>
          
          {icon && <span className={styles.inputIcon}>{icon}</span>}
          
          {clearable && props.value && (
            <button
              type="button"
              className={styles.clearButton}
              onClick={handleClear}
              aria-label="Clear"
            >
              <HiOutlineX size={14} />
            </button>
          )}
        </div>

        {(error || success || helper) && (
          <div className={`${styles.helperText} ${error ? styles.error : ''} ${success ? styles.success : ''}`}>
            {error && (
              <>
                <HiOutlineExclamationCircle size={16} />
                <span>{error}</span>
              </>
            )}
            {success && (
              <>
                <HiOutlineCheck size={16} />
                <span>{success}</span>
              </>
            )}
            {!error && !success && helper && <span>{helper}</span>}
          </div>
        )}
      </div>
    );
  }
);

FloatingInput.displayName = 'FloatingInput';

// Select Props
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  helper?: string;
  options: Array<{ value: string; label: string }>;
}

// Floating Label Select
export const FloatingSelect = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helper, options, className, children, ...props }, ref) => {
    return (
      <div className={styles.formGroup}>
        <div className={styles.inputWrapper}>
          <select
            ref={ref}
            className={`${styles.selectEnhanced} ${error ? styles.hasError : ''} ${className || ''}`}
            {...props}
          >
            {children || (
              <>
                <option value="">اختر...</option>
                {options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </>
            )}
          </select>
          <label className={styles.floatingLabel}>{label}</label>
        </div>

        {(error || helper) && (
          <div className={`${styles.helperText} ${error ? styles.error : ''}`}>
            {error && (
              <>
                <HiOutlineExclamationCircle size={16} />
                <span>{error}</span>
              </>
            )}
            {!error && helper && <span>{helper}</span>}
          </div>
        )}
      </div>
    );
  }
);

FloatingSelect.displayName = 'FloatingSelect';

// Textarea Props
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  helper?: string;
}

// Floating Label Textarea
export const FloatingTextarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helper, className, ...props }, ref) => {
    return (
      <div className={styles.formGroup}>
        <div className={styles.inputWrapper}>
          <textarea
            ref={ref}
            className={`${styles.textareaEnhanced} ${error ? styles.hasError : ''} ${className || ''}`}
            placeholder=" "
            {...props}
          />
          <label className={styles.floatingLabel}>{label}</label>
        </div>

        {(error || helper) && (
          <div className={`${styles.helperText} ${error ? styles.error : ''}`}>
            {error && (
              <>
                <HiOutlineExclamationCircle size={16} />
                <span>{error}</span>
              </>
            )}
            {!error && helper && <span>{helper}</span>}
          </div>
        )}
      </div>
    );
  }
);

FloatingTextarea.displayName = 'FloatingTextarea';

// Checkbox Props
interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

// Enhanced Checkbox
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className, ...props }, ref) => {
    return (
      <label className={styles.checkboxWrapper}>
        <input
          ref={ref}
          type="checkbox"
          className={`${styles.checkboxEnhanced} ${className || ''}`}
          {...props}
        />
        <span className={styles.checkboxLabel}>{label}</span>
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';

// Radio Props
interface RadioProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

// Enhanced Radio
export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, className, ...props }, ref) => {
    return (
      <label className={styles.radioWrapper}>
        <input
          ref={ref}
          type="radio"
          className={`${styles.radioEnhanced} ${className || ''}`}
          {...props}
        />
        <span className={styles.radioLabel}>{label}</span>
      </label>
    );
  }
);

Radio.displayName = 'Radio';

// File Upload Props
interface FileUploadProps {
  label?: string;
  accept?: string;
  multiple?: boolean;
  onChange?: (files: FileList | null) => void;
  maxSize?: number; // in MB
  hint?: string;
  error?: string;
}

// Enhanced File Upload
export function FileUpload({
  label = 'اختر ملف',
  accept,
  multiple,
  onChange,
  maxSize = 10,
  hint = `الحد الأقصى: ${maxSize}MB`,
  error
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      const filesArray = Array.from(selectedFiles);
      
      // Check file size
      const oversized = filesArray.filter(f => f.size > maxSize * 1024 * 1024);
      if (oversized.length > 0) {
        alert(`بعض الملفات أكبر من ${maxSize}MB`);
        return;
      }

      setFiles(filesArray);
      if (onChange) {
        onChange(selectedFiles);
      }
    }
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className={styles.formGroup}>
      <div className={styles.fileUpload}>
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className={styles.fileUploadInput}
          id="file-upload"
        />
        <label htmlFor="file-upload" className={styles.fileUploadLabel}>
          <HiOutlineUpload className={styles.fileUploadIcon} />
          <div className={styles.fileUploadText}>
            <span className={styles.fileUploadTextStrong}>{label}</span>
            {' أو اسحب الملف هنا'}
          </div>
          <div className={styles.fileUploadHint}>{hint}</div>
        </label>
      </div>

      {files.length > 0 && (
        <div style={{ marginTop: '12px' }}>
          {files.map((file, index) => (
            <div key={index} className={styles.filePreview}>
              <div className={styles.filePreviewIcon}>
                <HiOutlineDocument size={20} />
              </div>
              <div className={styles.filePreviewInfo}>
                <div className={styles.filePreviewName}>{file.name}</div>
                <div className={styles.filePreviewSize}>{formatFileSize(file.size)}</div>
              </div>
              <button
                type="button"
                className={styles.filePreviewRemove}
                onClick={() => removeFile(index)}
                aria-label="Remove file"
              >
                <HiOutlineX size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className={`${styles.helperText} ${styles.error}`}>
          <HiOutlineExclamationCircle size={16} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
