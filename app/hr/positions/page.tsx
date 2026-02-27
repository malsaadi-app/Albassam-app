'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';

export default function PositionsPage() {
  const router = useRouter();
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPositions();
  }, []);

  const fetchPositions = async () => {
    try {
      const res = await fetch('/api/hr/positions');
      if (res.ok) {
        const data = await res.json();
        setPositions(Array.isArray(data) ? data : data.positions || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <PageHeader title="💼 الوظائف" breadcrumbs={['الرئيسية', 'الموارد البشرية', 'الوظائف']} />
          <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '12px' }}>
            <div style={{ fontSize: '24px' }}>⏳</div>
            <div style={{ marginTop: '12px', color: '#6B7280' }}>جاري التحميل...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <PageHeader title="💼 الوظائف" breadcrumbs={['الرئيسية', 'الموارد البشرية', 'الوظائف']} />
        
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={() => router.push('/hr/positions/new')}
            style={{
              padding: '12px 24px',
              background: '#10B981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            + إضافة وظيفة جديدة
          </button>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          {positions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
              <div>لا توجد وظائف</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {positions.map((pos: any) => (
                <div
                  key={pos.id}
                  style={{
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                      {pos.title || pos.name || pos.nameAr}
                    </h3>
                    {pos.department && (
                      <div style={{ fontSize: '14px', color: '#6B7280' }}>{pos.department}</div>
                    )}
                  </div>
                  <button
                    onClick={() => router.push(`/hr/positions/${pos.id}`)}
                    style={{
                      padding: '8px 16px',
                      background: '#3B82F6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    عرض
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
