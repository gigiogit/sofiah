'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  provAuthenticated: number;
  provTrialDate: string;
  provActualPlan: string;
  provCanceled: boolean;
  login: (provAuth: number, provTrialDate: string, provActualPlan: string, provCanceled: boolean) => void;
  isReady: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isReady, setIsReady] = useState(false);
  const [provAuthenticated, setProvAuthenticated] = useState<number>(0);
  const [provTrialDate, setProvTrialDate] = useState('');
  const [provActualPlan, setProvActualPlan] = useState('');
  const [provCanceled, setProvCanceled] = useState(false);

  useEffect(() => {
    const savedAuth = localStorage.getItem('provAuthenticated');
    if (savedAuth) {
      setProvAuthenticated(Number(savedAuth));
    }
    const savedTrialDate = localStorage.getItem('provTrialDate');
    if (savedTrialDate) {
      setProvTrialDate(savedTrialDate);
    }
    const savedActualPlan = localStorage.getItem('provActualPlan');
    if (savedActualPlan) {
      setProvActualPlan(savedActualPlan);
    }
    const savedCanceled = localStorage.getItem('provCanceled');
    if (savedCanceled) {
      setProvCanceled(savedCanceled === 'true' ? true : false);
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (isReady) {
      localStorage.setItem('provAuthenticated', provAuthenticated.toString());
      localStorage.setItem('provTrialDate', provTrialDate);
      localStorage.setItem('provActualPlan', provActualPlan);
      localStorage.setItem('provCanceled', provCanceled.toString());
    }
  }, [provAuthenticated, provTrialDate, provActualPlan, provCanceled, isReady]);

  const login = (provAuth: number, provTrialDate: string, provActualPlan: string, provCanceled: boolean) => {
    setProvAuthenticated(provAuth);
    setProvTrialDate(provTrialDate);
    setProvActualPlan(provActualPlan);
    setProvCanceled(provCanceled);
  };

  return (
    <AuthContext.Provider value={{ 
      provAuthenticated,
      provTrialDate,
      provActualPlan,
      provCanceled,
      login, 
      isReady 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthContext };