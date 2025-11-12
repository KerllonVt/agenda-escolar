import { ArrowLeft, User, Lock, Palette, Bell, Mail } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import { toast } from 'sonner@2.0.3';

interface ConfiguracoesProps {
  onBack: () => void;
}

export function Configuracoes({ onBack }: ConfiguracoesProps) {
  const { usuario } = useAuth();
  const [temaDark, setTemaDark] = useState(false);
  const [notificacoes, setNotificacoes] = useState(true);
  const [notificacoesEmail, setNotificacoesEmail] = useState(true);

  const [nomeCompleto, setNomeCompleto] = useState(usuario?.nome_completo || '');
  const [email, setEmail] = useState(usuario?.email || '');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const handleSalvarPerfil = () => {
    toast.success('Perfil atualizado com sucesso!');
  };

  const handleAlterarSenha = () => {
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      toast.error('Preencha todos os campos de senha');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      toast.error('As senhas não coincidem');
      return;
    }
    toast.success('Senha alterada com sucesso!');
    setSenhaAtual('');
    setNovaSenha('');
    setConfirmarSenha('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-primary">Configurações</h1>
              <p className="text-sm text-muted-foreground">
                Gerencie suas preferências e informações pessoais
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Informações do Perfil */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 p-2 rounded-lg">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle>Informações do Perfil</CardTitle>
                <CardDescription>
                  Atualize seus dados pessoais
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <Input
                id="nome"
                value={nomeCompleto}
                onChange={(e) => setNomeCompleto(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-perfil">Email</Label>
              <Input
                id="email-perfil"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Usuário</Label>
              <Input
                value={
                  usuario?.tipo_usuario === 'aluno' ? 'Aluno' : 
                  usuario?.tipo_usuario === 'professor' ? 'Professor' : 
                  'Administrador'
                }
                disabled
              />
            </div>
            <Button onClick={handleSalvarPerfil}>
              Salvar Alterações
            </Button>
          </CardContent>
        </Card>

        {/* Alterar Senha */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-purple-500 p-2 rounded-lg">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle>Alterar Senha</CardTitle>
                <CardDescription>
                  Mantenha sua conta segura
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="senha-atual">Senha Atual</Label>
              <Input
                id="senha-atual"
                type="password"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nova-senha">Nova Senha</Label>
              <Input
                id="nova-senha"
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmar-senha">Confirmar Nova Senha</Label>
              <Input
                id="confirmar-senha"
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
              />
            </div>
            <Button onClick={handleAlterarSenha}>
              Alterar Senha
            </Button>
          </CardContent>
        </Card>

        {/* Preferências */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-green-500 p-2 rounded-lg">
                <Palette className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle>Preferências</CardTitle>
                <CardDescription>
                  Personalize sua experiência
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
              <div className="space-y-0.5">
                <Label>Tema Escuro</Label>
                <p className="text-sm text-muted-foreground">
                  Ativar modo escuro no aplicativo
                </p>
              </div>
              <Switch
                checked={temaDark}
                onCheckedChange={(checked) => {
                  setTemaDark(checked);
                  toast.info(checked ? 'Tema escuro ativado' : 'Tema claro ativado');
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notificações */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-orange-500 p-2 rounded-lg">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle>Notificações</CardTitle>
                <CardDescription>
                  Configure como você quer receber notificações
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
              <div className="space-y-0.5">
                <Label>Notificações Push</Label>
                <p className="text-sm text-muted-foreground">
                  Receber notificações sobre atividades e aulas
                </p>
              </div>
              <Switch
                checked={notificacoes}
                onCheckedChange={setNotificacoes}
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
              <div className="space-y-0.5 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <div>
                  <Label>Notificações por Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber resumos semanais por email
                  </p>
                </div>
              </div>
              <Switch
                checked={notificacoesEmail}
                onCheckedChange={setNotificacoesEmail}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sobre */}
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            <p>Agenda Escolar Interativa v1.0</p>
            <p className="mt-1">© 2025 - Todos os direitos reservados</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
