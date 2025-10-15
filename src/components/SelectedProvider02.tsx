import React from 'react';
import { X } from 'lucide-react';
import type { Provider02Cat } from '../app/data/catProvider02';

interface SelectedProvider02Props {
  art: Provider02Cat;
  onRemove: (art: Provider02Cat) => void;
}

export function SelectedProvider02({ art, onRemove }: SelectedProvider02Props) {
  return (
    <div className="inline-flex items-center bg-[#FFC0CB] text-gray-800 rounded-full px-3 py-1 text-sm">
      <span>{art.name}</span>
      <button
        onClick={() => onRemove(art)}
        className="ml-2 focus:outline-none"
      >
        <X className="h-4 w-4 text-gray-600 hover:text-gray-800" />
      </button>
    </div>
  );
}