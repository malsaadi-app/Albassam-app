'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';

export default function AssetDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) fetchAsset();
  }, [params.id]);

  const fetchAsset = async () => {
    try {
      const res = await fetch(`/api/maintenance/assets/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setAsset(data.asset);
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

  if (!asset) {
    return (
      <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
        <Card variant="default" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ padding: '60px 40px', textAlign: 'center' }}>
            <div style={{ fontSize: '80px', marginBottom: '24px' }}>❌</div>
            <h3 style={{ fontSize: '24px', color: '#111827', fontWeight: '800' }}>
              الأصل غير موجود
            </h3>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <PageHeader
          title={`🏢 ${asset.name}`}
          breadcrumbs={['الرئيسية', 'الصيانة', 'الأصول', asset.name]}
          actions={
            <>
              <Button variant="outline" onClick={() => router.push(`/maintenance/requests/new?assetId=${asset.id}`)}>
                🔧 طلب صيانة
              </Button>
              <Button variant="outline" onClick={() => router.push('/maintenance/assets')}>
                ← رجوع
              </Button>
            </>
          }
        />

        <Card variant="default">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#111827', marginBottom: '8px' }}>
                {asset.name}
              </h2>
              {asset.serialNumber && (
                <p style={{ fontSize: '16px', color: '#6B7280', fontWeight: '600' }}>
                  🔢 {asset.serialNumber}
                </p>
              )}
            </div>
            <Badge variant={
              asset.status === 'GOOD' ? 'green' :
              asset.status === 'NEEDS_MAINTENANCE' ? 'yellow' :
              'red'
            }>
              {asset.status === 'GOOD' ? 'بحالة جيدة' :
               asset.status === 'NEEDS_MAINTENANCE' ? 'تحتاج صيانة' :
               asset.status === 'BROKEN' ? 'معطل' : 'خارج الخدمة'}
            </Badge>
          </div>

          <div style={{ display: 'grid', gap: '20px' }}>
            {asset.description && (
              <div>
                <p style={{ fontSize: '14px', color: '#6B7280', fontWeight: '700', marginBottom: '8px' }}>الوصف</p>
                <p style={{ fontSize: '16px', color: '#111827', fontWeight: '600' }}>{asset.description}</p>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {asset.location && (
                <div>
                  <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '700', marginBottom: '4px' }}>الموقع</p>
                  <p style={{ fontSize: '16px', color: '#111827', fontWeight: '800' }}>📍 {asset.location}</p>
                </div>
              )}
              {asset.purchaseDate && (
                <div>
                  <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '700', marginBottom: '4px' }}>تاريخ الشراء</p>
                  <p style={{ fontSize: '16px', color: '#111827', fontWeight: '800' }}>
                    {new Date(asset.purchaseDate).toLocaleDateString('ar-SA')}
                  </p>
                </div>
              )}
              {asset.warrantyEndDate && (
                <div>
                  <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '700', marginBottom: '4px' }}>نهاية الضمان</p>
                  <p style={{ fontSize: '16px', color: '#111827', fontWeight: '800' }}>
                    {new Date(asset.warrantyEndDate).toLocaleDateString('ar-SA')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
