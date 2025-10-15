import React, { useState } from 'react';
import { Phone } from 'lucide-react';
import { cleanPhoneNumber, formatBrazilianPhone } from '../lib/phoneFormat';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function PhoneInput({ value, onChange }: PhoneInputProps) {
  const [focused, setFocused] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const numbers = cleanPhoneNumber(input);
    
    // Limit to 11 digits (2 for area code + 9 for number)
    if (numbers.length <= 11) {
      const formatted = formatBrazilianPhone(numbers);
      onChange(formatted);
    }
  };

  return (
    <div className="relative">
      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
      <input
        type="tel"
        value={value}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="pl-10 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-indigo-500"
        placeholder={focused ? '(11) 98765-4321' : 'Número de telefone'}
      />
    </div>
  );
}