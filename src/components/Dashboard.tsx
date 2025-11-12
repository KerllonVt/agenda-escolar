import { BookOpen, Calendar, Search, Users, ClipboardList, Award, Settings, LogOut, Plus, CheckSquare, Shield, BookCheck, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useAuth } from '../contexts/AuthContext';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { usuario, logout } = useAuth();

  let menuItems = [];

  // Menu para Alunos
  if (usuario?.tipo_usuario === 'aluno') {
    menuItems = [
      { icon: Calendar, title: 'Agenda Semanal', description: 'Veja suas aulas da semana', page: 'agenda', color: 'bg-blue-500' },
      { icon: Search, title: 'Pesquisar Tema', description: 'Busque conteúdos educativos', page: 'pesquisa', color: 'bg-green-500' },
      { icon: ClipboardList, title: 'Minhas Atividades', description: 'Gerencie suas tarefas', page: 'atividades', color: 'bg-purple-500' },
      { icon: TrendingUp, title: 'Meu Boletim', description: 'Veja suas notas e médias', page: 'boletim', color: 'bg-yellow-500' },
    ];
  }

  // Menu para Professores
  if (usuario?.tipo_usuario === 'professor') {
    menuItems = [
      { icon: Calendar, title: 'Agenda Semanal', description: 'Visualize as aulas da semana', page: 'agenda', color: 'bg-blue-500' },
      { icon: Plus, title: 'Criar Aula', description: 'Adicione uma nova aula', page: 'criar-aula', color: 'bg-green-500' },
      { icon: ClipboardList, title: 'Criar Atividade', description: 'Crie atividades para alunos', page: 'criar-atividade', color: 'bg-purple-500' },
      { icon: CheckSquare, title: 'Avaliar Atividades', description: 'Corrija trabalhos enviados', page: 'avaliar', color: 'bg-orange-500' },
      { icon: Settings, title: 'Configurar Avaliações', description: 'Defina tipos e pesos de notas', page: 'configurar-avaliacoes', color: 'bg-indigo-500' },
      { icon: BookCheck, title: 'Lançar Notas', description: 'Registre notas dos alunos', page: 'lancar-notas', color: 'bg-pink-500' },
      { icon: Users, title: 'Minhas Turmas', description: 'Gerencie suas turmas', page: 'turmas', color: 'bg-cyan-500' },
      { icon: Search, title: 'Pesquisar Tema', description: 'Busque materiais educativos', page: 'pesquisa', color: 'bg-teal-500' },
    ];
  }

  // Menu para Administradores
  if (usuario?.tipo_usuario === 'admin') {
    menuItems = [
      { icon: Shield, title: 'Painel Admin', description: 'Gerencie o sistema', page: 'admin', color: 'bg-purple-600' },
      { icon: BookOpen, title: 'Ver Backend PHP', description: 'Código completo do backend', page: 'backend-code', color: 'bg-slate-600' },
    ];
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="bg-blue-500 w-10 h-10 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-primary">Agenda Escolar Interativa</h1>
                <p className="text-sm text-muted-foreground">
                  Bem-vindo(a), {usuario?.nome_completo}
                </p>
              </div>
              <Badge 
                variant="secondary" 
                className={
                  usuario?.tipo_usuario === 'admin' ? 'bg-purple-100 text-purple-700' :
                  usuario?.tipo_usuario === 'professor' ? 'bg-green-100 text-green-700' :
                  'bg-blue-100 text-blue-700'
                }
              >
                {usuario?.tipo_usuario === 'admin' ? 'Administrador' :
                 usuario?.tipo_usuario === 'professor' ? 'Professor' : 'Aluno'}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => onNavigate('configuracoes')}
              >
                <Settings className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={logout}
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <Card className="mb-8 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
          <CardHeader>
            <CardTitle className="text-white">
              Olá, {usuario?.nome_completo.split(' ')[0]}! 👋
            </CardTitle>
            <CardDescription className="text-blue-100">
              {usuario?.tipo === 'aluno' 
                ? 'Pronto para mais um dia de aprendizado?'
                : 'Vamos inspirar nossos alunos hoje!'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-blue-50">
              Segunda-feira, 13 de outubro de 2025
            </p>
            {usuario?.tipo_usuario === 'professor' && (
              <p className="text-blue-100 text-sm mt-2">
                Você tem 3 atividades para avaliar
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.page}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => onNavigate(item.page)}
              >
                <CardHeader>
                  <div className={`${item.color} w-12 h-12 rounded-lg flex items-center justify-center mb-3`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* Quick Stats */}
        {usuario?.tipo_usuario === 'aluno' && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardDescription>Atividades Pendentes</CardDescription>
                <CardTitle>3</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Aulas Esta Semana</CardDescription>
                <CardTitle>12</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Pontuação Total</CardDescription>
                <CardTitle>1.250 pts</CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}
        
        {usuario?.tipo_usuario === 'professor' && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardDescription>Aulas Esta Semana</CardDescription>
                <CardTitle>8</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Turmas Ativas</CardDescription>
                <CardTitle>3</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Atividades Criadas</CardDescription>
                <CardTitle>15</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-2 border-orange-200 bg-orange-50">
              <CardHeader>
                <CardDescription>Aguardando Correção</CardDescription>
                <CardTitle className="text-orange-600">3</CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}