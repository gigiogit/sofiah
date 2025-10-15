'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Heart, Shield, Clock, Users, MessageCircle, CheckCircle, Star } from "lucide-react"
import Link from "next/link"
import Image from 'next/image'
import { useAuth } from '@/context/AuthContext'
import { useEffect } from 'react'

export default function LandingPage() {
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
            <div className="hidden md:flex items-center space-x-6">
              <Link href="#como-funciona" className="text-white hover:text-[var(--complementary-color)] transition-colors">
                Como Funciona
              </Link>
              <Link href="#beneficios" className="text-white hover:text-[var(--complementary-color)] transition-colors">
                Benefícios
              </Link>
              <Link href="#privacidade" className="text-white hover:text-[var(--complementary-color)] transition-colors">
                Privacidade
              </Link>
              <Link href="#acessar" className="text-white hover:text-[var(--complementary-color)] transition-colors">
                Acessar
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[var(--secondary-color)] text-gray-800">
                <MessageCircle className="h-4 w-4 mr-2" />
                Atendimento 100% Humanizado
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
                Encontre o <span className="text-white">profissional ideal</span> para sua saúde mental
              </h1>
              <p className="text-xl text-white leading-relaxed">
                Nossa inteligência artificial humanizada analisa seu perfil com total discrição para conectar você ao
                profissional que melhor atende às suas necessidades específicas, considerando sua agenda e preferências.
              </p>
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-200">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-gray-200" />
                <span>100% Confidencial</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-200" />
                <span>Disponível 24/7</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-gray-200" />
                <span>Sem Compromisso</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-2xl p-8 border border-emerald-100">
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-[var(--secondary-color)] rounded-full flex items-center justify-center">
                    <Image
                        src="/sofiah_circle.png"
                        alt="Sofiah"
                        width={200}
                        height={200}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">SofiahPsi</h3>
                    <p className="text-sm text-gray-500">Online agora</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-[var(--secondary-color)] rounded-lg p-4">
                    <p className="text-gray-700">
                      {
                        "Olá! Sou a SofiahPsi, sua assistente virtual. Vou te ajudar a encontrar o profissional ideal para suas necessidades. Tudo que conversarmos aqui é completamente confidencial."
                      }
                    </p>
                  </div>
                  <div className="bg-gray-200 rounded-lg p-4 ml-8">
                    <p className="text-gray-700">
                      {"Preciso de ajuda para encontrar um profissional para amanhã."}
                    </p>
                  </div>
                  <div className="bg-[var(--secondary-color)] rounded-lg p-4">
                    <p className="text-gray-700">
                      {
                        "Perfeito! Vou analisar seu perfil e encontrar profissionais disponíveis para amanhã. Me conte um pouco mais sobre o que você tem sentido (ansiedade, depressão, estresse, etc.)"
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Como Funciona</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Um processo simples e discreto para conectar você ao profissional certo
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-[var(--primary-color)] hover:shadow-lg transition-shadow">
              <CardContent className="p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-[var(--primary-color)] rounded-full flex items-center justify-center mx-auto">
                  <MessageCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">1. Conversa Inicial</h3>
                <p className="text-gray-600">
                  Nossa IA humanizada conversa com você de forma natural e acolhedora, entendendo suas necessidades
                  específicas com total privacidade.
                </p>
              </CardContent>
            </Card>
            <Card className="border-[var(--primary-color)] hover:shadow-lg transition-shadow">
              <CardContent className="p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-[var(--primary-color)] rounded-full flex items-center justify-center mx-auto">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">2. Análise Inteligente</h3>
                <p className="text-gray-600">
                  Analisamos seu perfil, preferências e agenda para encontrar profissionais que realmente se alinham com
                  suas necessidades.
                </p>
              </CardContent>
            </Card>
            <Card className="border-[var(--primary-color)] hover:shadow-lg transition-shadow">
              <CardContent className="p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-[var(--primary-color)] rounded-full flex items-center justify-center mx-auto">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">3. Conexão Perfeita</h3>
                <p className="text-gray-600">
                  Conectamos você diretamente com o profissional ideal, evitando que precise passar por vários até
                  encontrar o certo.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section id="beneficios" className="py-16 md:py-24 bg-[var(--secondary-color)]">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Por que escolher a SOFIAHPSI?</h2>
                <p className="text-xl text-gray-600">
                  Eliminamos as barreiras que dificultam o acesso ao cuidado mental adequado
                </p>
              </div>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-[var(--primary-color)] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Matching Assertivo</h3>
                    <p className="text-gray-600">
                      Nossa IA analisa centenas de variáveis para encontrar o profissional que melhor se adequa ao seu
                      perfil e necessidades específicas.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-[var(--primary-color)] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Total Discrição</h3>
                    <p className="text-gray-600">
                      Todas as informações são tratadas com máxima confidencialidade. Seu processo de busca é
                      completamente privado e seguro.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-[var(--primary-color)] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Agenda Flexível</h3>
                    <p className="text-gray-600">
                      Consideramos sua disponibilidade para encontrar profissionais que atendem nos horários que
                      funcionam para você.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-[var(--primary-color)] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Star className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Economia de Tempo</h3>
                    <p className="text-gray-600">
                      Evite passar por vários profissionais até encontrar o ideal. Nossa análise garante maior
                      assertividade na primeira indicação.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-emerald-100">
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-[var(--primary-color)] rounded-full flex items-center justify-center mx-auto mb-4">
                      <Heart className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">+10.000</h3>
                    <p className="text-gray-600">Conexões bem-sucedidas</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-[var(--secondary-color)] rounded-lg p-4">
                      <div className="text-2xl font-bold text-gray-600 mb-1">95%</div>
                      <div className="text-sm text-gray-600">Taxa de satisfação</div>
                    </div>
                    <div className="bg-[var(--secondary-color)] rounded-lg p-4">
                      <div className="text-2xl font-bold text-gray-600 mb-1">24h</div>
                      <div className="text-sm text-gray-600">Tempo médio de agendamento</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacidade */}
      <section id="privacidade" className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-[var(--primary-color)] rounded-full flex items-center justify-center mx-auto">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Sua Privacidade é Nossa Prioridade</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Entendemos que buscar ajuda para saúde mental requer coragem e confiança. Por isso, garantimos total
                discrição em todo o processo.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-[var(--primary-color)] rounded-full flex items-center justify-center mx-auto">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">Dados Criptografados</h3>
                <p className="text-gray-600 text-sm">
                  Todas as informações são protegidas com criptografia de ponta a ponta
                </p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 bg-[var(--primary-color)] rounded-full flex items-center justify-center mx-auto">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">Acesso Restrito</h3>
                <p className="text-gray-600 text-sm">
                  Apenas você e o profissional indicado têm acesso às suas informações
                </p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 bg-[var(--primary-color)] rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">Conformidade LGPD</h3>
                <p className="text-gray-600 text-sm">Seguimos rigorosamente todas as normas de proteção de dados</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section id="acessar" className="py-16 md:py-24 bg-gradient-to-r from-[var(--primary-color)] to-[var(--secndary-color)]">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Pronto para encontrar o profissional ideal?</h2>
            <p className="text-xl text-gray-600">
              Comece agora uma conversa confidencial com nossa assistente virtual. É gratuito, sem compromisso e
              totalmente discreto.
            </p>
            <div className="bg-[var(--primary-color)] text-white hover:bg-[var(--complementary-color)] rounded-lg px-8 py-4 text-lg font-semibold">
              <Link 
                href={`https://wa.me/556281747900?text=${encodeURIComponent('Olá! Gostaria de agendar uma consulta.')}`} 
              >
                Iniciar Conversa Gratuita
              </Link>
            </div>
            <p className="text-gray-800 text-sm">
              ✓ Sem cadastro necessário ✓ Resposta em minutos ✓ 100% confidencial
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold">SOFIAHPSI</span>
              </div>
              <p className="text-gray-400 text-sm">
                Conectando pessoas aos profissionais de saúde mental ideais através de tecnologia humanizada.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Serviços</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="#" className="hover:text-emerald-400 transition-colors">
                    Busca de Profissionais
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-emerald-400 transition-colors">
                    Atendimento 24/7
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-emerald-400 transition-colors">
                    Suporte Especializado
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Suporte</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="#" className="hover:text-emerald-400 transition-colors">
                    Central de Ajuda
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-emerald-400 transition-colors">
                    Contato
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-emerald-400 transition-colors">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="#" className="hover:text-emerald-400 transition-colors">
                    Privacidade
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-emerald-400 transition-colors">
                    Termos de Uso
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-emerald-400 transition-colors">
                    LGPD
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 SofiahPsi. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
