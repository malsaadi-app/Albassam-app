'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Stats } from '@/components/ui/Stats';

export default function ReplacementsPage() {
  const router = useRouter();
  const [replacements, setReplacements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReplacements();
  }, []);

  const fetchReplacements = async () => {
    try {
      const res = await fetch('/api/hr/replacements');
      if (res.ok) {
        const data = await res.json();
        setReplacements(data.replacements || []);
      }
    } catch (error) {
      console.error('Error:', error);
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
          title="🔄 إدارة الإبدالات"
          breadcrumbs={['الرئيسية', 'الموارد البشرية', 'الإبدالات']}
          actions={
            <Button variant="success" onClick={() => router.push('/hr/replacements/new')}>
              ➕ إبدال جديد
            </Button>
          }
        />

        <div style={{ marginBottom: '32px' }}>
          <Stats label="إجمالي الإبدالات" value={replacements.length} variant="blue" icon="🔄" />
        </div>

        {replacements.length === 0 ? (
          <Card variant="default">
            <div style={{ padding: '60px 40px', textAlign: 'center' }}>
              <div style={{ fontSize: '80px', marginBottom: '24px' }}>🔄</div>
              <h3 style={{ fontSize: '24px', color: '#111827', fontWeight: '800', marginBottom: '12px' }}>
                لا توجد إبدالات
              </h3>
              <Button variant="success" onClick={() => router.push('/hr/replacements/new')}>
                ➕ إبدال جديد
              </Button>
            </div>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {replacements.map((replacement) => (
              <Card key={replacement.id} variant="default" hover onClick={() => router.push(`/hr/replacements/${replacement.id}`)} style={{ cursor: 'pointer' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', marginBottom: '8px' }}>
                  {replacement.name}
                </h3>
                <p style={{ fontSize: '14px', color: '#6B7280', fontWeight: '600' }}>
                  {new Date(replacement.date).toLocaleDateString('ar-SA')}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
