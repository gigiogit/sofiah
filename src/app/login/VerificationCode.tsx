import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ArrowLeft, Timer } from 'lucide-react';
import Image from 'next/image'
import toast from 'react-hot-toast';

interface VerificationCodeProps {
  phone: string;
  onVerify: (code: string) => void;
  onResend: () => void;
}

export function VerificationCode({ phone, onVerify, onResend }: VerificationCodeProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(60);
  const inputs = Array(6).fill(0);

  const handleSubmit = async () => {
  }
  
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }

    // Submit when all digits are filled
    if (newCode.every(digit => digit) && newCode.join('').length === 6) {
      if (timeLeft > 0) {
        onVerify(newCode.join(''));
      } else {
        toast.error("O período de espera esgotou, reenvie um novo código.")
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  return (
    <div className="container mx-auto max-w-4xl w-full px-4 sm:px-0">
      <Card className="bg-white shadow-lg">
        <CardHeader className="bg-gray-800 text-white items-center">
          <Image
            src="/sofiahpsi.png"
            alt="Sofiah"
            width={480}
            height={480}
            style={{ height: 'auto' }}
          />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4 pt-4">
            <Timer className="mx-auto h-12 w-12 text-[var(--primary-color)]" />
            <h2 className="mt-6 text-3xl font-bold text-gray-800">
              Verifique seu WhatsApp
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Enviamos um código para o WhatsApp: {phone}
            </p>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="mt-8 space-y-6">
                <div className="flex justify-center gap-2">
                  {inputs.map((_, index) => (
                    <input
                      key={index}
                      id={`code-${index}`}
                      inputMode="numeric"
                      pattern="[0-9]"
                      maxLength={1}
                      value={code[index]}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-12 text-center text-2xl font-bold border-2 rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  className="group relative flex w-full justify-center rounded-lg bg-[var(--primary-color)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--complementary-color)] focus:outline-none focus:ring-2 focus:ring-gray-800 focus:ring-offset-2 disabled:opacity-50"
                >
                  <>
                  <ArrowLeft className="ml-2 h-4 w-4" />
                  Voltar para o login
                  </>
                </button>

                {timeLeft > 0 ? (
                  <p className="text-sm text-gray-600 text-center">
                    Reenvio do código em {timeLeft} segundos
                  </p>
                ) : (
                  <div className="flex justify-center">
                    <button
                      onClick={() => {
                        onResend();
                        setTimeLeft(60);
                      }}
                      className="text-sm text-indigo-600 hover:text-indigo-500r"
                    >
                      Reenviar o código de verificação
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}