'use client';

import React from 'react';
import { Employee } from '@/lib/polling/types';
import { FiCheck, FiX } from 'react-icons/fi';
import { EmployeeMediaAvatar } from './EmployeeMediaAvatar';

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

              {/* Circular Avatar / Media Placeholder */}
              <EmployeeMediaAvatar
                photoUrl={emp.photo_url}
                nip={emp.nip}
                employeeId={emp.id}
                name={emp.full_name}
                size="md"
              />

              {/* Name & Position */}
              <div className="min-w-0 truncate">
                <p className="font-bold text-[#1e293b] text-xs sm:text-sm truncate">
                  {emp.full_name}
                </p>
                <p className="text-[11px] text-gray-500 truncate">
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
