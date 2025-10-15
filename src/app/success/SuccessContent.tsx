'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link'

interface SubscriptionDetails {
  plan_name: string;
  amount: number | string;
  current_period_end: string;
}

export default function SuccessContent() {
  const { provAuthenticated } = useAuth();
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetails | null>(null)

  useEffect(() => {
    const confirmSubscription = async (sessionId: string) => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscription/confirm`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(
            {
              session_id: sessionId,
              user_id: provAuthenticated
            }),
        });

        if (!response.ok) {
          throw new Error('Failed to confirm subscription');
        }

        const data = await response.json();
        if (data.success) {
          setStatus('success');
          setSubscriptionDetails(data.subscription);
        } else {
          throw new Error(data.error || 'Unknown error occurred');
        }
      } catch (error) {
        console.error('Error confirming subscription:', error);
        setStatus('error');
      }
    };

    const sessionId = searchParams?.get('session_id');
    if (sessionId) {
      if (provAuthenticated !== 0) {
        confirmSubscription(sessionId);
      }
    } else {
      setStatus('error');
    }
  }, [searchParams, provAuthenticated]);

  if (status === 'loading') {
    return (
      <Card className="shadow-lg">
        <CardHeader className="bg-[var(--primary-color)] text-white">
          <CardTitle>Processando seu pagamento</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-center text-lg">Por favor, aguarde enquanto confirmamos seu pagamento...</p>
        </CardContent>
      </Card>
    )
  }

  if (status === 'error') {
    return (
      <Card className="shadow-lg">
        <CardHeader className="bg-red-600 text-white">
          <CardTitle>Erro no processamento</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-center text-lg mb-4">Desculpe, ocorreu um erro ao processar seu pagamento.</p>
          <div className="text-center">
            <Link href="/assinatura">
              <Button>Voltar para Assinaturas</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatAmount = (amount: number | string) => {
    if (typeof amount === 'number') {
      return amount.toFixed(2);
    }
    return amount;
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-[var(--primary-color)] text-white">
        <CardTitle>Pagamento bem-sucedido!</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <p className="text-center text-lg mb-4">Obrigado por assinar nosso serviço!</p>
        {subscriptionDetails && (
          <div className="text-center mb-4">
            <p><strong>Plano:</strong> {subscriptionDetails.plan_name}</p>
            <p><strong>Valor:</strong> R$ {formatAmount(subscriptionDetails.amount)} / mês</p>
            <p><strong>Próxima cobrança:</strong> {new Date(subscriptionDetails.current_period_end).toLocaleDateString()}</p>
          </div>
        )}
        <div className="text-center">
          <Link href="/pagamentos">
            <Button>Voltar</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

