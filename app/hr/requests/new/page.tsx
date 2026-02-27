'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Input, Textarea, Select } from '@/components/ui/Input';

export default function NewHRRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    requestType: '',
    priority: 'MEDIUM',
    description: '',
    requestedDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.requestType || !formData.description) {
      alert('يرجى تعبئة الحقول المطلوبة');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/hr/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert('تم إنشاء الطلب بنجاح');
        router.push('/hr/requests');
      } else {
        const data = await res.json();
        alert(data.error || 'حدث خطأ');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('حدث خطأ أثناء إرسال الطلب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <PageHeader
          title="➕ طلب HR جديد"
          breadcrumbs={['الرئيسية', 'الموارد البشرية', 'الطلبات', 'جديد']}
          actions={
            <Button variant="outline" onClick={() => router.push('/hr/requests')}>
              ← رجوع
            </Button>
          }
        />

        <Card variant="default">
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gap: '24px' }}>
              <Select
                label="نوع الطلب *"
                value={formData.requestType}
                onChange={(e) => setFormData({ ...formData, requestType: e.target.value })}
                required
              >
                <option value="">اختر نوع الطلب...</option>
                <option value="LEAVE">طلب إجازة</option>
                <option value="TRANSFER">طلب نقل</option>
                <option value="PROMOTION">طلب ترقية</option>
                <option value="SALARY_REVIEW">مراجعة راتب</option>
                <option value="TRAINING">طلب تدريب</option>
                <option value="RESIGNATION">استقالة</option>
                <option value="COMPLAINT">شكوى</option>
                <option value="CERTIFICATE">طلب شهادة</option>
                <option value="DOCUMENT">طلب وثيقة</option>
                <option value="OTHER">أخرى</option>
              </Select>

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

              <Input
                label="التاريخ المطلوب *"
                type="date"
                value={formData.requestedDate}
                onChange={(e) => setFormData({ ...formData, requestedDate: e.target.value })}
                required
              />

              <Textarea
                label="الوصف التفصيلي *"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
                placeholder="اكتب تفاصيل الطلب هنا..."
                required
              />

              <Textarea
                label="ملاحظات إضافية"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="أي ملاحظات أخرى (اختياري)"
              />

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #E5E7EB' }}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/hr/requests')}
                  disabled={loading}
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  variant="success"
                  loading={loading}
                >
                  📝 إرسال الطلب
                </Button>
              </div>
            </div>
          </form>
        </Card>

        {/* Help Card */}
        <Card variant="outlined" style={{ marginTop: '24px', background: '#F0F9FF' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#111827', marginBottom: '12px' }}>
            💡 نصائح عند إنشاء الطلب:
          </h3>
          <ul style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.8', paddingRight: '20px' }}>
            <li>اختر نوع الطلب المناسب بدقة</li>
            <li>اكتب وصفاً واضحاً ومفصلاً</li>
            <li>حدد الأولوية بناءً على الاستعجال الفعلي</li>
            <li>أرفق أي مستندات داعمة إن وجدت</li>
            <li>سيتم إشعارك عند مراجعة الطلب</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
