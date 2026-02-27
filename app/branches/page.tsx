'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Stats } from '@/components/ui/Stats';

export default function BranchesPage() {
  const router = useRouter();
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      console.log('[Branches Page] Fetching branches...');
      const res = await fetch('/api/branches');
      console.log('[Branches Page] Response status:', res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log('[Branches Page] Response data:', data);
        console.log('[Branches Page] Is array?', Array.isArray(data));
        
        // API returns array directly, not {branches: [...]}
        const branchesData = Array.isArray(data) ? data : (data.branches || []);
        console.log('[Branches Page] Setting branches:', branchesData.length);
        setBranches(branchesData);
      } else {
        console.error('[Branches Page] Response not OK:', res.status, res.statusText);
        const errorData = await res.json().catch(() => ({}));
        console.error('[Branches Page] Error data:', errorData);
      }
    } catch (error) {
      console.error('[Branches Page] Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #E5E7EB',
          borderTop: '4px solid #3B82F6',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}></div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <PageHeader
          title="🏢 الفروع"
          breadcrumbs={['الرئيسية', 'الفروع']}
          actions={
            <Button variant="success" onClick={() => router.push('/branches/new')}>
              ➕ فرع جديد
            </Button>
          }
        />

        <div style={{ marginBottom: '32px' }}>
          <Stats label="إجمالي الفروع" value={branches.length} variant="blue" icon="🏢" />
        </div>

        {branches.length === 0 ? (
          <Card variant="default">
            <div style={{ padding: '60px 40px', textAlign: 'center' }}>
              <div style={{ fontSize: '80px', marginBottom: '24px' }}>🏢</div>
              <h3 style={{ fontSize: '24px', color: '#111827', fontWeight: '800', marginBottom: '12px' }}>
                لا توجد فروع
              </h3>
              <Button variant="success" onClick={() => router.push('/branches/new')}>
                ➕ فرع جديد
              </Button>
            </div>
          </Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {branches.map((branch) => (
              <Card key={branch.id} variant="default" hover>
                <div style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', marginBottom: '8px' }}>
                    {branch.name}
                  </h3>
                  
                  {branch.city && (
                    <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '12px' }}>
                      📍 {branch.city}
                    </p>
                  )}

                  {branch._count && (
                    <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px' }}>
                      👥 {branch._count.employees || 0} موظف
                      {branch._count.stages > 0 && ` • 🎓 ${branch._count.stages} مرحلة`}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => router.push(`/branches/${branch.id}`)}
                    >
                      👁️ عرض
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => router.push(`/branches/${branch.id}/stages`)}
                    >
                      🎓 المراحل
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
