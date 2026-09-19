'use client';

import React from 'react';
import { Employee } from '@/lib/polling/types';
import { FiCheck, FiX } from 'react-icons/fi';

interface SelectedEmployeeListProps {
  selected: Employee[];
  onRemove: (employeeId: string) => void;
  maxChoices?: number;
}

export const SelectedEmployeeList: React.FC<SelectedEmployeeListProps> = ({
  selected,
  onRemove,
  maxChoices = 3
}) => {
  if (selected.length === 0) return null;

  return (
    <div className="space-y-2 mt-2">
      {/* Selected Items List (Screen 3) */}
      <div className="space-y-2">
        {selected.map((emp) => (
          <div
            key={emp.id}
            className="flex items-center justify-between bg-white border border-gray-100 rounded-xl py-1.5 px-1 text-sm text-gray-800 transition-all hover:bg-slate-50/50"
          >
            <div className="flex items-center gap-3 min-w-0 pr-2">
              {/* Green Solid Circle Checkmark */}
              <div className="w-5 h-5 rounded-full bg-[#007A55] text-white flex items-center justify-center text-[10px] shrink-0">
                <FiCheck className="w-3.5 h-3.5 stroke-[3]" />
              </div>

              {/* Circular Avatar */}
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                {emp.photo_url ? (
                  <img src={emp.photo_url} alt={emp.full_name} className="w-full h-full object-cover" />
                ) : (
                  emp.full_name.substring(0, 2).toUpperCase()
                )}
              </div>

              {/* Name & Position */}
              <div className="min-w-0 pr-1 flex-1">
                <p className="font-bold text-[#1e293b] text-[11px] xs:text-xs sm:text-sm leading-snug break-words">
                  {emp.full_name}
                </p>
                <p className="text-[9.5px] xs:text-[10.5px] sm:text-[11px] text-gray-500 leading-tight break-words mt-0.5">
                  ({emp.position || emp.unit || 'DKPP Kota Cilegon'})
                </p>
              </div>
            </div>

            {/* Remove Button */}
            <button
              type="button"
              onClick={() => onRemove(emp.id)}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              title="Hapus pilihan"
              aria-label={`Hapus ${emp.full_name}`}
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Counter text: e.g. '3 dari 3 terpilih' */}
      <div className="text-xs text-gray-500 pt-1 font-medium">
        <span>{selected.length} dari {maxChoices} terpilih</span>
      </div>
    </div>
  );
};
