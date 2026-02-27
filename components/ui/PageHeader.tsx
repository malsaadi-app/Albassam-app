import React from 'react';

export interface PageHeaderProps {
  title: React.ReactNode;
  breadcrumbs?: string[];
  actions?: React.ReactNode;
}

export function PageHeader({ title, breadcrumbs = [], actions }: PageHeaderProps) {
  return (
    <div style={{ marginBottom: '32px' }}>
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          color: '#6B7280',
          marginBottom: '12px',
          flexWrap: 'wrap'
        }}>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              <span style={{
                color: index === breadcrumbs.length - 1 ? '#111827' : '#6B7280',
                fontWeight: index === breadcrumbs.length - 1 ? '600' : '500'
              }}>
                {crumb}
              </span>
              {index < breadcrumbs.length - 1 && <span>/</span>}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Title & Actions */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px',
        flexWrap: 'wrap'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '800',
          color: '#111827',
          margin: 0
        }}>
          {title}
        </h1>

        {actions && (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
