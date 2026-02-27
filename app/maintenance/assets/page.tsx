'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Stats } from '@/components/ui/Stats';
import { Badge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';

export default function MaintenanceAssetsPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAssets();
  }, [statusFilter, search]);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);

      const res = await fetch(`/api/maintenance/assets?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAssets(data.assets || []);
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: assets.length,
    good: assets.filter(a => a.status === 'GOOD').length,
    needsMaintenance: assets.filter(a => a.status === 'NEEDS_MAINTENANCE').length,
    broken: assets.filter(a => a.status === 'BROKEN').length
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
          title="🏢 إدارة الأصول"
          breadcrumbs={['الرئيسية', 'الصيانة', 'الأصول']}
          actions={
            <Button variant="success" onClick={() => router.push('/maintenance/assets/new')}>
              ➕ أصل جديد
            </Button>
          }
        />

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          <Stats label="إجمالي الأصول" value={stats.total} variant="blue" icon="🏢" />
          <Stats label="بحالة جيدة" value={stats.good} variant="green" icon="✅" />
          <Stats label="تحتاج صيانة" value={stats.needsMaintenance} variant="yellow" icon="⚠️" />
          <Stats label="معطلة" value={stats.broken} variant="red" icon="❌" />
        </div>

        <Card variant="default" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <Input
              label="بحث"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="اسم الأصل أو الرقم التسلسلي..."
            />
            <Select
              label="الحالة"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">الكل</option>
              <option value="GOOD">بحالة جيدة</option>
              <option value="NEEDS_MAINTENANCE">تحتاج صيانة</option>
              <option value="BROKEN">معطلة</option>
              <option value="OUT_OF_SERVICE">خارج الخدمة</option>
            </Select>
          </div>
        </Card>

        {assets.length === 0 ? (
          <Card variant="default">
            <div style={{ padding: '60px 40px', textAlign: 'center' }}>
              <div style={{ fontSize: '80px', marginBottom: '24px' }}>🏢</div>
              <h3 style={{ fontSize: '24px', color: '#111827', fontWeight: '800', marginBottom: '12px' }}>
                لا توجد أصول
              </h3>
              <p style={{ fontSize: '16px', color: '#6B7280', marginBottom: '24px' }}>
                ابدأ بإضافة أول أصل
              </p>
              <Button variant="success" onClick={() => router.push('/maintenance/assets/new')}>
                ➕ أصل جديد
              </Button>
            </div>
          </Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {assets.map((asset) => (
              <Card
                key={asset.id}
                variant="default"
                hover
                onClick={() => router.push(`/maintenance/assets/${asset.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', marginBottom: '8px' }}>
                    {asset.name}
                  </h3>
                  <Badge variant={
                    asset.status === 'GOOD' ? 'green' :
                    asset.status === 'NEEDS_MAINTENANCE' ? 'yellow' :
                    'red'
                  }>
                    {asset.status === 'GOOD' ? 'جيد' :
                     asset.status === 'NEEDS_MAINTENANCE' ? 'تحتاج صيانة' :
                     asset.status === 'BROKEN' ? 'معطل' : 'خارج الخدمة'}
                  </Badge>
                </div>

                <div style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.6' }}>
                  {asset.serialNumber && (
                    <p style={{ fontWeight: '600', marginBottom: '4px' }}>
                      🔢 {asset.serialNumber}
                    </p>
                  )}
                  {asset.location && (
                    <p style={{ fontWeight: '600', marginBottom: '4px' }}>
                      📍 {asset.location}
                    </p>
                  )}
                  {asset.purchaseDate && (
                    <p style={{ fontWeight: '600', fontSize: '13px', color: '#9CA3AF', marginTop: '8px' }}>
                      تاريخ الشراء: {new Date(asset.purchaseDate).toLocaleDateString('ar-SA')}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
