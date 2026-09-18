'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useEmployeeSearch } from '@/hooks/useEmployeeSearch';
import { Employee } from '@/lib/polling/types';
import { FiSearch, FiCheck, FiX, FiInfo } from 'react-icons/fi';

interface EmployeeAutocompleteProps {
  onSelect: (employee: Employee) => void;
  selectedIds: string[];
  disabled?: boolean;
  pollId?: string;
  pollCode?: string;
  placeholder?: string;
}

export const EmployeeAutocomplete: React.FC<EmployeeAutocompleteProps> = ({
  onSelect,
  selectedIds,
  disabled = false,
  pollId,
  pollCode,
  placeholder = "Ketik nama pegawai..."
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { results, loading } = useEmployeeSearch(query, pollId, pollCode);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlight on results change
  useEffect(() => {
    setHighlightedIndex(-1);
    if (query.trim().length >= 1 && results.length > 0) {
      setIsOpen(true);
    }
  }, [results, query]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) {
      if (e.key === 'ArrowDown' && query.trim().length >= 1) {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < results.length) {
        const emp = results[highlightedIndex];
        if (!selectedIds.includes(emp.id)) {
          onSelect(emp);
          setQuery('');
          setIsOpen(false);
        }
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search Input Box (Mockup Screen 1 & 2) */}
      <div className={`relative flex items-center bg-white border rounded-xl transition-all shadow-xs ${
        disabled
          ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-75'
          : isOpen
          ? 'border-emerald-500 ring-1 ring-emerald-500/20'
          : 'border-gray-200 hover:border-gray-300'
      }`}>
        <div className="pl-3.5 pr-2 text-gray-400">
          <FiSearch className="w-4 h-4" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.trim().length >= 1) setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim().length >= 1) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={disabled ? "Maksimal 3 nama ya" : placeholder}
          className="w-full py-2.5 pr-8 text-xs sm:text-sm text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none disabled:cursor-not-allowed"
          aria-label="Cari nama pegawai"
        />
        {query && !disabled && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="pr-3 text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <FiX className="w-4 h-4" />
          </button>
        )}
      </div>


      {/* Autocomplete Dropdown List (Mockup Screen 2) */}
      {isOpen && !disabled && query.trim().length >= 1 && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-gray-100 animate-in fade-in slide-in-from-top-1 duration-150">
          {loading ? (
            <div className="p-3.5 text-center text-xs text-gray-400 space-y-1">
              <div className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-emerald-500 border-t-transparent" />
              <p>Mencari...</p>
            </div>
          ) : results.length > 0 ? (
            results.map((emp, idx) => {
              const isSelected = selectedIds.includes(emp.id);
              const isHighlighted = highlightedIndex === idx;

              return (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => {
                    if (!isSelected) {
                      onSelect(emp);
                      setQuery('');
                      setIsOpen(false);
                    }
                  }}
                  disabled={isSelected}
                  className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50/40 text-gray-400 cursor-not-allowed'
                      : isHighlighted
                      ? 'bg-blue-50/80 text-gray-900'
                      : 'hover:bg-slate-50 text-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    {/* Circular Avatar */}
                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                      {emp.photo_url ? (
                        <img src={emp.photo_url} alt={emp.full_name} className="w-full h-full object-cover" />
                      ) : (
                        emp.full_name.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 truncate">
                      <p className="text-xs sm:text-sm font-semibold text-[#1e293b] truncate">
                        {emp.full_name}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate">
                        ({emp.position || emp.unit || 'DKPP Cilegon'})
                      </p>
                    </div>
                  </div>

                  {isSelected ? (
                    <span className="shrink-0 text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <FiCheck className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <div className="w-4 h-4 rounded border border-gray-300 shrink-0" />
                  )}
                </button>
              );
            })
          ) : (
            <div className="p-3.5 text-center text-xs text-gray-500">
              Tidak ditemukan pegawai dengan nama &ldquo;<span className="font-semibold text-gray-700">{query}</span>&rdquo;.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
