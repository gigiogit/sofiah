import React from 'react';
import { X } from 'lucide-react';
import type { Provider03Cat } from '../app/data/catProvider03';

interface SelectedProvider03Props {
  art: Provider03Cat;
  onRemove: (art: Provider03Cat) => void;
}

export function SelectedProvider03({ art, onRemove }: SelectedProvider03Props) {
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