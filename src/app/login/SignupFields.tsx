import { useState } from 'react';
import { Mail, Lock, User, MapPin, Ticket, Eye, EyeOff } from 'lucide-react';
import { PhoneInput } from '../../components/PhoneInput';
import { Dialog } from '@headlessui/react';

interface SignupFieldsProps {
  phone: string;
  name: string;
  email: string;
  cep: string;
  voucher: string;
  password: string;
  onPhoneChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onCepChange: (value: string) => void;
  onVoucherChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
}

export function SignupFields({
  phone,
  name,
  email,
  cep,
  voucher,
  password,
  onPhoneChange,
  onNameChange,
  onEmailChange,
  onCepChange,
  onVoucherChange,
  onPasswordChange,
}: SignupFieldsProps) {
  const [showTerms, setShowTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-4 rounded-md">
      <div>
        <label htmlFor="phone" className="sr-only">Phone</label>
        <div className="relative">
          <PhoneInput value={phone} onChange={onPhoneChange} />
        </div>
      </div>

      <div>
        <label htmlFor="name" className="sr-only">Name</label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className="pl-10 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Nome completo"
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="sr-only">Email address</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            className="pl-10 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Endereço de e-mail"
          />
        </div>
      </div>

      <div>
        <label htmlFor="cep" className="sr-only">CEP</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            id="cep"
            type="text"
            required
            value={cep}
            onChange={(e) => {
              const numericValue = e.target.value.replace(/\D/g, '');
              onCepChange(numericValue);
            }}
            className="pl-10 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="CEP"
            pattern="\d{5}-?\d{3}"
            maxLength={8}
          />
        </div>
      </div>

      <div>
        <label htmlFor="voucher" className="sr-only">Voucher</label>
        <div className="relative">
          <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            id="voucher"
            type="text"
            value={voucher}
            onChange={(e) => onVoucherChange(e.target.value)}
            className="pl-10 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Cupom (opcional)"
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="sr-only">Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            className="pl-10 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Senha"
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
      </div>

      <div>
        <label className="inline-flex items-center">
          <input
            type="checkbox"
            required
            className="form-checkbox"
          />
          <span className="ml-2">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setShowTerms(true);
              }}
              className="text-blue-600 hover:underline"
            >
              Concordo com os termos de uso
            </a>
          </span>
        </label>
      </div>
      
      {/* Modal Component for Terms */}
      <Dialog open={showTerms} onClose={() => setShowTerms(false)} className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="fixed inset-0 bg-black opacity-30" aria-hidden="true" />
          <div className="relative bg-white rounded max-w-md mx-auto p-6 z-20">
            <Dialog.Title className="text-lg font-bold text-center">
              TERMO DE CONCORDÂNCIA COM A POLÍTICA DE PRIVACIDADE E PROTEÇÃO DE DADOS
            </Dialog.Title>
            <Dialog.Description className="mt-4 whitespace-pre-wrap" style={{ textAlign: 'justify' }}>
              {`Este termo estabelece as diretrizes para a coleta, uso, armazenamento e proteção dos dados pessoais fornecidos pelos usuários da plataforma de cadastro de profissionais da área de saúde mental, conforme a Lei Geral de Proteção de Dados Pessoais (LGPD - Lei n° 13.709/2018).`}<br />
              <strong>DADOS PESSOAIS COLETADOS:</strong> Nome, telefone, e-mail e CEP.<br />
              <strong>FINALIDADE:</strong> Cadastro na plataforma, facilitação de contato entre usuários e profissionais, comunicação sobre serviços e cumprimento de obrigações legais.<br />
              <strong>COMPARTILHAMENTO:</strong> Os dados não serão vendidos ou compartilhados, salvo exigências legais.<br />
              <strong>SEGURANÇA:</strong> Medidas adequadas são adotadas para proteção contra acessos não autorizados e vazamentos.<br />
              <strong>DIREITOS DO USUÁRIO:</strong> Acessar, corrigir, excluir e revogar consentimento dos dados mediante solicitação via sofiah@sofiahpsi.com.<br />
              <strong>ALTERAÇÕES:</strong> Este termo pode ser atualizado periodicamente e será informado ao usuário.<br />
              {`Ao continuar, você declara estar ciente e concorda com os termos aqui estabelecidos.`}
            </Dialog.Description>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowTerms(false)}
                className="px-4 py-2 bg-[var(--primary-color)] text-white rounded hover:bg-[var(--complementary-color)]"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}