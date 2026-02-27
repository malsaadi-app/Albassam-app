'use client';
import { useEffect, useRef } from 'react';

interface BranchMapProps {
  latitude: number;
  longitude: number;
  radius: number;
  onLocationChange: (lat: number, lng: number) => void;
}

export default function BranchMap({ latitude, longitude, radius, onLocationChange }: BranchMapProps) {
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let map: any = null;
    let marker: any = null;
    let circle: any = null;

    const initMap = async () => {
      try {
        // Dynamically import Leaflet
        const L = (await import('leaflet')).default;

        const mapDiv = document.getElementById('branch-map');
        if (!mapDiv || mapRef.current) return;

        const position: [number, number] = [latitude || 26.4207, longitude || 50.0888];

        map = L.map('branch-map').setView(position, 16);
        mapRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap',
          maxZoom: 19,
        }).addTo(map);

        // Custom blue marker icon (embedded SVG)
        const customIcon = L.icon({
          iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNSIgaGVpZ2h0PSI0MSIgdmlld0JveD0iMCAwIDI1IDQxIj48cGF0aCBmaWxsPSIjM0I4MkY2IiBkPSJNMTIuNSAwQzUuNiAwIDAgNS42IDAgMTIuNWMwIDguNCAxMi41IDI4LjUgMTIuNSAyOC41UzI1IDIwLjkgMjUgMTIuNUMyNSA1LjYgMTkuNCAwIDEyLjUgMHptMCAxN2MtMi41IDAtNC41LTItNC41LTQuNXMyLTQuNSA0LjUtNC41IDQuNSAyIDQuNSA0LjUtMiA0LjUtNC41IDQuNXoiLz48L3N2Zz4=',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
        });

        marker = L.marker(position, {
          draggable: true,
          icon: customIcon,
        }).addTo(map);
        markerRef.current = marker;

        marker.bindPopup('<b>📍 موقع الفرع</b><br>اسحب العلامة لتغيير الموقع<br>أو انقر على الخريطة');

        circle = L.circle(position, {
          radius: radius || 100,
          color: '#3B82F6',
          fillColor: '#3B82F6',
          fillOpacity: 0.2,
          weight: 2,
        }).addTo(map);
        circleRef.current = circle;

        // Drag marker event
        marker.on('dragend', function() {
          const pos = marker.getLatLng();
          circle.setLatLng(pos);
          onLocationChange(pos.lat, pos.lng);
        });

        // Click on map event
        map.on('click', function(e: any) {
          marker.setLatLng(e.latlng);
          circle.setLatLng(e.latlng);
          onLocationChange(e.latlng.lat, e.latlng.lng);
          
          // Show popup briefly
          marker.openPopup();
          setTimeout(() => marker.closePopup(), 2000);
        });

        setTimeout(() => map.invalidateSize(), 100);

      } catch (error) {
        console.error('Error loading map:', error);
      }
    };

    initMap();

    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {
          console.error('Cleanup error:', e);
        }
        mapRef.current = null;
      }
    };
  }, [latitude, longitude, radius, onLocationChange]);

  // Update marker position when props change
  useEffect(() => {
    if (markerRef.current && circleRef.current && mapRef.current) {
      const L = (window as any).L;
      if (L && latitude && longitude) {
        const newPos = L.latLng(latitude, longitude);
        markerRef.current.setLatLng(newPos);
        circleRef.current.setLatLng(newPos);
        circleRef.current.setRadius(radius || 100);
        mapRef.current.setView(newPos, mapRef.current.getZoom());
      }
    }
  }, [latitude, longitude, radius]);

  return (
    <div 
      id="branch-map" 
      style={{ 
        height: '450px', 
        width: '100%', 
        borderRadius: '12px',
        background: '#E5E7EB',
        cursor: 'crosshair'
      }}
    />
  );
}
