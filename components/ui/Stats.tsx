import React from 'react';

export interface StatsProps {
  label: string;
  value: number | string;
  variant?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
  trend?: 'up' | 'down';
  icon?: React.ReactNode;
}

export function Stats({ label, value, variant = 'blue', trend, icon }: StatsProps) {
  const variantColors: Record<string, { bg: string; text: string; border: string }> = {
    blue: { bg: '#EFF6FF', text: '#1E40AF', border: '#3B82F6' },
    green: { bg: '#D1FAE5', text: '#065F46', border: '#10B981' },
    yellow: { bg: '#FEF3C7', text: '#92400E', border: '#F59E0B' },
    red: { bg: '#FEE2E2', text: '#991B1B', border: '#EF4444' },
    purple: { bg: '#EDE9FE', text: '#5B21B6', border: '#8B5CF6' },
    gray: { bg: '#F3F4F6', text: '#374151', border: '#6B7280' }
  };

  const colors = variantColors[variant];

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E5E7EB',
      borderLeft: `4px solid ${colors.border}`,
      borderRadius: '16px',
      padding: '24px',
      transition: 'all 0.2s ease'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.08)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
    }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '8px'
      }}>
        <div style={{
          fontSize: '14px',
          color: '#6B7280',
          fontWeight: '600'
        }}>
          {label}
        </div>
        {icon && (
          <div style={{ fontSize: '24px', opacity: 0.7 }}>
            {icon}
          </div>
        )}
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          fontSize: '36px',
          fontWeight: '800',
          color: colors.text
        }}>
          {value}
        </div>

        {trend && (
          <div style={{
            fontSize: '20px',
            color: trend === 'up' ? '#EF4444' : '#10B981'
          }}>
            {trend === 'up' ? '↑' : '↓'}
          </div>
        )}
      </div>
    </div>
  );
}
