'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { LatLngExpression } from 'leaflet';

// Dynamically import leaflet to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

interface Location {
  name: string;
  rating: number;
  position: LatLngExpression;
  postcode: string;
}

interface RestaurantMapProps {
  locations: Location[];
}

export default function RestaurantMap({ locations }: RestaurantMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  // Center on UK (Reading area)
  const center: LatLngExpression = [51.4543, -0.9781];

  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden border border-gray-200">
      <MapContainer
        center={center}
        zoom={10}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {locations.map((location, idx) => (
          <Marker key={idx} position={location.position}>
            <Popup>
              <div className="text-sm">
                <h3 className="font-bold">{location.name}</h3>
                <p className="text-gray-600">{location.postcode}</p>
                <p className="text-orange-600 font-semibold">
                  {location.rating}/10
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
