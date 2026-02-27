'use client';
import { useEffect, useRef, useState } from 'react';

interface GoogleMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  onLocationSelect?: (location: { lat: number; lng: number }) => void;
  markers?: Array<{
    position: { lat: number; lng: number };
    title?: string;
    radius?: number;
  }>;
  editable?: boolean;
}

export default function GoogleMap({
  center = { lat: 26.4207, lng: 50.0888 }, // الدمام
  zoom = 13,
  onLocationSelect,
  markers = [],
  editable = false
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [currentMarker, setCurrentMarker] = useState<any>(null);
  const [currentCircle, setCurrentCircle] = useState<any>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const loadMap = () => {
      const mapInstance = new (window as any).google.maps.Map(mapRef.current!, {
        center,
        zoom,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      setMap(mapInstance);

      // إذا كان editable، أضف إمكانية النقر لاختيار الموقع
      if (editable) {
        mapInstance.addListener('click', (e: any) => {
          const lat = e.latLng?.lat();
          const lng = e.latLng?.lng();
          
          if (lat && lng) {
            // حذف الماركر القديم
            if (currentMarker) {
              currentMarker.setMap(null);
            }
            if (currentCircle) {
              currentCircle.setMap(null);
            }

            // إضافة ماركر جديد
            const marker = (window as any).google.maps.Marker({
              position: { lat, lng },
              map: mapInstance,
              draggable: true,
              title: 'موقع الفرع'
            });

            // إضافة دائرة (100 متر)
            const circle = (window as any).google.maps.Circle({
              map: mapInstance,
              center: { lat, lng },
              radius: 100, // 100 متر
              fillColor: '#3B82F6',
              fillOpacity: 0.2,
              strokeColor: '#3B82F6',
              strokeOpacity: 0.8,
              strokeWeight: 2,
              editable: true,
              draggable: false
            });

            setCurrentMarker(marker);
            setCurrentCircle(circle);

            // إرسال الموقع للخارج
            if (onLocationSelect) {
              onLocationSelect({ lat, lng });
            }

            // عند سحب الماركر
            marker.addListener('dragend', () => {
              const newLat = marker.getPosition()?.lat();
              const newLng = marker.getPosition()?.lng();
              if (newLat && newLng) {
                circle.setCenter({ lat: newLat, lng: newLng });
                if (onLocationSelect) {
                  onLocationSelect({ lat: newLat, lng: newLng });
                }
              }
            });
          }
        });
      }
    };

    // تحميل Google Maps API
    if ((window as any).google === 'undefined') {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = loadMap;
      document.head.appendChild(script);
    } else {
      loadMap();
    }
  }, [center.lat, center.lng, zoom, editable]);

  // رسم الماركرات الموجودة
  useEffect(() => {
    if (!map) return;

    markers.forEach(({ position, title, radius }) => {
      (window as any).google.maps.Marker({
        position,
        map,
        title: title || 'موقع'
      });

      if (radius) {
        (window as any).google.maps.Circle({
          map,
          center: position,
          radius,
          fillColor: '#10B981',
          fillOpacity: 0.15,
          strokeColor: '#10B981',
          strokeOpacity: 0.6,
          strokeWeight: 2
        });
      }
    });
  }, [map, markers]);

  return (
    <div 
      ref={mapRef} 
      style={{ 
        width: '100%', 
        height: '100%',
        minHeight: '400px',
        borderRadius: '12px'
      }} 
    />
  );
}
