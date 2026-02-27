'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Input, Textarea, Select } from '@/components/ui/Input';

export default function NewAssetPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    serialNumber: '',
    description: '',
    location: '',
    status: 'GOOD',
    purchaseDate: '',
    warrantyEndDate: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/maintenance/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert('تم إضافة الأصل بنجاح');
        router.push('/maintenance/assets');
      } else {
        alert('حدث خطأ');
      }
    } catch (error) {
      alert('حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <PageHeader
          title="➕ أصل جديد"
          breadcrumbs={['الرئيسية', 'الصيانة', 'الأصول', 'جديد']}
          actions={
            <Button variant="outline" onClick={() => router.push('/maintenance/assets')}>
              ← رجوع
            </Button>
          }
        />

        <Card variant="default">
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gap: '20px' }}>
              <Input
                label="اسم الأصل *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              <Input
                label="الرقم التسلسلي"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              />

              <Textarea
                label="الوصف"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />

              <Input
                label="الموقع"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />

              <Select
                label="الحالة *"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                required
              >
                <option value="GOOD">بحالة جيدة</option>
                <option value="NEEDS_MAINTENANCE">تحتاج صيانة</option>
                <option value="BROKEN">معطل</option>
                <option value="OUT_OF_SERVICE">خارج الخدمة</option>
              </Select>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <Input
                  label="تاريخ الشراء"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                />
                <Input
                  label="نهاية الضمان"
                  type="date"
                  value={formData.warrantyEndDate}
                  onChange={(e) => setFormData({ ...formData, warrantyEndDate: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #E5E7EB' }}>
                <Button type="button" variant="outline" onClick={() => router.push('/maintenance/assets')}>
                  إلغاء
                </Button>
                <Button type="submit" variant="success" loading={loading}>
                  💾 حفظ
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
