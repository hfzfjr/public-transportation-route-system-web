// TEMPORARY TEST PAGE — hapus setelah MapViewer terintegrasi ke halaman fitur asli (Rekomendasi Rute / Detail Rute)

'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { routes } from '@/lib/mock/routes';
import { transportModes } from '@/lib/mock/transportModes';
import { stops } from '@/lib/mock/stops';
import { MapViewerMarker, MapViewerPolyline } from '@/components/map/MapViewer';
import { MapPlaceholder } from '@/components/map/MapPlaceholder';

// Dynamic import with SSR disabled untuk menghindari error Leaflet di server
const MapViewerNoSSR = dynamic(
  () => import('@/components/map/MapViewer').then(mod => ({ default: mod.MapViewer })),
  {
    ssr: false,
    loading: () => <MapPlaceholder />
  }
) as any;

export default function MapTestPage() {
  // Transform data mock menjadi format MapViewer
  const { markers, polylines } = useMemo(() => {
    const route = routes[0]; // Ambil rute pertama untuk test

    // Cari koordinat untuk origin dan destination
    const originStop = stops.find(s => s.name === route.originStopName);
    const destinationStop = stops.find(s => s.name === route.destinationStopName);

    const newMarkers: MapViewerMarker[] = [];
    const newPolylines: MapViewerPolyline[] = [];

    if (originStop) {
      newMarkers.push({
        id: 'origin',
        position: [originStop.latitude, originStop.longitude],
        label: route.originStopName,
        type: 'origin'
      });
    }

    if (destinationStop) {
      newMarkers.push({
        id: 'destination',
        position: [destinationStop.latitude, destinationStop.longitude],
        label: route.destinationStopName,
        type: 'destination'
      });
    }

    // Process segments untuk transit points dan polylines
    route.segments.forEach((segment, index) => {
      const mode = transportModes.find(m => m.id === segment.modeId);
      const fromStop = stops.find(s => s.name === segment.fromStopName);
      const toStop = stops.find(s => s.name === segment.toStopName);

      if (fromStop && toStop && mode) {
        // Tambahkan transit point (kecuali origin dan destination yang sudah ditambah)
        if (index > 0 && index < route.segments.length) {
          newMarkers.push({
            id: `transit-${segment.id}`,
            position: [fromStop.latitude, fromStop.longitude],
            label: segment.fromStopName,
            type: 'transit',
            colorHex: mode.colorHex
          });
        }

        // Tambahkan polyline untuk segment ini
        newPolylines.push({
          id: `polyline-${segment.id}`,
          positions: [
            [fromStop.latitude, fromStop.longitude],
            [toStop.latitude, toStop.longitude]
          ],
          colorHex: mode.colorHex
        });
      }
    });

    return { markers: newMarkers, polylines: newPolylines };
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-neutral-900 mb-4">Map Test Page</h1>
        <p className="text-neutral-600 mb-6">Halaman sementara untuk testing komponen MapViewer dengan data mock.</p>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="aspect-video w-full">
            <MapViewerNoSSR
              markers={markers}
              polylines={polylines}
              className="w-full h-full"
            />
          </div>
        </div>

        <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Debug Info</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Markers:</strong> {markers.length}</p>
            <p><strong>Polylines:</strong> {polylines.length}</p>
            <div className="mt-4">
              <h3 className="font-medium text-neutral-700 mb-2">Markers:</h3>
              <ul className="list-disc list-inside text-neutral-600">
                {markers.map(m => (
                  <li key={m.id}>{m.label} ({m.type})</li>
                ))}
              </ul>
            </div>
            <div className="mt-4">
              <h3 className="font-medium text-neutral-700 mb-2">Polylines:</h3>
              <ul className="list-disc list-inside text-neutral-600">
                {polylines.map(p => (
                  <li key={p.id}>Segment {p.id} - Color: {p.colorHex}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
