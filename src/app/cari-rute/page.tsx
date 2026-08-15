'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { CompactSearchBar } from '@/components/route-search/CompactSearchBar';
import { RouteList } from '@/components/route-search/RouteList';
import { RouteFilterMenu } from '@/components/route-search/RouteFilterMenu';
import { MapPlaceholder } from '@/components/map/MapPlaceholder';
import { routes } from '@/lib/mock/routes';
import { transportModes } from '@/lib/mock/transportModes';
import { stops } from '@/lib/mock/stops';
import { MapViewerMarker, MapViewerPolyline } from '@/components/map/MapViewer';

// Dynamic import with SSR disabled untuk menghindari error Leaflet di server
const MapViewerNoSSR = dynamic(
  () => import('@/components/map/MapViewer').then(mod => ({ default: mod.MapViewer })),
  {
    ssr: false,
    loading: () => <MapPlaceholder />
  }
);

// TODO: filter/generate routes berdasarkan origin-destination asli, saat ini selalu return semua mock routes
const MOCK_ROUTES = routes;

export default function CariRutePage() {
  const [selectedRouteId, setSelectedRouteId] = useState<string>(() => {
    // Default select route with tag or first route
    const taggedRoute = MOCK_ROUTES.find(r => r.tag === 'tercepat');
    return taggedRoute?.id || MOCK_ROUTES[0]?.id || '';
  });
  const [sortBy, setSortBy] = useState<'tercepat' | 'termurah' | 'minim_transit' | null>(null);

  // Memoize selectedRoute untuk referensi yang stabil
  const selectedRoute = useMemo(() => {
    return MOCK_ROUTES.find(r => r.id === selectedRouteId);
  }, [selectedRouteId]);

  // Transform selected route ke MapViewer markers
  const mapMarkers = useMemo<MapViewerMarker[]>(() => {
    if (!selectedRoute) {
      return [];
    }

    const markers: MapViewerMarker[] = [];

    // Cari koordinat untuk origin dan destination
    const originStop = stops.find(s => s.name === selectedRoute.originStopName);
    const destinationStop = stops.find(s => s.name === selectedRoute.destinationStopName);

    if (originStop) {
      markers.push({
        id: 'origin',
        position: [originStop.latitude, originStop.longitude],
        label: selectedRoute.originStopName,
        type: 'origin'
      });
    }

    if (destinationStop) {
      markers.push({
        id: 'destination',
        position: [destinationStop.latitude, destinationStop.longitude],
        label: selectedRoute.destinationStopName,
        type: 'destination'
      });
    }

    // Process segments untuk transit points
    selectedRoute.segments.forEach((segment, index) => {
      const mode = transportModes.find(m => m.id === segment.modeId);
      const fromStop = stops.find(s => s.name === segment.fromStopName);

      if (fromStop && mode) {
        // Tambahkan transit point (kecuali origin dan destination yang sudah ditambah)
        if (index > 0 && index < selectedRoute.segments.length) {
          markers.push({
            id: `transit-${segment.id}`,
            position: [fromStop.latitude, fromStop.longitude],
            label: segment.fromStopName,
            type: 'transit',
            colorHex: mode.colorHex
          });
        }
      }
    });

    return markers;
  }, [selectedRoute]);

  // Transform selected route ke MapViewer polylines
  const mapPolylines = useMemo<MapViewerPolyline[]>(() => {
    if (!selectedRoute) {
      return [];
    }

    const polylines: MapViewerPolyline[] = [];

    // Process segments untuk polylines
    selectedRoute.segments.forEach((segment) => {
      const mode = transportModes.find(m => m.id === segment.modeId);
      const fromStop = stops.find(s => s.name === segment.fromStopName);
      const toStop = stops.find(s => s.name === segment.toStopName);

      if (fromStop && toStop && mode) {
        polylines.push({
          id: `polyline-${segment.id}`,
          positions: [
            [fromStop.latitude, fromStop.longitude],
            [toStop.latitude, toStop.longitude]
          ],
          colorHex: mode.colorHex
        });
      }
    });

    return polylines;
  }, [selectedRoute]);

  const handleSelectRoute = (routeId: string) => {
    setSelectedRouteId(routeId);
  };

  const handleSortChange = (value: 'tercepat' | 'termurah' | 'minim_transit' | null) => {
    setSortBy(value);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search Bar */}
        <div className="mb-6">
          <CompactSearchBar />
        </div>

        {/* Main Content - 2 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Route List */}
          <div className="space-y-4">
            {/* Header with Filter */}
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-neutral-900">Rekomendasi Rute</h1>
              <RouteFilterMenu sortBy={sortBy} onSortChange={handleSortChange} />
            </div>

            {/* Route List */}
            <RouteList
              routes={MOCK_ROUTES}
              selectedRouteId={selectedRouteId}
              onSelectRoute={handleSelectRoute}
              sortBy={sortBy}
            />
          </div>

          {/* Right Column - Map */}
          <div className="lg:sticky lg:top-6 h-fit">
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="aspect-video w-full">
                <MapViewerNoSSR
                  markers={mapMarkers}
                  polylines={mapPolylines}
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
