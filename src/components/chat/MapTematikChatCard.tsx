'use client';

import React, { useState } from 'react';
import { Map, Layers, Check, ExternalLink, MapPin, Eye, Compass } from 'lucide-react';
import { MapAction } from '@/types/dkpp';

interface MapTematikChatCardProps {
  onTriggerMapAction?: (action: MapAction) => void;
  onOpenFullMap?: () => void;
  defaultActiveLayer?: string;
}

export const MapTematikChatCard: React.FC<MapTematikChatCardProps> = ({
  onTriggerMapAction,
  onOpenFullMap,
  defaultActiveLayer = 'fsva'
}) => {
  const [activeLayer, setActiveLayer] = useState<string>(defaultActiveLayer);
  const [activeBasemap, setActiveBasemap] = useState<'osm' | 'positron' | 'satellite'>('positron');

  const layers = [
    {
      id: 'fsva',
      name: 'FSVA 2025 (Komposit Kerentanan Pangan)',
      description: 'Peta 6 indikator kerentanan pangan tingkat kelurahan se-Kota Cilegon',
      color: '#ef4444',
      badge: 'Prioritas 1-6',
      thematicMode: 'fsva'
    },
    {
      id: 'skpg',
      name: 'SKPG 2026 (Kewaspadaan Pangan & Gizi)',
      description: 'Pemantauan bulanan ketersediaan, akses, dan pemanfaatan pangan',
      color: '#f59e0b',
      badge: 'Bulanan',
      thematicMode: 'skpg'
    },
    {
      id: 'borda',
      name: 'Metode Borda 2026 (Prioritas Kelurahan)',
      description: 'Pemeringkatan multi-kriteria untuk alokasi bantuan & operasi pasar',
      color: '#8b5cf6',
      badge: 'Analisis Multi-Kriteria',
      thematicMode: 'borda'
    },
    {
      id: 'intervensi',
      name: 'Titik Intervensi & Lumbung Pangan',
      description: 'Sebaran Pasar Murah, KWT, Lumbung Pangan, dan Toko Tani Indonesia',
      color: '#10b981',
      badge: 'Titik GIS',
      thematicMode: 'intervensi'
    }
  ];

  const handleSelectLayer = (layerId: string, thematicMode: string) => {
    setActiveLayer(layerId);
    if (onTriggerMapAction) {
      onTriggerMapAction({
        type: 'CHOROPLETH',
        thematicMode: thematicMode,
        layersToEnable: [layerId]
      });
    }
  };

  return (
    <div className="my-3 rounded-xl border border-emerald-200/90 bg-gradient-to-b from-emerald-50/50 via-white to-white shadow-md shadow-emerald-500/5 overflow-hidden">
      {/* Header */}
      <div className="p-3.5 sm:p-4 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border-b border-emerald-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-400/30 shadow-xs">
            <Compass className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">
              Peta Tematik Spasial GIS Kota Cilegon
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Visualisasi geospasial FSVA, SKPG, dan Pemeringkatan Borda
            </p>
          </div>
        </div>

        {onOpenFullMap && (
          <button
            onClick={onOpenFullMap}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Map className="w-3.5 h-3.5" />
            <span>Buka Panel GIS</span>
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </button>
        )}
      </div>

      {/* Layer List */}
      <div className="p-3 sm:p-4 space-y-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
          <Layers className="w-3 h-3 text-emerald-600" />
          Pilih Layer Peta Tematik
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {layers.map((l) => {
            const isSelected = activeLayer === l.id;
            return (
              <button
                key={l.id}
                onClick={() => handleSelectLayer(l.id, l.thematicMode)}
                className={`p-3 rounded-lg border text-left transition-all duration-150 cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/80 shadow-xs ring-1 ring-emerald-500/30'
                    : 'border-slate-200 hover:border-emerald-300 bg-white hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: l.color }}
                    />
                    <span className="text-xs font-bold text-slate-800">
                      {l.name}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {l.description}
                </p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    {l.badge}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend & Summary Info */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-700">Legenda FSVA:</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Sangat Rentan (Prioritas 1-2)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Rentan Sedang (Prioritas 3-4)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Tahan Pangan (Prioritas 5-6)
          </span>
        </div>
      </div>
    </div>
  );
};
