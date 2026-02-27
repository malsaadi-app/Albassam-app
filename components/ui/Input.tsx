import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: boolean;
  helperText?: string;
}

export function Input({ 
  label, 
  error = false, 
  helperText, 
  style = {},
  ...props 
}: InputProps) {
  return (
    <div style={{ width: '100%' }}>
      {label && (
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '600',
          color: error ? '#EF4444' : '#374151',
          marginBottom: '8px'
        }}>
          {label}
          {props.required && <span style={{ color: '#EF4444', marginLeft: '4px' }}>*</span>}
        </label>
      )}
      
      <input
        style={{
          width: '100%',
          padding: '12px 16px',
          border: `2px solid ${error ? '#EF4444' : '#E5E7EB'}`,
          borderRadius: '10px',
          fontSize: '15px',
          fontFamily: 'inherit',
          transition: 'all 0.2s ease',
          outline: 'none',
          ...style
        }}
        onFocus={(e) => {
          if (!error) {
            e.currentTarget.style.borderColor = '#3B82F6';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
          }
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? '#EF4444' : '#E5E7EB';
          e.currentTarget.style.boxShadow = 'none';
        }}
        {...props}
      />

      {helperText && (
        <p style={{
          marginTop: '6px',
          fontSize: '13px',
          color: error ? '#EF4444' : '#6B7280',
          fontWeight: '500'
        }}>
          {helperText}
        </p>
      )}
    </div>
  );
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: boolean;
  helperText?: string;
}

export function Textarea({ 
  label, 
  error = false, 
  helperText, 
  style = {},
  ...props 
}: TextareaProps) {
  return (
    <div style={{ width: '100%' }}>
      {label && (
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '600',
          color: error ? '#EF4444' : '#374151',
          marginBottom: '8px'
        }}>
          {label}
          {props.required && <span style={{ color: '#EF4444', marginLeft: '4px' }}>*</span>}
        </label>
      )}
      
      <textarea
        style={{
          width: '100%',
          padding: '12px 16px',
          border: `2px solid ${error ? '#EF4444' : '#E5E7EB'}`,
          borderRadius: '10px',
          fontSize: '15px',
          fontFamily: 'inherit',
          transition: 'all 0.2s ease',
          outline: 'none',
          resize: 'vertical',
          minHeight: '100px',
          ...style
        }}
        onFocus={(e) => {
          if (!error) {
            e.currentTarget.style.borderColor = '#3B82F6';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
          }
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? '#EF4444' : '#E5E7EB';
          e.currentTarget.style.boxShadow = 'none';
        }}
        {...props}
      />

      {helperText && (
        <p style={{
          marginTop: '6px',
          fontSize: '13px',
          color: error ? '#EF4444' : '#6B7280',
          fontWeight: '500'
        }}>
          {helperText}
        </p>
      )}
    </div>
  );
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: boolean;
  helperText?: string;
}

export function Select({ 
  label, 
  error = false, 
  helperText, 
  style = {},
  ...props 
}: SelectProps) {
  return (
    <div style={{ width: '100%' }}>
      {label && (
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '600',
          color: error ? '#EF4444' : '#374151',
          marginBottom: '8px'
        }}>
          {label}
          {props.required && <span style={{ color: '#EF4444', marginLeft: '4px' }}>*</span>}
        </label>
      )}
      
      <select
        style={{
          width: '100%',
          padding: '12px 16px',
          border: `2px solid ${error ? '#EF4444' : '#E5E7EB'}`,
          borderRadius: '10px',
          fontSize: '15px',
          fontFamily: 'inherit',
          transition: 'all 0.2s ease',
          outline: 'none',
          background: '#FFFFFF',
          cursor: 'pointer',
          ...style
        }}
        onFocus={(e) => {
          if (!error) {
            e.currentTarget.style.borderColor = '#3B82F6';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
          }
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? '#EF4444' : '#E5E7EB';
          e.currentTarget.style.boxShadow = 'none';
        }}
        {...props}
      />

      {helperText && (
        <p style={{
          marginTop: '6px',
          fontSize: '13px',
          color: error ? '#EF4444' : '#6B7280',
          fontWeight: '500'
        }}>
          {helperText}
        </p>
      )}
    </div>
  );
}
