'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { 
  Layers, 
  Maximize2, 
  Minimize2, 
  Crosshair, 
  Radio, 
  MapPin, 
  Sparkles,
  ChevronDown,
  Check
} from 'lucide-react';
import { MapAction } from '@/types/dkpp';

// Dynamically import react-leaflet components (client-only)
const MapContainer = dynamic(
  () => import('react-leaflet').then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((m) => m.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((m) => m.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((m) => m.Popup),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import('react-leaflet').then((m) => m.CircleMarker),
  { ssr: false }
);
const GeoJSON = dynamic(
  () => import('react-leaflet').then((m) => m.GeoJSON),
  { ssr: false }
);

interface SplitMapPaneProps {
  lastAction?: MapAction | null;
  onSelectKelurahan?: (name: string) => void;
  className?: string;
}

// Key markets & agro points in Cilegon
const CILEGON_MARKETS = [
  { name: 'Pasar Induk Kranggot', coords: [-6.0215, 106.0534] as [number, number], type: 'Pasar Induk', status: 'Sentra Distribusi Beras & Cabai' },
  { name: 'Pasar Tradisional Blok F', coords: [-6.0125, 106.0465] as [number, number], type: 'Pasar Tradisional', status: 'Panel Harga Harian' },
  { name: 'Pasar Merak', coords: [-5.9328, 105.9984] as [number, number], type: 'Pasar Pesisir', status: 'Pasokan Ikan & Sayur' },
  { name: 'Pelabuhan Perikanan Nusantara Karangantu/Ciwandan', coords: [-6.0381, 105.9523] as [number, number], type: 'Sentra Perikanan', status: 'Produksi Ikan Tangkap' },
];

const CILEGON_KELURAHAN_CENTROIDS = [
  { name: 'PULOMERAK', kec: 'Pulomerak', coords: [-5.9412, 106.0123] as [number, number], fsva: 4, lengas: '38% (Lembab)' },
  { name: 'GEROGOL', kec: 'Gerogol', coords: [-5.9812, 106.0245] as [number, number], fsva: 5, lengas: '41% (Optimal)' },
  { name: 'PURWAKARTA', kec: 'Purwakarta', coords: [-5.9934, 106.0512] as [number, number], fsva: 5, lengas: '39% (Optimal)' },
  { name: 'CIWANDAN', kec: 'Ciwandan', coords: [-6.0312, 105.9723] as [number, number], fsva: 3, lengas: '32% (Kering Rendah)' },
  { name: 'CITANGKIL', kec: 'Citangkil', coords: [-6.0245, 106.0189] as [number, number], fsva: 4, lengas: '36% (Normal)' },
  { name: 'CIBEBER', kec: 'Cibeber', coords: [-6.0412, 106.0712] as [number, number], fsva: 5, lengas: '44% (Sangat Lembab)' },
  { name: 'JOMBANG', kec: 'Jombang', coords: [-6.0112, 106.0456] as [number, number], fsva: 6, lengas: '39% (Optimal)' },
  { name: 'CILEGON', kec: 'Cilegon', coords: [-6.0189, 106.0321] as [number, number], fsva: 6, lengas: '37% (Normal)' },
];

export const SplitMapPane: React.FC<SplitMapPaneProps> = ({
  lastAction,
  onSelectKelurahan,
  className = '',
}) => {
  const [mounted, setMounted] = useState(false);
  const [layerDropdownOpen, setLayerDropdownOpen] = useState(false);
  const [activeLayers, setActiveLayers] = useState({
    agro: true,
    fsva: true,
    markets: true,
    boundaries: true,
  });
  const [mapCenter, setMapCenter] = useState<[number, number]>([-6.015, 106.035]);
  const [mapZoom, setMapZoom] = useState<number>(12);
  const [highlightedFeature, setHighlightedFeature] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle AI dispatched map actions
  useEffect(() => {
    if (!lastAction) return;

    if (lastAction.type === 'MAP_SET_LAYER' && lastAction.layerName) {
      if (lastAction.layerName.includes('FSVA')) {
        setActiveLayers((prev) => ({ ...prev, fsva: true }));
      }
      if (lastAction.layerName.includes('AGRO')) {
        setActiveLayers((prev) => ({ ...prev, agro: true }));
      }
    }

    if (lastAction.type === 'MAP_HIGHLIGHT' && lastAction.featureName) {
      setHighlightedFeature(lastAction.featureName);
      const match = CILEGON_KELURAHAN_CENTROIDS.find((k) =>
        k.name.toLowerCase().includes(lastAction.featureName!.toLowerCase())
      );
      if (match) {
        setMapCenter(match.coords);
        setMapZoom(13);
      }
    }

    if (lastAction.type === 'MAP_ZOOM' && lastAction.coordinates) {
      setMapCenter(lastAction.coordinates);
      if (lastAction.zoom) setMapZoom(lastAction.zoom);
    }
  }, [lastAction]);

  if (!mounted) {
    return (
      <div className="w-full h-full min-h-[350px] bg-slate-900 rounded-2xl flex items-center justify-center text-slate-400 text-xs">
        Memuat Peta Spasial DKPP Cilegon...
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full min-h-[350px] overflow-hidden rounded-2xl bg-slate-950 border border-slate-800 shadow-inner flex flex-col ${className}`}>
      {/* Top Floating Controls */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2">
        {/* Layer Selector Pill */}
        <div className="relative">
          <button
            onClick={() => setLayerDropdownOpen(!layerDropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 backdrop-blur-md text-xs font-semibold shadow-lg transition-all"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>LAYER</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {layerDropdownOpen && (
            <div className="absolute right-0 top-9 w-52 bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-700 shadow-xl p-2 z-50 text-xs space-y-1">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Layer Spasial DKPP
              </div>
              <button
                onClick={() => setActiveLayers((p) => ({ ...p, agro: !p.agro }))}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300"
              >
                <span>Agroklimat & Lengas</span>
                {activeLayers.agro && <Check className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
              <button
                onClick={() => setActiveLayers((p) => ({ ...p, fsva: !p.fsva }))}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300"
              >
                <span>Peta FSVA 2025</span>
                {activeLayers.fsva && <Check className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
              <button
                onClick={() => setActiveLayers((p) => ({ ...p, markets: !p.markets }))}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300"
              >
                <span>Pasar & Sentra Pangan</span>
                {activeLayers.markets && <Check className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Map Content */}
      <div className="flex-1 w-full h-full relative">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%', background: '#090d16' }}
          className="z-0"
        >
          {/* Satellite Dark Basemap */}
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri</a> & DKPP Cilegon'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />

          {/* Kecamatan & Kelurahan Centroids & Thematic Overlay */}
          {CILEGON_KELURAHAN_CENTROIDS.map((k, idx) => {
            const isSelected = highlightedFeature && k.name.toLowerCase().includes(highlightedFeature.toLowerCase());
            
            return (
              <CircleMarker
                key={idx}
                center={k.coords}
                radius={isSelected ? 18 : 12}
                pathOptions={{
                  color: isSelected ? '#fbbf24' : k.fsva <= 3 ? '#ef4444' : '#10b981',
                  fillColor: isSelected ? '#f59e0b' : k.fsva <= 3 ? '#f87171' : '#34d399',
                  fillOpacity: isSelected ? 0.9 : 0.65,
                  weight: isSelected ? 3 : 1.5,
                }}
              >
                <Popup>
                  <div className="p-1 text-slate-900 font-sans text-xs">
                    <div className="font-bold text-sm text-emerald-800">{k.name}</div>
                    <div className="text-gray-600">Kecamatan: {k.kec}</div>
                    <div className="mt-1 border-t pt-1 flex flex-col gap-0.5">
                      <span className="font-semibold text-gray-700">
                        FSVA Status: Prioritas {k.fsva} ({k.fsva <= 3 ? 'Waspada' : 'Aman'})
                      </span>
                      <span className="text-gray-600">Lengas Tanah: {k.lengas}</span>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {/* Markets & Points */}
          {activeLayers.markets &&
            CILEGON_MARKETS.map((m, idx) => (
              <CircleMarker
                key={`m-${idx}`}
                center={m.coords}
                radius={7}
                pathOptions={{
                  color: '#38bdf8',
                  fillColor: '#0284c7',
                  fillOpacity: 0.9,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="p-1 text-slate-900 font-sans text-xs">
                    <div className="font-bold text-sky-800">{m.name}</div>
                    <div className="text-gray-600">{m.type}</div>
                    <div className="text-emerald-700 mt-1">{m.status}</div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
        </MapContainer>
      </div>

      {/* Bottom Floating Telemetry Banner (Matching Mockup) */}
      <div className="absolute bottom-3 left-3 right-3 z-[1000] pointer-events-none">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-emerald-500/30 text-emerald-400 text-[11px] shadow-lg pointer-events-auto">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
            <span className="font-semibold text-slate-200">
              TELEMETRI AGROKLIMAT & LENGAS TANAH
            </span>
            <span className="text-emerald-400 text-[10px]">
              Model: ECMWF ERA5-Land (Realtime) • Kedalaman Akar: 0-28 cm • Cilegon
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
