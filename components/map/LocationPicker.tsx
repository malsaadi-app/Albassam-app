'use client';

import { useState, useEffect } from 'react';

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  radius: number;
  onLocationChange: (lat: number, lng: number) => void;
  onRadiusChange: (radius: number) => void;
}

export function LocationPicker({
  latitude,
  longitude,
  radius,
  onLocationChange,
  onRadiusChange
}: LocationPickerProps) {
  const [gettingLocation, setGettingLocation] = useState(false);
  const [mapUrl, setMapUrl] = useState('');

  useEffect(() => {
    // Listen for messages from iframe (if interactive map is used)
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.lat && event.data.lng) {
        onLocationChange(event.data.lat, event.data.lng);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onLocationChange]);

  useEffect(() => {
    if (latitude && longitude) {
      // OpenStreetMap embed with marker
      setMapUrl(
        `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01},${latitude - 0.01},${longitude + 0.01},${latitude + 0.01}&marker=${latitude},${longitude}&layer=mapnik`
      );
    }
  }, [latitude, longitude]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('❌ المتصفح لا يدعم تحديد الموقع');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLocationChange(position.coords.latitude, position.coords.longitude);
        setGettingLocation(false);
        alert('✅ تم تحديد موقعك الحالي بنجاح!');
      },
      (error) => {
        setGettingLocation(false);
        alert('❌ لم نتمكن من تحديد موقعك. تأكد من السماح للمتصفح بالوصول للموقع.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const openInGoogleMaps = () => {
    if (latitude && longitude) {
      window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank');
    } else {
      alert('⚠️ حدد الموقع أولاً');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* GPS Button */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={gettingLocation}
          style={{
            flex: 1,
            padding: '12px 20px',
            background: gettingLocation ? '#9CA3AF' : '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: gettingLocation ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            if (!gettingLocation) {
              e.currentTarget.style.background = '#2563EB';
            }
          }}
          onMouseOut={(e) => {
            if (!gettingLocation) {
              e.currentTarget.style.background = '#3B82F6';
            }
          }}
        >
          {gettingLocation ? '⏳ جاري تحديد الموقع...' : '📍 استخدام موقعي الحالي (GPS)'}
        </button>
      </div>

      {/* Manual Input */}
      <div style={{
        padding: '16px',
        background: '#F9FAFB',
        border: '1px solid #E5E7EB',
        borderRadius: '8px'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '12px' 
        }}>
          <strong style={{ fontSize: '14px', color: '#374151' }}>
            🌍 إحداثيات الموقع (Latitude & Longitude)
          </strong>
          {latitude && longitude && (
            <button
              type="button"
              onClick={openInGoogleMaps}
              style={{
                padding: '6px 12px',
                background: '#10B981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              🗺️ فتح في Google Maps
            </button>
          )}
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '6px', 
              fontSize: '13px', 
              fontWeight: '500',
              color: '#6B7280'
            }}>
              خط العرض (Latitude)
            </label>
            <input
              type="number"
              step="0.000001"
              value={latitude || ''}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && longitude) {
                  onLocationChange(val, longitude);
                }
              }}
              placeholder="24.713600"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'inherit'
              }}
            />
          </div>
          
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '6px', 
              fontSize: '13px', 
              fontWeight: '500',
              color: '#6B7280'
            }}>
              خط الطول (Longitude)
            </label>
            <input
              type="number"
              step="0.000001"
              value={longitude || ''}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && latitude) {
                  onLocationChange(latitude, val);
                }
              }}
              placeholder="46.675300"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'inherit'
              }}
            />
          </div>
        </div>
      </div>

      {/* Interactive Map Preview */}
      {latitude && longitude && mapUrl && (
        <div style={{ position: 'relative' }}>
          <div style={{
            width: '100%',
            height: '400px',
            borderRadius: '8px',
            border: '2px solid #3B82F6',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <iframe
              src={mapUrl}
              style={{
                width: '100%',
                height: '100%',
                border: 'none'
              }}
              title="موقع الفرع"
              loading="lazy"
            />
          </div>
          <div style={{
            marginTop: '8px',
            padding: '12px 16px',
            background: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: '8px',
            fontSize: '13px',
            color: '#1E40AF',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>💡</span>
            <span>
              <strong>لتغيير الموقع:</strong> استخدم زر GPS أو أدخل الإحداثيات يدوياً. يمكنك نسخ الإحداثيات من Google Maps.
            </span>
          </div>
        </div>
      )}

      {/* Radius Slider */}
      <div>
        <label style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginBottom: '8px',
          fontSize: '14px',
          fontWeight: '500',
          color: '#374151'
        }}>
          <span>📏 نطاق الموقع (Geofence)</span>
          <span style={{ color: '#3B82F6', fontWeight: '700' }}>{radius} متر</span>
        </label>
        
        <input
          type="range"
          min="5"
          max="500"
          step="5"
          value={radius}
          onChange={(e) => onRadiusChange(Number(e.target.value))}
          style={{
            width: '100%',
            height: '8px',
            borderRadius: '4px',
            background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${(radius / 500) * 100}%, #E5E7EB ${(radius / 500) * 100}%, #E5E7EB 100%)`,
            outline: 'none',
            cursor: 'pointer',
            WebkitAppearance: 'none',
            appearance: 'none'
          }}
        />
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginTop: '4px',
          fontSize: '12px',
          color: '#6B7280'
        }}>
          <span>5 متر</span>
          <span>500 متر</span>
        </div>
      </div>

      {/* Info Box */}
      <div style={{
        padding: '12px 16px',
        background: '#FEF3C7',
        border: '1px solid #FCD34D',
        borderRadius: '8px',
        fontSize: '13px',
        color: '#92400E'
      }}>
        <strong>📝 كيف تحدد الموقع:</strong>
        <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
          <li><strong>الخيار 1:</strong> اضغط "📍 استخدام موقعي الحالي" - أسرع طريقة</li>
          <li><strong>الخيار 2:</strong> افتح Google Maps → اضغط طويلاً على المكان → انسخ الإحداثيات → الصقها هنا</li>
          <li><strong>الخيار 3:</strong> أدخل الإحداثيات يدوياً إذا كنت تعرفها</li>
        </ul>
      </div>
    </div>
  );
}
