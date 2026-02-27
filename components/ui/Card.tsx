import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'outlined' | 'elevated';
  hover?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function Card({ 
  children, 
  variant = 'default', 
  hover = false, 
  className = '', 
  style = {},
  onClick 
}: CardProps) {
  const baseStyles: React.CSSProperties = {
    background: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    transition: 'all 0.2s ease',
    ...style
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      border: '1px solid #E5E7EB'
    },
    outlined: {
      border: '2px solid #3B82F6'
    },
    elevated: {
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      border: '1px solid #F3F4F6'
    }
  };

  const hoverStyles: React.CSSProperties = hover ? {
    cursor: 'pointer'
  } : {};

  const combinedStyles = {
    ...baseStyles,
    ...variantStyles[variant],
    ...hoverStyles
  };

  return (
    <div 
      className={className}
      style={combinedStyles}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (hover) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.12)';
        }
      }}
      onMouseLeave={(e) => {
        if (hover) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = variantStyles[variant].boxShadow || 'none';
        }
      }}
    >
      {children}
    </div>
  );
}
