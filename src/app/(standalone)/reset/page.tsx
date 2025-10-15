'use client'

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { Lock, Eye, EyeOff } from 'lucide-react';
import bcrypt from 'bcryptjs';
import Image from 'next/image';

export default function Reset() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetContent />
    </Suspense>
  );
}

function ResetContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [isValidToken, setIsValidToken] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Token não fornecido"
        });
        return;
      }

      try {
        const tokenUrl = encodeURIComponent(token)
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/provider/resetpassword/${tokenUrl}`);
        if (!response.ok) throw new Error('Token inválido');
        const data = await response.json();
        setPhone(data.phone)
        setIsValidToken(true);
      } catch {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Token inválido ou expirado"
        });
      }
    };

    validateToken();
  }, [token, toast]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidToken || !newPassword) return;

    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/provider/resetpassword`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phone,
          password: hashedPassword
        }),
      });
      if (!response.ok) throw new Error('Falha ao redefinir senha');
      router.push('/login');
    } catch {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao redefinir senha"
      });
    }
  };

  return (
    <div className="container mx-auto max-w-4xl w-full px-4 sm:px-0">
      <Card className="bg-white shadow-lg">
        <CardHeader className="bg-gray-800 text-white items-center">
          <Image
            src="/sofiahpsi.png"
            alt="Sofiah Logo"
            width={120}
            height={120}
            style={{ height: 'auto' }}
          />
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-4">
            {isValidToken ? (
              <form onSubmit={handleResetPassword} className="w-full max-w-md">
                <label htmlFor="password" className="sr-only">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Nova senha"
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
                <button 
                  type="submit"
                  className="w-full mt-4 p-2 bg-[var(--primary-color)] hover:bg-[var(--complementary-color)] text-white rounded"
                >
                  Redefinir Senha
                </button>
              </form>
            ) : (
              <p>Validando token...</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}