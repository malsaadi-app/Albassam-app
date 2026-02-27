'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Input, Textarea, Select } from '@/components/ui/Input';

export default function NewMaintenanceRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    assetId: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/maintenance/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert('تم إنشاء الطلب بنجاح');
        router.push('/maintenance/requests');
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
          title="➕ طلب صيانة جديد"
          breadcrumbs={['الرئيسية', 'الصيانة', 'الطلبات', 'جديد']}
          actions={
            <Button variant="outline" onClick={() => router.push('/maintenance/requests')}>
              ← رجوع
            </Button>
          }
        />

        <Card variant="default">
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gap: '20px' }}>
              <Input
                label="العنوان *"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />

              <Textarea
                label="الوصف *"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
                required
              />

              <Select
                label="الأولوية *"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                required
              >
                <option value="LOW">منخفضة</option>
                <option value="MEDIUM">متوسطة</option>
                <option value="HIGH">عالية</option>
                <option value="URGENT">عاجلة</option>
              </Select>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #E5E7EB' }}>
                <Button type="button" variant="outline" onClick={() => router.push('/maintenance/requests')}>
                  إلغاء
                </Button>
                <Button type="submit" variant="success" loading={loading}>
                  📝 إرسال الطلب
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
