import { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import type { Provider01Cat } from '../app/data/catProvider01';

interface SearchInputProps {
  suggestions: Provider01Cat[];
  onSelect: (art: Provider01Cat) => void;
}

export function SearchInput({ suggestions, onSelect }: SearchInputProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<Provider01Cat[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showAllData, setShowAllData] = useState(false);
  
  useEffect(() => {
    const filtered = suggestions.filter(art =>
      art.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSuggestions(filtered);
  }, [searchTerm, suggestions]);

  const handleSelect = (art: Provider01Cat) => {
    onSelect(art);
    setSearchTerm('');
    setShowSuggestions(false);
    setShowAllData(false);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Digite para buscar uma especialidade..."
          className="w-full px-4 py-2 pl-10 pr-12 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
        />
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        <button
          onClick={() => setShowAllData(!showAllData)}
          className="absolute right-3 top-2.5 p-1 rounded-full hover:bg-gray-100"
        >
          <svg
            className={`h-5 w-5 text-gray-400 transform transition-transform ${
              showAllData ? 'rotate-180' : ''
            }`}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {(showSuggestions && searchTerm || showAllData) && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {(showAllData ? suggestions : filteredSuggestions).map(art => (
            <li
              key={art.id}
              onClick={() => handleSelect(art)}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
            >
              {art.name}
            </li>
          ))}
          {filteredSuggestions.length === 0 && !showAllData && (
            <li className="px-4 py-2 text-gray-500">Nenhuma especialidade encontrada</li>
          )}
        </ul>
      )}
    </div>
  );
}