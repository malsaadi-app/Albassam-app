'use client';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LeafletBranchMapProps {
  latitude: number;
  longitude: number;
  radius: number;
  onLocationChange: (lat: number, lng: number) => void;
}

// Component to handle map clicks
function MapClickHandler({ onLocationChange }: { onLocationChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LeafletBranchMap({ latitude, longitude, radius, onLocationChange }: LeafletBranchMapProps) {
  const [position, setPosition] = useState<[number, number]>([latitude || 26.4207, longitude || 50.0888]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (latitude && longitude) {
      setPosition([latitude, longitude]);
    }
  }, [latitude, longitude]);

  if (!mounted) {
    return (
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
    );
  }

  return (
    <div style={{ height: '450px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '2px solid #D1D5DB' }}>
      <MapContainer
        center={position}
        zoom={16}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <Marker
          position={position}
          draggable={true}
          eventHandlers={{
            dragend(e) {
              const marker = e.target;
              const newPos = marker.getLatLng();
              setPosition([newPos.lat, newPos.lng]);
              onLocationChange(newPos.lat, newPos.lng);
            },
          }}
        />
        
        <Circle
          center={position}
          radius={radius || 100}
          pathOptions={{
            fillColor: '#3B82F6',
            fillOpacity: 0.2,
            color: '#3B82F6',
            weight: 2,
          }}
        />
        
        <MapClickHandler onLocationChange={(lat, lng) => {
          setPosition([lat, lng]);
          onLocationChange(lat, lng);
        }} />
      </MapContainer>
    </div>
  );
}
