import React from 'react';
import { X } from 'lucide-react';
import type { Provider05Cat } from '../app/data/catProvider05';

interface SelectedProvider05Props {
  art: Provider05Cat;
  onRemove: (art: Provider05Cat) => void;
}

export function SelectedProvider05({ art, onRemove }: SelectedProvider05Props) {
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