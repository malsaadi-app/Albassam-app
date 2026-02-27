'use client';
import { useEffect, useRef, useState } from 'react';

interface GoogleBranchMapProps {
  latitude: number;
  longitude: number;
  radius: number;
  onLocationChange: (lat: number, lng: number) => void;
}

declare global {
  interface Window {
    google: any;
    __googleMapsLoading?: boolean;
    __googleMapsLoaded?: boolean;
  }
}

export default function GoogleBranchMap({ latitude, longitude, radius, onLocationChange }: GoogleBranchMapProps) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const googleMapRef = useRef<HTMLDivElement>(null);
  const initRef = useRef(false);

  useEffect(() => {
    // Skip on server-side
    if (typeof window === 'undefined') return;

    // Prevent double initialization in Strict Mode
    if (initRef.current) return;
    initRef.current = true;

    const apiKey = 'AIzaSyB2hxJANqTwYuOMjI_vDtxN871fz2O1FOI';

    const initMap = () => {
      try {
        if (!window.google?.maps || !googleMapRef.current || mapRef.current) {
          return;
        }

        const position = { 
          lat: latitude || 26.4207, 
          lng: longitude || 50.0888 
        };

        // Create map
        const map = new window.google.maps.Map(googleMapRef.current, {
          center: position,
          zoom: 16,
          mapTypeId: 'roadmap',
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
        });

        mapRef.current = map;

        // Create marker
        const marker = new window.google.maps.Marker({
          position: position,
          map: map,
          draggable: true,
          title: 'موقع الفرع',
        });

        markerRef.current = marker;

        // Create circle
        const circle = new window.google.maps.Circle({
          map: map,
          center: position,
          radius: radius || 100,
          fillColor: '#3B82F6',
          fillOpacity: 0.2,
          strokeColor: '#3B82F6',
          strokeOpacity: 0.8,
          strokeWeight: 2,
        });

        circleRef.current = circle;

        // Info window
        const infoWindow = new window.google.maps.InfoWindow({
          content: '<div style="text-align:center"><b>📍 موقع الفرع</b></div>',
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });

        marker.addListener('dragend', () => {
          const pos = marker.getPosition();
          if (pos) {
            circle.setCenter(pos);
            onLocationChange(pos.lat(), pos.lng());
          }
        });

        map.addListener('click', (e: any) => {
          if (e.latLng) {
            marker.setPosition(e.latLng);
            circle.setCenter(e.latLng);
            onLocationChange(e.latLng.lat(), e.latLng.lng());
            infoWindow.open(map, marker);
            setTimeout(() => infoWindow.close(), 1500);
          }
        });

        setLoading(false);

      } catch (err: any) {
        console.error('Map init error:', err);
        setError('خطأ في تهيئة الخريطة');
        setLoading(false);
      }
    };

    // Load Google Maps
    const loadGoogleMaps = () => {
      // Already loaded
      if (window.google?.maps && window.__googleMapsLoaded) {
        setTimeout(initMap, 100);
        return;
      }

      // Already loading
      if (window.__googleMapsLoading) {
        const checkInterval = setInterval(() => {
          if (window.google?.maps && window.__googleMapsLoaded) {
            clearInterval(checkInterval);
            setTimeout(initMap, 100);
          }
        }, 100);
        
        setTimeout(() => clearInterval(checkInterval), 15000);
        return;
      }

      // Start loading
      window.__googleMapsLoading = true;

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&language=ar&region=SA`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        window.__googleMapsLoaded = true;
        window.__googleMapsLoading = false;
        setTimeout(initMap, 200);
      };

      script.onerror = () => {
        window.__googleMapsLoading = false;
        setError('فشل تحميل Google Maps');
        setLoading(false);
      };

      document.head.appendChild(script);

      // Timeout
      setTimeout(() => {
        if (loading && !window.google?.maps) {
          window.__googleMapsLoading = false;
          setError('انتهت مهلة تحميل الخريطة');
          setLoading(false);
        }
      }, 15000);
    };

    loadGoogleMaps();

    // Cleanup - prevent removeChild errors
    return () => {
      try {
        // Remove Google Maps objects safely
        if (markerRef.current && typeof markerRef.current.setMap === 'function') {
          markerRef.current.setMap(null);
          markerRef.current = null;
        }
        if (circleRef.current && typeof circleRef.current.setMap === 'function') {
          circleRef.current.setMap(null);
          circleRef.current = null;
        }
        // Clear map reference
        if (mapRef.current) {
          mapRef.current = null;
        }
        // Clear the map container to prevent stale DOM references
        if (googleMapRef.current) {
          googleMapRef.current.innerHTML = '';
        }
      } catch (e) {
        console.error('Cleanup error (safe to ignore):', e);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update position when props change
  useEffect(() => {
    if (window.google?.maps && markerRef.current && circleRef.current && mapRef.current) {
      try {
        const newPos = new window.google.maps.LatLng(latitude, longitude);
        markerRef.current.setPosition(newPos);
        circleRef.current.setCenter(newPos);
        circleRef.current.setRadius(radius || 100);
        mapRef.current.setCenter(newPos);
      } catch (e) {
        console.error('Update error:', e);
      }
    }
  }, [latitude, longitude, radius]);

  if (error) {
    return (
      <div style={{
        height: '450px',
        width: '100%',
        borderRadius: '12px',
        background: '#FEE2E2',
        border: '2px solid #EF4444',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '12px',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '2rem' }}>⚠️</div>
        <div style={{ color: '#DC2626', fontSize: '0.875rem' }}>
          {error}
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            background: '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          🔄 إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div 
      ref={googleMapRef}
      style={{ 
        height: '450px', 
        width: '100%', 
        borderRadius: '12px',
        background: loading ? '#E5E7EB' : '#fff',
        position: 'relative',
        border: '2px solid #D1D5DB'
      }}
    >
      {loading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          zIndex: 1000
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🗺️</div>
          <div style={{ color: '#6B7280', fontSize: '0.875rem' }}>
            جاري تحميل Google Maps...
          </div>
        </div>
      )}
    </div>
  );
}
