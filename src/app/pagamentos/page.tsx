'use client'

import { useEffect, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useAuth } from '@/context/AuthContext';
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import Link from 'next/link';
import dotenv from 'dotenv'

dotenv.config();
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISH_KEY!)

const plans = [
  { id: 'basic', name: 'Harmonia', price: '0,00', description: 'Organize sua agenda!', item1: 'Gratuito', item2: 'Site', item3: 'ChatBot', item4: 'Transcrição Sessão', item5: '30 Agendamentos/mês', item6: '-', item7: '-', item8: '-', item9: '-'},
  { id: 'intermediate', name: 'Equilíbrio', price: '49,90', description: 'Aumente sua produtividade!', item1: 'Ganhe Tempo', item2: 'Site', item3: 'ChatBot', item4: 'Transcrição Sessão', item5: '99 Agendamentos/mês', item6: 'Prontuário-IA', item7: 'Indicação de Pacientes', item8: 'Anamnese-IA', item9: 'Recebimentos'},
  { id: 'advanced', name: 'Plenitude', price: '119,70', description: 'Gerencie sua clínica!', item1: 'Até 3 profissionais', item2: 'Site', item3: 'ChatBot', item4: 'Transcrição Sessão', item5: 'Agendamentos ilimitados', item6: 'Prontuário-IA', item7: 'Indicação de Pacientes', item8: 'Anamnese-IA', item9: 'Recebimentos'},
]

export default function SubscriptionApp() {
  const { provAuthenticated, provActualPlan, isReady } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(plans[0]);
  const [isProcessing, setIsProcessing] = useState(false)
  const [isMobile, setIsMobile] = useState(false);
  const { toast } = useToast()

  useEffect(() => {
    const checkIfMobile = () => {
      const userAgent = navigator.userAgent;
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isSmallScreen = window.innerWidth <= 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };
    checkIfMobile();
    const handleResize = () => checkIfMobile();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    handlePlanSelect(provActualPlan);
  }, [provActualPlan]);

  const handlePlanSelect = (planId: string) => {
    const plan = plans.find(p => p.id === planId)
    if (plan) setSelectedPlan(plan)
  }

  const handleSubscribe  = async () => {
    if (selectedPlan.id === 'advanced') {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Este plano ainda não está disponível para assinatura. Teremos prazer em anunciar assim que for disponibilizado.",
        duration: 3000,
      })
      return
    }

    setIsProcessing(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscription/checkout`, {      
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId: selectedPlan.id }),
      })

      if (!response.ok) {
        throw new Error('Failed to create subscription')
      }

      const { sessionId } = await response.json()
      const stripe = await stripePromise;
      
      if (!stripe) {
        throw new Error('Stripe failed to initialize');
      }
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        const checkoutUrl = `https://checkout.stripe.com/c/pay/${sessionId}`;
        const newWindow = window.open(checkoutUrl, '_blank');
        
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          window.location.href = checkoutUrl;
        }
      } else {
        const result = await stripe.redirectToCheckout({
          sessionId: sessionId,
        });

        if (result.error) {
          throw new Error(result.error.message);
        }
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro ao iniciar o processo de pagamento. Por favor, tente novamente.",
        duration: 3000,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancel  = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscription/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: provAuthenticated }),
      })

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      const data = await response.json();
      if (data.success) {
        toast({
          variant: "default",
          title: "Sucesso",
          description: "Cancelamento realizado com sucesso.",
          duration: 3000,
        })
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro ao iniciar o processo de cancelamento. Por favor, tente novamente.",
        duration: 3000,
      })
    }
  }

  if (!isReady) {
    return (
      <div className="container mx-auto max-w-4xl py-8 flex items-center justify-center">
        <p className="text-lg text-white">Carregando...</p>
      </div>
    );
  }

  if (provAuthenticated === 0) {
    return (
      <div className="container mx-auto max-w-4xl py-8 flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-white">Você precisa estar autenticado para acessar esta página.</p>
        <Link 
          href="/login" 
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Fazer login
        </Link>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b from-[var(--primary-color)] to-[var(--secondary-color)] ${isMobile ? 'p-0' : 'pt-4 space-y-4'} flex justify-center items-center`}>
      <div className={`w-full ${isMobile ? '' : 'sm:min-w-[344px] sm:max-w-4xl space-y-8 bg-white/8 dark:bg-black/8 backdrop-blur-md rounded-3xl p-4 sm:p-8 shadow-xl relative z-10 border border-white/20 dark:border-black/20 min-h-[700px]'}`}>
        <Card className="mb-4 bg-white shadow-[12px] relative">
          <CardHeader className="bg-[var(--complementary-color)] text-white flex flex-row justify-between items-center rounded-t-[12px]">
            <CardTitle>Plano de Assinatura</CardTitle>
            <CardDescription className="text-gray-200">
              Selecione o plano que melhor atende às suas necessidades
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <RadioGroup
              value={selectedPlan.id}
              onValueChange={handlePlanSelect}
              className="grid gap-4 grid-cols-1 md:grid-cols-3"
            >
              {plans.map((plan) => (
                <Label
                  key={plan.id}
                  className={`flex flex-col items-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary ${
                    selectedPlan.id === plan.id ? 'border-[var(--primary-color)] bg-[#FFC0CB] hover:bg-[#FFC0CB]' : 'hover:bg-[var(--secondary-color)]'
                  }`}
                >
                  <RadioGroupItem value={plan.id} id={plan.id} className="sr-only" />
                  <span className="text-2xl font-bold">{plan.name}</span>
                  <span className="text-lg font-semibold">R$ {plan.price}</span>
                  <span className="text-sm text-gray-800">por mês</span>
                  <span className="text-sm font-semibold">{plan.description}</span>
                  <span className="text-lg font-semibold">{plan.item1}</span>
                  <span className="text-lg"><br /></span>
                  <span className="text-lg">{plan.item2}</span>
                  <span className="text-lg">{plan.item3}</span>
                  <span className="text-lg">{plan.item4}</span>
                  <span className="text-lg">{plan.item5}</span>
                  <span className="text-lg">{plan.item6}</span>
                  <span className="text-lg">{plan.item7}</span>
                  <span className="text-lg">{plan.item8}</span>
                  <span className="text-lg">{plan.item9}</span>
                </Label>
              ))}
            </RadioGroup>
          </CardContent>
          <CardFooter className="flex justify-end space-x-4">
            <Button
              onClick={handleSubscribe}
              disabled={isProcessing}
              className="w-full bg-[var(--primary-color)] hover:bg-[var(--complementary-color)] text-white"
            >
              {isProcessing ? 'Processando...' : 'Assinar Plano'}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              className="w-full border-[var(--primary-color)] text-[var(--primary-color)] hover:bg-[var(--complementary-color)] hover:text-white"
            >
              Cancelar Plano
            </Button>            
          </CardFooter>
        </Card>
      </div>
      <Toaster />
    </div>
  )
}

