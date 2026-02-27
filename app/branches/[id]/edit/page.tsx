'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Using Leaflet instead of Google Maps (lighter, faster, no API key needed)
const BranchMap = dynamic(() => import('@/app/components/LeafletBranchMap'), {
  ssr: false,
  loading: () => (
    <div style={{
      height: '450px',
      width: '100%',
      borderRadius: '12px',
      border: '2px solid #D1D5DB',
      background: '#F3F4F6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <div style={{ fontSize: '2rem' }}>🗺️</div>
      <div style={{ color: '#6B7280' }}>جاري تحميل الخريطة...</div>
    </div>
  ),
});

export default function EditBranchPage() {
  const params = useParams();
  const router = useRouter();
  const [form, setForm] = useState<any>({
    name: '',
    type: '',
    geofenceRadius: 100,
    workStartTime: '07:00',
    workEndTime: '15:00',
    latitude: null,
    longitude: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetch(`/api/branches/${params.id}`)
        .then(r => r.json())
        .then(d => {
          setForm(d);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error loading branch:', err);
          alert('خطأ في تحميل البيانات');
          setLoading(false);
        });
    }
  }, [params.id]);

  const handleSubmit = async () => {
    if (!form.name) {
      alert('الرجاء إدخال اسم الفرع');
      return;
    }
    if (!form.type) {
      alert('الرجاء اختيار نوع الفرع');
      return;
    }

    try {
      const res = await fetch(`/api/branches/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          latitude: form.latitude ? parseFloat(form.latitude) : null,
          longitude: form.longitude ? parseFloat(form.longitude) : null,
          geofenceRadius: parseInt(form.geofenceRadius) || 100,
        })
      });

      if (res.ok) {
        alert('✅ تم تحديث الفرع بنجاح');
        router.push(`/branches/${params.id}`);
      } else {
        const error = await res.json();
        alert(`خطأ: ${error.error || 'حدث خطأ في التحديث'}`);
      }
    } catch (err) {
      console.error('Submit error:', err);
      alert('حدث خطأ في الحفظ');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '12px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⏳</div>
            <div style={{ fontSize: '1.125rem', color: '#6B7280' }}>جاري التحميل...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px', paddingBottom: '80px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={() => router.back()}
            style={{
              padding: '8px 16px',
              background: '#E5E7EB',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              marginBottom: '16px'
            }}
          >
            ← رجوع
          </button>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '700', margin: 0 }}>
            ✏️ تعديل الفرع
          </h1>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', padding: '24px' }}>
          
          {/* Basic Info */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '16px' }}>
              📋 المعلومات الأساسية
            </h3>
            <div style={{ display: 'grid', gap: '16px' }}>
              <input
                type="text"
                value={form.name || ''}
                onChange={(e) => setForm({...form, name: e.target.value})}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: '1px solid #D1D5DB', 
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
                placeholder="اسم الفرع *"
              />
              <select
                value={form.type || ''}
                onChange={(e) => setForm({...form, type: e.target.value})}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: '1px solid #D1D5DB', 
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              >
                <option value="">-- نوع الفرع --</option>
                <option value="SCHOOL">🏫 مدرسة</option>
                <option value="INSTITUTE">🎓 معهد</option>
                <option value="COMPANY">🏢 شركة</option>
              </select>
            </div>
          </div>

          {/* Map Section */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '16px' }}>
              🗺️ الموقع الجغرافي
            </h3>

            {/* Get Current Location Button */}
            <div style={{ marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => {
                  if ('geolocation' in navigator) {
                    navigator.geolocation.getCurrentPosition(
                      (position) => {
                        setForm({
                          ...form,
                          latitude: position.coords.latitude,
                          longitude: position.coords.longitude
                        });
                        alert('✅ تم تحديد موقعك الحالي');
                      },
                      (error) => {
                        alert('❌ فشل تحديد الموقع. تأكد من تفعيل GPS.');
                      },
                      { enableHighAccuracy: true, timeout: 10000 }
                    );
                  } else {
                    alert('❌ المتصفح لا يدعم تحديد الموقع');
                  }
                }}
                style={{
                  padding: '12px 24px',
                  background: '#10B981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                📍 استخدام موقعي الحالي
              </button>
            </div>

            {/* Map */}
            <div style={{ marginBottom: '16px', border: '2px solid #D1D5DB', borderRadius: '12px', overflow: 'hidden' }}>
              <BranchMap
                latitude={form.latitude || 26.4207}
                longitude={form.longitude || 50.0888}
                radius={form.geofenceRadius || 100}
                onLocationChange={(lat, lng) => {
                  setForm({...form, latitude: lat, longitude: lng});
                }}
              />
            </div>

            {/* Coordinate Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.875rem' }}>
                  خط العرض
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={form.latitude || ''}
                  onChange={(e) => setForm({...form, latitude: parseFloat(e.target.value) || null})}
                  style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px' }}
                  placeholder="26.4207"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.875rem' }}>
                  خط الطول
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={form.longitude || ''}
                  onChange={(e) => setForm({...form, longitude: parseFloat(e.target.value) || null})}
                  style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px' }}
                  placeholder="50.0888"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.875rem' }}>
                  نطاق التحقق (م)
                </label>
                <input
                  type="number"
                  value={form.geofenceRadius || 100}
                  onChange={(e) => setForm({...form, geofenceRadius: parseInt(e.target.value) || 100})}
                  style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px' }}
                  min="10"
                  max="1000"
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px', paddingTop: '16px', borderTop: '1px solid #E5E7EB' }}>
            <button
              onClick={handleSubmit}
              style={{
                padding: '14px 32px',
                background: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '1rem',
                cursor: 'pointer',
                flex: 1
              }}
            >
              💾 حفظ
            </button>
            <button
              onClick={() => router.back()}
              style={{
                padding: '14px 32px',
                background: '#6B7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '1rem',
                cursor: 'pointer',
                flex: 1
              }}
            >
              ✖️ إلغاء
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
