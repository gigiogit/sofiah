import React from 'react';
import { AuthMode } from '../data/auth';

interface AuthFormFooterProps {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
}

export function AuthFormFooter({ mode, onModeChange }: AuthFormFooterProps) {
  if (mode === 'login') {
    return (
      <div className="text-center text-sm">
        <button
          onClick={() => onModeChange('reset')}
          className="text-indigo-600 hover:text-indigo-500"
        >
          Esqueceu sua senha?
        </button>
        <span className="mx-2">·</span>
        <button
          onClick={() => onModeChange('signup')}
          className="text-indigo-600 hover:text-indigo-500"
        >
          Criar nova conta
        </button>
      </div>
    );
  }

  return (
    <div className="text-center text-sm">
      <button
        onClick={() => onModeChange('login')}
        className="text-indigo-600 hover:text-indigo-500"
      >
        Voltar para o login
      </button>
    </div>
  );
}