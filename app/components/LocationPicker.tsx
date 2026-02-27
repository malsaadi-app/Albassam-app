'use client';

import { useEffect, useRef, useState } from 'react';
import { COLORS } from '@/lib/colors';

interface LocationPickerProps {
  latitude?: number | null;
  longitude?: number | null;
  radius?: number;
  onLocationChange: (lat: number, lng: number) => void;
  height?: string;
}

export default function LocationPicker({
  latitude,
  longitude,
  radius = 100,
  onLocationChange,
  height = '400px'
}: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [circle, setCircle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // تحميل Leaflet من CDN
  useEffect(() => {
    // إضافة CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // إضافة JS
    if (!(window as any).L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => setLoading(false);
      document.body.appendChild(script);
    } else {
      setLoading(false);
    }
  }, []);

  // تهيئة الخريطة
  useEffect(() => {
    if (loading || !mapRef.current || map) return;

    const L = (window as any).L;
    if (!L) return;

    // إنشاء الخريطة
    const defaultLat = latitude || 24.7136; // الرياض
    const defaultLng = longitude || 46.6753;

    const newMap = L.map(mapRef.current).setView([defaultLat, defaultLng], 15);

    // إضافة طبقة OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(newMap);

    // إضافة Marker
    const newMarker = L.marker([defaultLat, defaultLng], {
      draggable: true
    }).addTo(newMap);

    // إضافة دائرة النطاق
    const newCircle = L.circle([defaultLat, defaultLng], {
      color: COLORS.primary,
      fillColor: COLORS.primaryLighter,
      fillOpacity: 0.3,
      radius: radius
    }).addTo(newMap);

    // عند سحب الـMarker
    newMarker.on('dragend', function(e: any) {
      const position = e.target.getLatLng();
      newCircle.setLatLng(position);
      onLocationChange(position.lat, position.lng);
    });

    // عند النقر على الخريطة
    newMap.on('click', function(e: any) {
      const { lat, lng } = e.latlng;
      newMarker.setLatLng([lat, lng]);
      newCircle.setLatLng([lat, lng]);
      onLocationChange(lat, lng);
    });

    setMap(newMap);
    setMarker(newMarker);
    setCircle(newCircle);

    // Cleanup
    return () => {
      newMap.remove();
    };
  }, [loading]);

  // تحديث الموقع والدائرة عند تغيير الـprops
  useEffect(() => {
    if (!map || !marker || !circle) return;
    
    if (latitude && longitude) {
      const L = (window as any).L;
      const newLatLng = L.latLng(latitude, longitude);
      marker.setLatLng(newLatLng);
      circle.setLatLng(newLatLng);
      map.setView(newLatLng, map.getZoom());
    }

    circle.setRadius(radius);
  }, [latitude, longitude, radius, map, marker, circle]);

  if (loading) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: COLORS.gray50,
          border: `1px solid ${COLORS.gray200}`,
          borderRadius: '12px',
          color: COLORS.gray500,
          fontSize: '14px'
        }}
      >
        ⏳ جاري تحميل الخريطة...
      </div>
    );
  }

  return (
    <div>
      <div
        ref={mapRef}
        style={{
          height,
          borderRadius: '12px',
          overflow: 'hidden',
          border: `2px solid ${COLORS.gray200}`
        }}
      />
      <div
        style={{
          marginTop: '8px',
          fontSize: '12px',
          color: COLORS.gray500,
          textAlign: 'center'
        }}
      >
        💡 اضغط على الخريطة أو اسحب العلامة لتحديد الموقع
      </div>
    </div>
  );
}
