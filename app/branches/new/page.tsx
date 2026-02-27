'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LocationPicker } from '@/components/map/LocationPicker';

export default function NewBranchPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'SCHOOL' as 'SCHOOL' | 'INSTITUTE' | 'COMPANY',
    commercialRegNo: '',
    buildingNo: '',
    address: '',
    city: '',
    postalCode: '',
    phone: '',
    email: '',
    latitude: '',
    longitude: '',
    geofenceRadius: '100',
    workStartTime: '07:00',
    workEndTime: '14:00',
    workDays: '0,1,2,3,4',
    stages: [] as string[] // المراحل المختارة
  });
  const [gettingLocation, setGettingLocation] = useState(false);
  
  // Available stages for schools
  const availableStages = [
    'رياض أطفال',
    'ابتدائية',
    'متوسطة',
    'ثانوية'
  ];

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('❌ المتصفح لا يدعم تحديد الموقع');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6)
        });
        setGettingLocation(false);
        alert('✅ تم تحديد الموقع الحالي!');
      },
      (error) => {
        setGettingLocation(false);
        alert('❌ لم نتمكن من تحديد موقعك. تأكد من السماح للمتصفح بالوصول للموقع.');
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert('✅ تم إضافة الفرع بنجاح!');
        router.push('/branches');
      } else {
        const error = await res.json();
        alert('❌ ' + (error.error || 'حدث خطأ في إضافة الفرع'));
        setLoading(false);
      }
    } catch (error) {
      alert('❌ حدث خطأ في الاتصال بالخادم');
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <PageHeader
          title="➕ إضافة فرع جديد"
          breadcrumbs={['الرئيسية', 'الفروع', 'جديد']}
        />

        <Card variant="default">
          <form onSubmit={handleSubmit} style={{ padding: '32px' }}>
            {/* Basic Info */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '20px' }}>
                📋 المعلومات الأساسية
              </h3>
              
              <div style={{ display: 'grid', gap: '20px' }}>
                <Input
                  label="اسم الفرع *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: مجمع البسام الأهلية بنين"
                  required
                />

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '500', 
                    fontSize: '14px',
                    color: '#374151' 
                  }}>
                    نوع الفرع *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      background: 'white'
                    }}
                    required
                  >
                    <option value="SCHOOL">🏫 مدرسة</option>
                    <option value="INSTITUTE">🎓 معهد</option>
                    <option value="COMPANY">🏢 شركة</option>
                  </select>
                </div>

                <Input
                  label="رقم السجل التجاري"
                  value={formData.commercialRegNo}
                  onChange={(e) => setFormData({ ...formData, commercialRegNo: e.target.value })}
                  placeholder="مثال: 1234567890"
                />
              </div>
            </div>

            {/* Educational Stages */}
            {formData.type === 'SCHOOL' && (
              <div style={{ 
                marginBottom: '32px',
                paddingTop: '32px',
                borderTop: '1px solid #E5E7EB'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '20px' }}>
                  🎓 المراحل التعليمية
                </h3>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px',
                  marginBottom: '12px'
                }}>
                  {availableStages.map((stage) => (
                    <label
                      key={stage}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 16px',
                        border: formData.stages.includes(stage) ? '2px solid #3B82F6' : '2px solid #E5E7EB',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        background: formData.stages.includes(stage) ? '#EFF6FF' : 'white',
                        transition: 'all 0.2s',
                        fontWeight: formData.stages.includes(stage) ? '600' : '500',
                        color: formData.stages.includes(stage) ? '#1E40AF' : '#374151'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.stages.includes(stage)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              stages: [...formData.stages, stage]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              stages: formData.stages.filter(s => s !== stage)
                            });
                          }
                        }}
                        style={{
                          width: '18px',
                          height: '18px',
                          cursor: 'pointer',
                          accentColor: '#3B82F6'
                        }}
                      />
                      <span>{stage}</span>
                    </label>
                  ))}
                </div>
                <p style={{
                  marginTop: '8px',
                  fontSize: '12px',
                  color: '#6B7280'
                }}>
                  💡 اختر المراحل الموجودة في هذا الفرع
                </p>
              </div>
            )}

            {/* Location Info */}
            <div style={{ 
              marginBottom: '32px',
              paddingTop: '32px',
              borderTop: '1px solid #E5E7EB'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '20px' }}>
                📍 معلومات الموقع
              </h3>
              
              <div style={{ display: 'grid', gap: '20px' }}>
                <Input
                  label="العنوان"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="مثال: طريق الملك فهد، حي العليا"
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <Input
                    label="المدينة"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="الرياض"
                  />

                  <Input
                    label="الرمز البريدي"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    placeholder="12345"
                  />
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div style={{ 
              marginBottom: '32px',
              paddingTop: '32px',
              borderTop: '1px solid #E5E7EB'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '20px' }}>
                📞 معلومات الاتصال
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <Input
                  label="رقم الهاتف"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0501234567"
                  type="tel"
                />

                <Input
                  label="البريد الإلكتروني"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="branch@albassam.edu.sa"
                  type="email"
                />
              </div>
            </div>

            {/* GPS Location with Interactive Map */}
            <div style={{ 
              marginBottom: '32px',
              paddingTop: '32px',
              borderTop: '1px solid #E5E7EB'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>
                  🗺️ الموقع الجغرافي (GPS)
                </h3>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                >
                  {gettingLocation ? '⏳ جاري...' : '📍 موقعي الحالي'}
                </Button>
              </div>
              
              <LocationPicker
                latitude={formData.latitude ? parseFloat(formData.latitude) : null}
                longitude={formData.longitude ? parseFloat(formData.longitude) : null}
                radius={parseInt(formData.geofenceRadius)}
                onLocationChange={(lat, lng) => {
                  setFormData({
                    ...formData,
                    latitude: lat.toFixed(6),
                    longitude: lng.toFixed(6)
                  });
                }}
                onRadiusChange={(radius) => {
                  setFormData({
                    ...formData,
                    geofenceRadius: radius.toString()
                  });
                }}
              />
            </div>

            {/* Work Hours */}
            <div style={{ 
              marginBottom: '32px',
              paddingTop: '32px',
              borderTop: '1px solid #E5E7EB'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '20px' }}>
                ⏰ أوقات العمل
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <Input
                  label="بداية الدوام"
                  value={formData.workStartTime}
                  onChange={(e) => setFormData({ ...formData, workStartTime: e.target.value })}
                  type="time"
                />
                
                <Input
                  label="نهاية الدوام"
                  value={formData.workEndTime}
                  onChange={(e) => setFormData({ ...formData, workEndTime: e.target.value })}
                  type="time"
                />
              </div>
              
              <div style={{ 
                marginTop: '16px',
                padding: '12px 16px',
                background: '#F3F4F6',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#6B7280'
              }}>
                💡 أيام العمل الافتراضية: الأحد - الخميس (يمكن تعديلها لاحقاً)
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              justifyContent: 'flex-end',
              paddingTop: '24px',
              borderTop: '1px solid #E5E7EB'
            }}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
                disabled={loading}
              >
                ← إلغاء
              </Button>
              
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
              >
                {loading ? '⏳ جاري الحفظ...' : '✅ حفظ الفرع'}
              </Button>
            </div>
          </form>
        </Card>
      </div>

    </div>
  );
}
