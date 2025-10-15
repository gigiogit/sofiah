'use client'

import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { Menu, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useAuth } from '@/context/AuthContext'
import { differenceInDays } from 'date-fns'
import Link from 'next/link'
import Image from 'next/image'

export default function NavBar() {
  const { provAuthenticated, provTrialDate, provActualPlan, provCanceled } = useAuth();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const menuItems: Array<{ href: string; label: string; disabled: boolean; target?: string; rel?: string }> = [
    { href: '/perfil', label: 'Perfil', disabled: provAuthenticated < 0 },
    { href: '/mensagens', label: 'Pacientes', disabled: provAuthenticated < 0 },
    { href: '/agenda', label: 'Agenda', disabled: provAuthenticated < 0 },
    { href: '/financeiro', label: 'Financeiro', disabled: provAuthenticated < 0 },
    { href: '/pagamentos', label: 'Planos', disabled: false },
    { href: `https://wa.me/556293369862?text=${encodeURIComponent('Olá! Estou com dúvidas na utilização da plataforma.')}`, label: 'Ajuda', target: "_blank", rel: "noopener noreferrer", disabled: false },
    { href: '/home', label: 'Sair', disabled: false },
  ];

  if (provAuthenticated === 0) {
    return null;
  }

  return (
    <header className="bg-gray-800 sticky top-0 z-50 shadow-lg">
      <br />
      <div className="container mx-auto flex items-center">
        <Image
          src="/sofiahpsi.png"
          alt="Sofiah"
          width={200}
          height={200}
          style={{ height: 'auto' }}
        />
      </div>
      <div className="container mx-auto">
        <div className="flex justify-between items-start">
          <div className="text-white flex-grow text-start">
            {
              (provAuthenticated < 0 ?
                'Licença vencida, aguardando pagamento!' :
                (provActualPlan === 'basic' ?
                  'Harmonia' + (provTrialDate ? ` - Vence em ${differenceInDays(new Date(provTrialDate), new Date())} dias` : '') :
                  (provActualPlan === 'intermediate' ?
                    'Equilíbrio' + (provTrialDate ? ` - Vence em ${differenceInDays(new Date(provTrialDate), new Date())} dias` : '') :
                    (provActualPlan === 'advanced' ?
                      'Plenitude' + (provTrialDate ? ` - Vence em ${differenceInDays(new Date(provTrialDate), new Date())} dias` : '') :
                      ''
                    )
                  )
                ) + (provCanceled ? ' - Licença cancelada!' : '')
              )
            }
          </div>
          {/* Desktop menu */}
          <ul className="hidden lg:flex space-x-4 ml-4">
            {menuItems.map(({ href, label, disabled, target, rel }) => (
              <li key={href}>
                <Link
                  href={disabled ? '#' : href}
                  className={`${
                    pathname === href
                      ? 'text-[var(--primary-color)] font-bold'
                      : 'text-white hover:text-[var(--complementary-color)]'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={(e) => {
                      if (disabled) e.preventDefault();
                    }}
                    target={target}
                    rel={rel}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <Button
            variant="ghost"
            size="icon"
            className="text-white mr-4 lg:hidden"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div 
          ref={menuRef}
          className="lg:hidden absolute top-full right-0 w-64 bg-gray-700 shadow-lg rounded-br-lg z-50"
        >
          <ul className="py-2">
            {menuItems.map(({ href, label, disabled }) => (
              <li key={href}>
                <Link
                  href={disabled ? '#' : href}
                  className={`block px-4 py-2 ${
                    pathname === href
                      ? 'bg-gray-800 text-[var(--primary-color)] font-bold'
                      : 'text-white hover:bg-[var(--complementary-color)]'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={(e) => {
                      if (disabled) e.preventDefault();
                      setIsMenuOpen(false);
                    }}
                  >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  )
}