import React from 'react';
import { Toaster } from 'react-hot-toast';
import '../globals.css';

export default function StandaloneLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--primary-color)] to-[var(--secondary-color)]">
      {children}
      <Toaster position="top-right" />
    </div>
  );
}