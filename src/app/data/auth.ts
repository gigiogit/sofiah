export type AuthMode = 'login' | 'signup' | 'reset';

export interface AuthFormProps {
  mode: AuthMode;
  phone: string;
  password: string;
  loading: boolean;
  onPhoneChange: (phone: string) => void;
  onPasswordChange: (password: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export interface AuthFormState {
  mode: AuthMode;
  phone: string;
  password: string;
  loading: boolean;
}
