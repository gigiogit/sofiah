'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, Shield, Clock, Users, Star, CheckCircle, Mail } from "lucide-react"
import Image from 'next/image'
import { useAuth } from '@/context/AuthContext'
import { useEffect } from 'react'

export default function HomePage() {
  const { provAuthenticated } = useAuth();

  useEffect(() => {
    const savedAuth = localStorage.getItem('provAuthenticated');
    if (savedAuth) {
      if (Number(savedAuth) !== 0) {
        localStorage.removeItem('provAuthenticated');
        localStorage.removeItem('provTrialDate');
        localStorage.removeItem('provActualPlan');
        localStorage.removeItem('provCanceled');
        window.location.reload();
      }
    }
  }, [provAuthenticated]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--primary-color)] to-[var(--secondary-color)]">
      <header className="bg-gray-800 sticky top-0 z-50 shadow-lg">
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
            <Link href="/login" className="text-white hover:text-[var(--complementary-color)] transition-colors">
              Entrar
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

      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-5xl font-bold text-white mb-6">Expanda sua Prática e Transforme sua Carreira</h1>
          <p className="text-xl text-white mb-8 leading-relaxed">
            A plataforma completa para profissionais de saúde mental. Conecte-se com mais pacientes, gerencie sua agenda,
            obtenha a hipótese de diagnóstico destes pacientes e esteja preparado antes mesmo da primeira consulta.<br />
            Faça a diferença na vida de quem precisa.
          </p>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Por que Profissionais Escolhem Nossa Plataforma?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A SofiahPsi foi desenvolvida exclusivamente para os Psicólogos, Psiquiatras, Neuropsicólogos, Terapeutas e Psicanalistas
              expandirem sua prática com segurança e eficiência, usando a inteligência artificial de uma forma descomplicada.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-rose-100 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="h-12 w-12 text-rose-600 mb-4" />
                <CardTitle className="text-xl">Mais Pacientes</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  Receba constantemente indicações de pacientes alinhados com sua abordagem e especialidade.
                  Nosso algoritmo inteligente realiza combinações assertivas, garantindo conexões mais eficazes e produtivas.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-rose-100 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Clock className="h-12 w-12 text-rose-600 mb-4" />
                <CardTitle className="text-xl">Gestão de Agenda</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  Esqueça o desgaste com marcações manuais. A plataforma administra sua agenda de forma automática:
                  agendamentos, lembretes, cancelamentos e remarcações são gerenciados com total autonomia, e você é notificado em tempo real.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-rose-100 hover:shadow-lg transition-shadow">
              <CardHeader>
                <CheckCircle className="h-12 w-12 text-rose-600 mb-4" />
                <CardTitle className="text-xl">Controle Financeiro</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  Tenha total controle sobre seus recebimentos com relatórios claros sobre pendências,
                  pagamentos e datas. Mais transparência e menos tempo perdido com burocracias.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-rose-100 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Shield className="h-12 w-12 text-rose-600 mb-4" />
                <CardTitle className="text-xl">Conformidade Total</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  Seus dados como o seu telefone não são expostos, toda a interação é realizada por nossa plataforma,
                  garantindo total privacidade e segurança para você e seus pacientes, em conformidade com CFP, LGPD e normas éticas. 
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-rose-100 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Star className="h-12 w-12 text-rose-600 mb-4" />
                <CardTitle className="text-xl">Análise da anamnese</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  Tenha em mãos informações importantes do paciente antes do primeiro encontro.
                  Isso permite um acolhimento mais preparado, empático e eficaz desde o início.                  
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-rose-100 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Heart className="h-12 w-12 text-rose-600 mb-4" />
                <CardTitle className="text-xl">Atendimento Humanizado</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  Fale a língua do seu paciente: todo o contato acontece via WhatsApp, com uma IA que simula uma comunicação natural e acolhedora,
                  promovendo engajamento e fidelização desde o primeiro atendimento.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-[var(--primary-color)]">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Pronto para Revolucionar sua Prática?</h2>
          <p className="text-xl text-rose-100 mb-8 max-w-2xl mx-auto">
            Cadastre-se gratuitamente na plataforma e comece a receber pacientes ainda hoje.
            Mais tempo para cuidar da saúde mental de quem precisa. Menos tempo com tarefas administrativas.
          </p>
          <Link href="/login">
            <Button
              size="lg"
              className="bg-white text-rose-600 hover:bg-gray-100 text-lg px-8 py-3"
              >
                Começar Gratuitamente
            </Button>
          </Link>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex flex-col items-center justify-center">
                <div className="flex items-center space-x-2 mb-4">
                    <Heart className="h-6 w-6 text-rose-400" />
                    <span className="text-xl font-bold">SofiahPsi</span>
                </div>
                <p className="text-gray-400">Conectando vidas, transformando cuidados.</p>
            </div>
            <div className="flex flex-col items-center justify-center">
                <div className="flex items-center space-x-2 mb-4">
                    <Mail className="h-6 w-6 text-rose-400" />
                    <span className="text-xl font-bold">Suporte</span>
                </div>
                <p className="text-gray-400">sofiah@sofiahpsi.com</p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 SofiahPsi. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
