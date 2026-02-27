'use client';

import { useState } from 'react';
import LocationPicker from '@/app/components/LocationPicker';
import { COLORS } from '@/lib/colors';

interface BranchLocationMapProps {
  initialLatitude?: number | null;
  initialLongitude?: number | null;
  initialRadius?: number;
}

export default function BranchLocationMap({
  initialLatitude,
  initialLongitude,
  initialRadius = 100
}: BranchLocationMapProps) {
  const [latitude, setLatitude] = useState<number | null>(initialLatitude || null);
  const [longitude, setLongitude] = useState<number | null>(initialLongitude || null);
  const [radius, setRadius] = useState<number>(initialRadius);

  const handleLocationChange = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
  };

  return (
    <div>
      {/* الخريطة التفاعلية */}
      <div style={{ marginBottom: '16px' }}>
        <LocationPicker
          latitude={latitude}
          longitude={longitude}
          radius={radius}
          onLocationChange={handleLocationChange}
          height="400px"
        />
      </div>

      {/* الحقول المخفية للإرسال مع الفورم */}
      <input type="hidden" name="latitude" value={latitude || ''} />
      <input type="hidden" name="longitude" value={longitude || ''} />
      <input type="hidden" name="geofenceRadius" value={radius} />

      {/* معلومات الموقع الحالي */}
      <div
        style={{
          background: COLORS.gray50,
          border: `1px solid ${COLORS.gray200}`,
          borderRadius: '10px',
          padding: '12px',
          marginBottom: '16px'
        }}
      >
        <div style={{ fontSize: '13px', fontWeight: 700, color: COLORS.gray900, marginBottom: '8px' }}>
          📍 الموقع المحدد:
        </div>
        <div style={{ fontSize: '13px', color: COLORS.gray600 }}>
          {latitude && longitude ? (
            <>
              <div>خط العرض: <strong>{latitude.toFixed(6)}</strong></div>
              <div>خط الطول: <strong>{longitude.toFixed(6)}</strong></div>
              <div>نطاق السياج: <strong>{radius} متر</strong></div>
            </>
          ) : (
            <div>لم يتم تحديد موقع بعد</div>
          )}
        </div>
      </div>

      {/* التحكم في نطاق السياج */}
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: COLORS.gray600, marginBottom: '6px' }}>
          🔵 نطاق السياج الجغرافي (متر)
        </label>
        <input
          type="range"
          min={50}
          max={500}
          step={10}
          value={radius}
          onChange={(e) => setRadius(parseInt(e.target.value))}
          style={{
            width: '100%',
            height: '6px',
            borderRadius: '5px',
            outline: 'none',
            cursor: 'pointer'
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: COLORS.gray500, marginTop: '4px' }}>
          <span>50م</span>
          <span style={{ fontWeight: 700, color: COLORS.primary }}>{radius}م</span>
          <span>500م</span>
        </div>
      </div>
    </div>
  );
}
