import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { PhoneInput } from '../../components/PhoneInput';

interface AuthFormFieldsProps {
  phone: string;
  password: string;
  mode: 'login' | 'signup' | 'reset';
  onPhoneChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
}

export function AuthFormFields({ 
  phone, 
  password, 
  mode, 
  onPhoneChange, 
  onPasswordChange 
}: AuthFormFieldsProps) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="space-y-4 rounded-md">
      <div>
        <label htmlFor="phone" className="sr-only">Phone</label>
        <PhoneInput value={phone} onChange={onPhoneChange} />
      </div>

      {mode !== 'reset' && (
        <div>
          <label htmlFor="password" className="sr-only">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              className="pl-10 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Senha"
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <Eye className="h-5 w-5" />
              ) : (
                <EyeOff className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}