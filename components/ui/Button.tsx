import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  children, 
  disabled,
  style = {},
  ...props 
}: ButtonProps) {
  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: '#3B82F6',
      color: '#FFFFFF',
      border: '1px solid #3B82F6'
    },
    secondary: {
      background: '#6B7280',
      color: '#FFFFFF',
      border: '1px solid #6B7280'
    },
    success: {
      background: '#10B981',
      color: '#FFFFFF',
      border: '1px solid #10B981'
    },
    danger: {
      background: '#EF4444',
      color: '#FFFFFF',
      border: '1px solid #EF4444'
    },
    warning: {
      background: '#F59E0B',
      color: '#FFFFFF',
      border: '1px solid #F59E0B'
    },
    outline: {
      background: '#FFFFFF',
      color: '#374151',
      border: '2px solid #E5E7EB'
    },
    ghost: {
      background: 'transparent',
      color: '#374151',
      border: 'none'
    }
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: {
      padding: '8px 16px',
      fontSize: '14px'
    },
    md: {
      padding: '12px 24px',
      fontSize: '15px'
    },
    lg: {
      padding: '14px 28px',
      fontSize: '16px'
    }
  };

  const baseStyles: React.CSSProperties = {
    borderRadius: '10px',
    fontWeight: '600',
    cursor: loading || disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    opacity: loading || disabled ? 0.6 : 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontFamily: 'inherit',
    ...variantStyles[variant],
    ...sizeStyles[size],
    ...style
  };

  return (
    <button
      style={baseStyles}
      disabled={loading || disabled}
      {...props}
      onMouseEnter={(e) => {
        if (!loading && !disabled) {
          if (variant === 'primary') e.currentTarget.style.background = '#2563EB';
          if (variant === 'secondary') e.currentTarget.style.background = '#4B5563';
          if (variant === 'success') e.currentTarget.style.background = '#059669';
          if (variant === 'danger') e.currentTarget.style.background = '#DC2626';
          if (variant === 'warning') e.currentTarget.style.background = '#D97706';
          if (variant === 'outline') e.currentTarget.style.background = '#F9FAFB';
          if (variant === 'ghost') e.currentTarget.style.background = '#F3F4F6';
        }
      }}
      onMouseLeave={(e) => {
        if (!loading && !disabled) {
          e.currentTarget.style.background = variantStyles[variant].background as string;
        }
      }}
    >
      {loading && (
        <div style={{
          width: '16px',
          height: '16px',
          border: '2px solid rgba(255,255,255,0.3)',
          borderTop: '2px solid #FFFFFF',
          borderRadius: '50%',
          animation: 'spin 0.6s linear infinite'
        }} />
      )}
      {children}
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
}
