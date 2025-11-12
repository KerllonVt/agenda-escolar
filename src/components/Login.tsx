// src/components/Login.tsx

import { useState } from 'react';
import { BookOpen, Mail, Lock, User, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface LoginProps {
  onLoginSuccess: () => void;
}

// URL da nossa API (backend) que está rodando localmente
const API_URL = '/api';

export function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [tipo, setTipo] = useState<'aluno' | 'professor' | 'admin'>('aluno');
  
  // Estados para controlar o carregamento e erros
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pegamos a função 'login' do nosso contexto
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Impede o recarregamento da página
    setIsLoading(true); // Ativa o "carregando..."
    setError(null);     // Limpa erros antigos

    try {
      // 1. Chamar a API do nosso backend
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          senha: senha,
          tipo_usuario: tipo,
        }),
      });

      // 2. Ler a resposta da API
      const data = await response.json();

      // 3. Verificar se a API retornou um erro
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao tentar fazer login');
      }

      // 4. Se deu certo (temos token e usuário)
      toast.success('Login realizado com sucesso!');
      
      // 5. Usar a função login do AuthContext para salvar o usuário e o token
      login(data.usuario, data.token); 
      
      onLoginSuccess(); // Navegar para o Dashboard

    } catch (err: any) {
      // 6. Se deu errado
      console.error('Falha no login:', err);
      const errorMessage = err.message || 'Email, senha ou tipo de usuário incorretos';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false); // Desativa o "carregando..."
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto bg-blue-500 w-16 h-16 rounded-full flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <CardTitle>Agenda Escolar Interativa</CardTitle>
          <CardDescription>
            Entre com suas credenciais para acessar a plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Usuário</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={tipo === 'aluno' ? 'default' : 'outline'}
                  className="w-full"
                  onClick={() => setTipo('aluno')}
                >
                  <User className="w-4 h-4 mr-2" />
                  Aluno
                </Button>
                <Button
                  type="button"
                  variant={tipo === 'professor' ? 'default' : 'outline'}
                  className="w-full"
                  onClick={() => setTipo('professor')}
                >
                  <User className="w-4 h-4 mr-2" />
                  Professor
                </Button>
                <Button
                  type="button"
                  variant={tipo === 'admin' ? 'default' : 'outline'}
                  className="w-full"
                  onClick={() => setTipo('admin')}
                >
                  <User className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="senha"
                  type="password"
                  placeholder="••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            {/* Mensagem de Erro */}
            {error && (
              <div className="text-red-600 text-sm text-center">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {/* Mostra um ícone de "girando" enquanto carrega */}
              {isLoading ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                'Entrar'
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                className="text-sm text-blue-600 hover:underline"
                onClick={() => toast.info('Funcionalidade em desenvolvimento')}
              >
                Esqueceu a senha?
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}