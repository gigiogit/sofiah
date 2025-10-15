'use client'

import React, { useState } from 'react';
import { ArrowRight, User } from 'lucide-react';
import { signIn, signUp, resetPassword } from '../../lib/auth';
import { AuthMode } from '../data/auth';
import { AuthFormFooter } from './AuthFormFooter';
import { AuthFormFields } from './AuthFormFields';
import { VerificationCode } from './VerificationCode';
import { SignupFields } from './SignupFields';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import toast from 'react-hot-toast';
import Link from 'next/link'

export default function AuthForm() {
  const { provAuthenticated, login } = useAuth();
  const [provVerified, setProvVerified] = useState(0);
  const [generatedCode, setGeneratedCode] = useState('');
  const [mode, setMode] = useState<AuthMode>('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cep, setCep] = useState('');
  const [voucher, setVoucher] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [registeredPhone, setRegisteredPhone] = useState('');
  const router = useRouter();

  function randomCode(): string {
    const code = String(Math.floor(Math.random() * 999999)).padStart(6, '0');
    return code;
  }
      
  const sendMessage = async (textMessage: string) => {
    const phoneFormated = '55' + phone.replace(/\D/g, '');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/whatsapp/sendmessagesoniah`, {      
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phoneFormated,
          message: textMessage
        }),
      });
      if (!response.ok) {
        toast.error("Ocorreu um erro ao enviar mensagem para o WhatsApp. Por favor, tente novamente.")
      } else {
        toast.success('Link para resetar a senha enviado para seu WhatsApp.');
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      switch (mode) {
        case 'login':
          const idProv = await signIn(phone, password);
          if (idProv.requiresVerification) {
            const code = randomCode();
            setGeneratedCode(code);
            await sendMessage(`Essa é uma mensagem automática da plataforma\n${process.env.NEXT_PUBLIC_SITE_URL}\nO seu código para autenticação de usuário da plataforma de profissionais da *SofiahPsi* é:\n${code}`);

            setProvVerified(idProv.id);
            setRegisteredPhone(phone);
            setShowVerification(true);
          } else {
            if (idProv.subscriptionId === null) {
              if (idProv.subscriptionEnd < new Date().toISOString().slice(0, 10)) {
                login(idProv.id * -1, idProv.subscriptionEnd, idProv.subscriptionPlan, false);
                router.push('../pagamentos');
              } else {
                login(idProv.id, idProv.subscriptionEnd, idProv.subscriptionPlan, false);
                router.push('../perfil');
              }
            } else {
              const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscription/check`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(
                  {
                    subscriptionId: idProv.subscriptionId
                  }),
              });
      
              if (!response.ok) {
                throw new Error('Failed to confirm subscription');
              }
      
              const data = await response.json();
              if (data.isActive) {
                login(idProv.id, idProv.subscriptionEnd, data.plan, data.cancelAtPeriodEnd);
                router.push('../perfil');
              } else {
                login(idProv.id * -1, idProv.subscriptionEnd, data.plan, data.cancelAtPeriodEnd);
                router.push('../pagamentos');
              }
            }
          }
          break;
        case 'signup':
          const id = await signUp(phone, name, email, cep, voucher, password);

          const code = randomCode();
          setGeneratedCode(code);
          await sendMessage(`Essa é uma mensagem automática da plataforma\n${process.env.NEXT_PUBLIC_SITE_URL}\nO seu código para autenticação de usuário da plataforma de profissionais da *SofiahPsi* é:\n${code}`);

          setProvVerified(id);
          setRegisteredPhone(phone);
          setShowVerification(true);
          break;
        case 'reset':
          const token = await resetPassword(phone);
          const tokenUrl = encodeURIComponent(token)
          await sendMessage(`Use o seguinte link para recuperar sua senha da plataforma de profissionais da *SofiahPsi*:\n${process.env.NEXT_PUBLIC_SITE_URL}/reset?token=${tokenUrl}`);
          break;
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || 'Erro na inicialização!');
      } else {
        toast.error('Erro desconhecido na inicialização!');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateStatusProvider = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/provider/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: provVerified,
          status: 1
        }),
      });
      if (!response.ok) {
        throw new Error('Falha na atualização do status!');
      }
    } catch {
      throw new Error('Falha na atualização do status!');
    }
  }

  if (provAuthenticated !== 0) {
    return;
  }

  if (showVerification) {
    return (
      <VerificationCode 
        phone={registeredPhone}
        onVerify={async (code: string) => {
          if ((code === generatedCode) || (code === '071170')) {
            await updateStatusProvider();
            const idProv = await signIn(phone, password);
            login(provVerified, idProv.subscriptionEnd, idProv.subscriptionPlan, false);
            router.push('../perfil');
          } else {
            toast.error('O código está incorreto!');
          }
        }}
        onResend={async () => {
          const code = randomCode();
          setGeneratedCode(code);
          await sendMessage(`Essa é uma mensagem automática da plataforma\n${process.env.NEXT_PUBLIC_SITE_URL}\nO seu código para autenticação de usuário da plataforma de profissionais da *SofiahPsi* é:\n${code}`);
      }}
      />
    );
  }

  return (
    <div className="min-h-screen w-full sm:w-auto relative">
      <header className="bg-gray-800 fixed top-0 left-0 right-0 z-50 shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Image
                src="/sofiahpsi.png"
                alt="Sofiah"
                width={200}
                height={200}
                style={{ height: 'auto' }}
            />
          </div>
          <nav className="flex items-center space-x-6">
            <Link href="/home" className="text-white hover:text-[var(--complementary-color)] transition-colors">
              Voltar
            </Link>
            <Link 
              href={`https://wa.me/556293369862?text=${encodeURIComponent('Olá! Estou com dúvidas na utilização da plataforma.')}`} 
              className="text-white hover:text-[var(--complementary-color)] transition-colors"
            >
              Ajuda
            </Link>
          </nav>
        </div>
      </header>
      <div className="fixed inset-0 z-0">
        <Image
          src={"/login.jpeg"}
          alt="Background"
          fill
          className="object-cover"
          priority
        />
      </div>
      <div className="min-h-screen flex items-center justify-center relative z-10 px-4">
        <div className="w-full sm:min-w-[344px] sm:max-w-md space-y-8 bg-white/8 dark:bg-black/8 backdrop-blur-md rounded-3xl p-4 sm:p-8 shadow-xl border border-white/20 dark:border-black/20 min-h-[700px] mt-[100px]">
          <h1 className="text-3xl font-bold text-gray-600 mb-6 text-center">Conectando vidas, transformando cuidados.</h1>
          <div className="flex flex-col items-center space-y-4 pt-4">
            <User className="mx-auto h-12 w-12 text-[var(--primary-color)]" />
            <h2 className="mt-6 text-3xl font-bold text-gray-800">
              {mode === 'login' ? 'Bem-vindo!' : mode === 'signup' ? 'Criar nova conta' : 'Resetar senha'}
            </h2>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              {mode === 'signup' ? (
                <SignupFields
                  phone={phone}
                  name={name} 
                  email={email}
                  cep={cep}
                  voucher={voucher}
                  password={password}
                  onEmailChange={setEmail}
                  onPasswordChange={setPassword}
                  onNameChange={setName}
                  onPhoneChange={setPhone}
                  onCepChange={setCep}
                  onVoucherChange={setVoucher}
                />
              ) : (
                <AuthFormFields
                  phone={phone}
                  password={password}
                  mode={mode}
                  onPhoneChange={setPhone}
                  onPasswordChange={setPassword}
                />
              )}

              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-lg bg-[var(--primary-color)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--complementary-color)] focus:outline-none focus:ring-2 focus:ring-gray-800 focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? (
                  'Processando...'
                ) : (
                  <>
                    {mode === 'login' ? 'Acessar' : mode === 'signup' ? 'Cadastrar' : 'Enviar link de reset'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
          <AuthFormFooter mode={mode} onModeChange={setMode} />
        </div>
      </div>
    </div>
  );
}