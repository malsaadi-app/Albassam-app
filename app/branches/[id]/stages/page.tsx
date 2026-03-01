'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Stage {
  id: string;
  name: string;
  code?: string;
  latitude?: number;
  longitude?: number;
  geofenceRadius: number;
  status: string;
  _count?: {
    employees: number;
  };
}

export default function BranchStagesPage() {
  const params = useParams();
  const router = useRouter();
  const branchId = params.id as string;
  
  const [stages, setStages] = useState<Stage[]>([]);
  const [branchName, setBranchName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    latitude: '',
    longitude: '',
    geofenceRadius: '100'
  });

  useEffect(() => {
    fetchBranch();
    fetchStages();
  }, [branchId]);

  const fetchBranch = async () => {
    try {
      const res = await fetch(`/api/branches/${branchId}`);
      if (res.ok) {
        const data = await res.json();
        setBranchName(data.branch?.name || '');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchStages = async () => {
    try {
      const res = await fetch(`/api/stages?branchId=${branchId}`);
      if (res.ok) {
        const data = await res.json();
        setStages(data.stages || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const res = await fetch('/api/stages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          branchId,
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
          geofenceRadius: parseInt(formData.geofenceRadius)
        })
      });

      if (res.ok) {
        alert('✅ تم إضافة المرحلة بنجاح!');
        setShowForm(false);
        setFormData({ name: '', code: '', latitude: '', longitude: '', geofenceRadius: '100' });
        fetchStages();
      } else {
        const error = await res.json();
        alert('❌ ' + (error.error || 'حدث خطأ'));
      }
    } catch (error) {
      alert('❌ حدث خطأ في الاتصال');
    }
  };

  const quickAddStage = async (stageName: string) => {
    try {
      const res = await fetch('/api/stages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId,
          name: stageName,
          geofenceRadius: 100
        })
      });

      if (res.ok) {
        fetchStages();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <p style={{ color: '#6B7280' }}>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <PageHeader
          title={`🏫 مراحل ${branchName}`}
          breadcrumbs={['الرئيسية', 'الفروع', branchName, 'المراحل']}
          actions={
            <Button variant="primary" onClick={() => setShowForm(!showForm)}>
              {showForm ? '❌ إلغاء' : '➕ إضافة مرحلة'}
            </Button>
          }
        />

        {/* Quick Add Buttons */}
        {stages.length === 0 && !showForm && (
          <Card variant="default" style={{ marginBottom: '24px' }}>
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '16px' }}>
                🎓 إضافة سريعة للمراحل
              </h3>
              <p style={{ color: '#6B7280', marginBottom: '20px' }}>
                اضغط على المرحلة لإضافتها مباشرة
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {['رياض الأطفال', 'ابتدائي', 'متوسط', 'ثانوي'].map((name) => (
                  <Button
                    key={name}
                    variant="secondary"
                    onClick={() => quickAddStage(name)}
                  >
                    ➕ {name}
                  </Button>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Add Form */}
        {showForm && (
          <Card variant="default" style={{ marginBottom: '24px' }}>
            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '20px' }}>
                ➕ إضافة مرحلة جديدة
              </h3>
              
              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                  <Input
                    label="اسم المرحلة *"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثال: ابتدائي"
                    required
                  />
                  
                  <Input
                    label="الكود (اختياري)"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="PRIM"
                  />
                </div>

                <div style={{ padding: '16px', background: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
                    📍 الموقع (اختياري - إذا كانت المرحلة في مبنى منفصل)
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <Input
                      label="Latitude"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      placeholder="24.7136"
                      type="number"
                      step="any"
                    />
                    
                    <Input
                      label="Longitude"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      placeholder="46.6753"
                      type="number"
                      step="any"
                    />
                    
                    <Input
                      label="النطاق (متر)"
                      value={formData.geofenceRadius}
                      onChange={(e) => setFormData({ ...formData, geofenceRadius: e.target.value })}
                      placeholder="100"
                      type="number"
                    />
                  </div>
                  
                  <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '8px' }}>
                    💡 إذا تركت الموقع فارغاً، سيتم استخدام موقع الفرع الرئيسي
                  </p>
                </div>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                  إلغاء
                </Button>
                <Button type="submit" variant="primary">
                  ✅ حفظ المرحلة
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Stages List */}
        {stages.length === 0 && !showForm ? (
          <Card variant="default">
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎓</div>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
                لا توجد مراحل بعد
              </h3>
              <p style={{ color: '#6B7280', marginBottom: '24px' }}>
                ابدأ بإضافة مراحل دراسية للفرع
              </p>
            </div>
          </Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {stages.map((stage) => (
              <Card key={stage.id} variant="default" hover>
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>
                      {stage.name}
                    </h3>
                    {stage.code && (
                      <span style={{
                        padding: '4px 8px',
                        background: '#EFF6FF',
                        color: '#1E40AF',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {stage.code}
                      </span>
                    )}
                  </div>

                  {stage._count && (
                    <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>
                      👥 {stage._count.employees} موظف
                    </div>
                  )}

                  {stage.latitude && stage.longitude && (
                    <div style={{ fontSize: '13px', color: '#059669', marginBottom: '8px' }}>
                      📍 موقع GPS محدد
                    </div>
                  )}

                  <div style={{ fontSize: '13px', color: '#6B7280' }}>
                    📏 النطاق: {stage.geofenceRadius} متر
                  </div>

                  <div style={{ marginTop: '14px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <Button
                      variant="secondary"
                      onClick={() => router.push(`/branches/${branchId}/stages/${stage.id}`)}
                    >
                      ⚙️ إدارة
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
