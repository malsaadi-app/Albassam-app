import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  pulse?: boolean;
}

export function Badge({ 
  children, 
  variant = 'blue', 
  size = 'md', 
  dot = false, 
  pulse = false 
}: BadgeProps) {
  const variantColors: Record<string, { bg: string; text: string }> = {
    blue: { bg: '#DBEAFE', text: '#1E40AF' },
    green: { bg: '#D1FAE5', text: '#065F46' },
    yellow: { bg: '#FEF3C7', text: '#92400E' },
    red: { bg: '#FEE2E2', text: '#991B1B' },
    purple: { bg: '#EDE9FE', text: '#5B21B6' },
    gray: { bg: '#F3F4F6', text: '#374151' }
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: {
      padding: '4px 10px',
      fontSize: '12px'
    },
    md: {
      padding: '6px 14px',
      fontSize: '13px'
    },
    lg: {
      padding: '8px 16px',
      fontSize: '14px'
    }
  };

  const colors = variantColors[variant];

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      background: colors.bg,
      color: colors.text,
      borderRadius: '9999px',
      fontWeight: '700',
      ...sizeStyles[size]
    }}>
      {dot && (
        <span style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: colors.text,
          animation: pulse ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
        }} />
      )}
      {children}
      {pulse && (
        <style jsx>{`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
        `}</style>
      )}
    </span>
  );
}
