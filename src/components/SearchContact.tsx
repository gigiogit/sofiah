import React, { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import type { Contact } from '../app/data/contact';

interface SearchContactProps {
  suggestions: Contact[];
  onSelect: (contact: Contact) => void;
}

export function SearchContact({ suggestions, onSelect }: SearchContactProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<Contact[]>([]);
  const [showAllData, setShowAllData] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const filtered = suggestions.filter(contact =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSuggestions(filtered);
  }, [searchTerm, suggestions]);

  const handleSelect = (contact: Contact) => {
    onSelect(contact);
    setSearchTerm(contact.name);
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
          placeholder="Nome do paciente..."
          className="w-full px-4 py-2 pl-10 pr-4 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
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
          {(showAllData ? suggestions : filteredSuggestions).map(contact => (
            <li
              key={contact.id}
              onClick={() => handleSelect(contact)}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
            >
              {contact.name}
            </li>
          ))}
          {filteredSuggestions.length === 0 && !showAllData && (
            <li className="px-4 py-2 text-gray-500">Nenhum paciente encontrado</li>
          )}
        </ul>
      )}
    </div>
  );
}