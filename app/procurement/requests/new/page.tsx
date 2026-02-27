'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Input, Textarea, Select } from '@/components/ui/Input';
import FileUpload, { UploadedFile } from '@/components/FileUpload';

interface Item {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  specifications: string;
  estimatedPrice: number | '';
}

const categoryLabels: Record<string, string> = {
  STATIONERY: 'قرطاسية',
  CLEANING: 'نظافة',
  MAINTENANCE: 'صيانة',
  FOOD: 'مواد غذائية',
  EQUIPMENT: 'معدات',
  TECHNOLOGY: 'تقنية',
  FURNITURE: 'أثاث',
  TEXTBOOKS: 'كتب دراسية',
  UNIFORMS: 'زي مدرسي',
  OTHER: 'أخرى'
};

const priorityLabels: Record<string, string> = {
  LOW: 'منخفضة',
  NORMAL: 'عادية',
  HIGH: 'عالية',
  URGENT: 'عاجلة'
};

export default function NewPurchaseRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [department, setDepartment] = useState('');
  const [category, setCategory] = useState('STATIONERY');
  const [priority, setPriority] = useState('NORMAL');
  const [justification, setJustification] = useState('');
  const [estimatedBudget, setEstimatedBudget] = useState<string>('');
  const [requiredDate, setRequiredDate] = useState('');
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);

  const [items, setItems] = useState<Item[]>([
    {
      id: '1',
      name: '',
      quantity: 1,
      unit: 'قطعة',
      specifications: '',
      estimatedPrice: ''
    }
  ]);

  const addItem = () => {
    const newId = String(Math.max(...items.map(i => parseInt(i.id)), 0) + 1);
    setItems([...items, {
      id: newId,
      name: '',
      quantity: 1,
      unit: 'قطعة',
      specifications: '',
      estimatedPrice: ''
    }]);
  };

  const removeItem = (id: string) => {
    if (items.length === 1) return;
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof Item, value: any) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!department.trim()) {
      setError('يرجى إدخال اسم القسم');
      return;
    }

    if (items.some(item => !item.name.trim())) {
      setError('يرجى تعبئة أسماء جميع الأصناف');
      return;
    }

    setLoading(true);

    try {
      const requestData = {
        department,
        category,
        priority,
        justification: justification || null,
        estimatedBudget: estimatedBudget ? parseFloat(estimatedBudget) : null,
        requiredDate: requiredDate || null,
        items: items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          specifications: item.specifications || null,
          estimatedPrice: item.estimatedPrice ? parseFloat(String(item.estimatedPrice)) : null
        })),
        attachments: attachments.length > 0 ? JSON.stringify(attachments) : null
      };

      const response = await fetch('/api/procurement/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();

      if (response.ok) {
        router.push(`/procurement/requests/${data.request.id}`);
      } else {
        setError(data.error || 'فشل إنشاء الطلب');
      }
    } catch (err) {
      console.error('Error creating request:', err);
      setError('حدث خطأ. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const totalEstimated = items.reduce((sum, item) => {
    const price = item.estimatedPrice ? parseFloat(String(item.estimatedPrice)) : 0;
    return sum + (price * item.quantity);
  }, 0);

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <PageHeader
          title="📝 إنشاء طلب شراء جديد"
          breadcrumbs={['الرئيسية', 'المشتريات', 'طلبات الشراء', 'جديد']}
          actions={
            <Button variant="outline" onClick={() => router.push('/procurement/requests')}>
              ← العودة
            </Button>
          }
        />

        <form onSubmit={handleSubmit}>
          {/* Error Message */}
          {error && (
            <div style={{
              background: '#FEE2E2',
              border: '2px solid #EF4444',
              color: '#991B1B',
              padding: '16px 20px',
              borderRadius: '12px',
              marginBottom: '24px',
              fontSize: '15px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ fontSize: '24px' }}>⚠️</span>
              {error}
            </div>
          )}

          {/* Basic Info */}
          <Card variant="default" className="mb-6">
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#111827', marginBottom: '24px' }}>
              📋 معلومات الطلب الأساسية
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              <Input
                label="القسم الطالب"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="مثال: القسم التعليمي"
              />

              <Select
                label="الفئة"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </Select>

              <Select
                label="الأولوية"
                required
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                {Object.entries(priorityLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </Select>
            </div>

            <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              <Input
                label="الميزانية المقدرة (ر.س)"
                type="number"
                step="0.01"
                value={estimatedBudget}
                onChange={(e) => setEstimatedBudget(e.target.value)}
                placeholder="0.00"
              />

              <Input
                label="التاريخ المطلوب"
                type="date"
                value={requiredDate}
                onChange={(e) => setRequiredDate(e.target.value)}
              />
            </div>

            <div style={{ marginTop: '20px' }}>
              <Textarea
                label="المبرر / الملاحظات"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                rows={3}
                placeholder="اذكر سبب الطلب أو أي ملاحظات إضافية..."
              />
            </div>
          </Card>

          {/* Items */}
          <Card variant="default" className="mb-6">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#111827', margin: 0 }}>
                📦 الأصناف المطلوبة ({items.length})
              </h3>
              <Button type="button" variant="primary" size="sm" onClick={addItem}>
                + إضافة صنف
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {items.map((item, index) => (
                <div 
                  key={item.id}
                  style={{
                    background: '#F9FAFB',
                    border: '2px solid #E5E7EB',
                    borderRadius: '12px',
                    padding: '20px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#374151', margin: 0 }}>
                      الصنف {index + 1}
                    </h4>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                      >
                        🗑️ حذف
                      </Button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <Input
                      label="اسم الصنف"
                      required
                      value={item.name}
                      onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                      placeholder="مثال: دفاتر 100 ورقة"
                    />

                    <Input
                      label="الكمية"
                      type="number"
                      required
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                    />

                    <Input
                      label="الوحدة"
                      required
                      value={item.unit}
                      onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                      placeholder="قطعة، كيلو، صندوق"
                    />

                    <Input
                      label="السعر المقدر للوحدة (ر.س)"
                      type="number"
                      step="0.01"
                      value={item.estimatedPrice}
                      onChange={(e) => updateItem(item.id, 'estimatedPrice', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  <div style={{ marginTop: '16px' }}>
                    <Textarea
                      label="المواصفات"
                      value={item.specifications}
                      onChange={(e) => updateItem(item.id, 'specifications', e.target.value)}
                      rows={2}
                      placeholder="أي مواصفات أو تفاصيل إضافية..."
                    />
                  </div>

                  {item.estimatedPrice && (
                    <div style={{
                      marginTop: '12px',
                      padding: '12px',
                      background: '#EFF6FF',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '700',
                      color: '#1E40AF'
                    }}>
                      الإجمالي: {(item.quantity * parseFloat(String(item.estimatedPrice))).toLocaleString('ar-SA')} ر.س
                    </div>
                  )}
                </div>
              ))}
            </div>

            {totalEstimated > 0 && (
              <div style={{
                marginTop: '20px',
                padding: '20px',
                background: '#D1FAE5',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '14px', color: '#065F46', fontWeight: '600', marginBottom: '8px' }}>
                  الإجمالي المقدر
                </p>
                <p style={{ fontSize: '32px', fontWeight: '800', color: '#059669', margin: 0 }}>
                  {totalEstimated.toLocaleString('ar-SA')} ر.س
                </p>
              </div>
            )}
          </Card>

          {/* Attachments */}
          <Card variant="default" className="mb-6">
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#111827', marginBottom: '24px' }}>
              📎 المرفقات (اختياري)
            </h3>
            <FileUpload
              onUpload={setAttachments}
            />
          </Card>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => router.push('/procurement/requests')}
              disabled={loading}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="success"
              size="lg"
              loading={loading}
            >
              {loading ? 'جاري الإنشاء...' : '✅ إنشاء الطلب'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
