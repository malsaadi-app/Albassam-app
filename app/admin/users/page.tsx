'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
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
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <PageHeader
          title="👥 إدارة المستخدمين"
          breadcrumbs={['الرئيسية', 'الإدارة', 'المستخدمين']}
          actions={
            <Button variant="success" onClick={() => router.push('/admin/users/new')}>
              ➕ مستخدم جديد
            </Button>
          }
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {users.map((user) => (
            <Card
              key={user.id}
              variant="default"
              hover
              onClick={() => router.push(`/admin/users/${user.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', marginBottom: '4px' }}>
                    {user.displayName}
                  </h3>
                  <p style={{ fontSize: '14px', color: '#6B7280', fontWeight: '600' }}>
                    @{user.username}
                  </p>
                </div>
                <Badge variant="blue">{user.role}</Badge>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
