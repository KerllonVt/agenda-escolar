// src/components/Dashboard.tsx

import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, Search, Users, ClipboardList, Award, Settings, LogOut, Plus, CheckSquare, Shield, BookCheck, TrendingUp, Loader2, PieChart, School } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

// URL da API (local)
const API_URL = 'http://localhost:5000/api';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

interface MenuItem {
  icon: React.ElementType;
  title: string;
  description: string;
  page: string;
  color: string;
}

// Helper para pegar datas da semana
const getISODate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};
const getSemanaAtual = () => {
  const hoje = new Date();
  const dataBase = new Date(hoje);
  const diaSemana = dataBase.getDay();
  const diffSegunda = dataBase.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
  const segunda = new Date(dataBase.setDate(diffSegunda));
  const sexta = new Date(segunda);
  sexta.setDate(segunda.getDate() + 4);
  return { inicio: getISODate(segunda), fim: getISODate(sexta) };
};

export function Dashboard({ onNavigate }: DashboardProps) {
  const { usuario, token, logout } = useAuth();
  
  const [stats, setStats] = useState<Record<string, string | number>>({});
  const [isLoading, setIsLoading] = useState(true);

  // --- BUSCA OS DADOS REAIS DO DASHBOARD ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!token || !usuario) return;
      setIsLoading(true);
      
      const semana = getSemanaAtual();
      const headers = { 'Authorization': `Bearer ${token}` };

      try {
        let statsData: Record<string, string | number> = {};

        // --- DADOS DO ALUNO ---
        if (usuario.tipo_usuario === 'aluno') {
          const [atividadesRes, aulasRes] = await Promise.all([
            fetch(`${API_URL}/atividades`, { headers }),
            fetch(`${API_URL}/aulas?data_inicio=${semana.inicio}&data_fim=${semana.fim}`, { headers })
          ]);
          
          const atividadesData = await atividadesRes.json();
          const aulasData = await aulasRes.json();
          const pendentes = atividadesData.filter((at: any) => !at.id_envio && new Date(at.data_entrega) >= new Date()).length;
          
          statsData = {
            atividadesPendentes: pendentes,
            aulasEstaSemana: aulasData.length,
          };
        }

        // --- DADOS DO PROFESSOR ---
        if (usuario.tipo_usuario === 'professor') {
          const [aulasRes, vinculosRes, atividadesRes, pendentesRes] = await Promise.all([
            fetch(`${API_URL}/aulas?data_inicio=${semana.inicio}&data_fim=${semana.fim}`, { headers }),
            fetch(`${API_URL}/vinculos/meus-vinculos`, { headers }),
            fetch(`${API_URL}/atividades`, { headers }),
            fetch(`${API_URL}/atividades/envios-pendentes`, { headers })
          ]);
          
          const aulasData = await aulasRes.json();
          const vinculosData = await vinculosRes.json();
          const atividadesData = await atividadesRes.json();
          const pendentesData = await pendentesRes.json();
          const turmasUnicas = new Set(vinculosData.map((v: any) => v.id_turma));

          statsData = {
            aulasEstaSemana: aulasData.length,
            turmasAtivas: turmasUnicas.size,
            atividadesCriadas: atividadesData.length,
            aguardandoCorrecao: pendentesData.length
          };
        }
        
        // --- DADOS DO ADMIN ---
        if (usuario.tipo_usuario === 'admin') {
          const [alunosRes, profRes, turmasRes, materiasRes] = await Promise.all([
             fetch(`${API_URL}/users?tipo=aluno`, { headers: { 'Authorization': `Bearer ${token}` } }),
             fetch(`${API_URL}/users?tipo=professor`, { headers: { 'Authorization': `Bearer ${token}` } }),
             fetch(`${API_URL}/turmas`, { headers: { 'Authorization': `Bearer ${token}` } }),
             fetch(`${API_URL}/materias`, { headers: { 'Authorization': `Bearer ${token}` } }),
          ]);
          
          statsData = {
            totalAlunos: (await alunosRes.json()).length,
            totalProfessores: (await profRes.json()).length,
            totalTurmas: (await turmasRes.json()).length,
            totalMaterias: (await materiasRes.json()).length
          };
        }
        setStats(statsData);
      } catch (error: any) {
        toast.error(`Erro ao carregar dados: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [token, usuario]);


  // --- MENUS (Atualizado) ---
  let menuItems: MenuItem[] = [];
  if (usuario?.tipo_usuario === 'aluno') {
    menuItems = [
      { icon: Calendar, title: 'Agenda Semanal', description: 'Veja suas aulas da semana', page: 'agenda', color: 'bg-blue-500' },
      { icon: ClipboardList, title: 'Minhas Atividades', description: 'Gerencie suas tarefas', page: 'atividades', color: 'bg-purple-500' },
      { icon: TrendingUp, title: 'Meu Boletim', description: 'Notas finais por unidade', page: 'boletim', color: 'bg-yellow-500' },
      { icon: PieChart, title: 'Meu Desempenho', description: 'Somatório de pontos das atividades', page: 'pontuacao', color: 'bg-orange-500' },
      { icon: Search, title: 'Pesquisar Tema', description: 'Busque conteúdos educativos', page: 'pesquisa', color: 'bg-green-500' },
    ];
  }
  if (usuario?.tipo_usuario === 'professor') {
    menuItems = [
      { icon: Calendar, title: 'Agenda Semanal', description: 'Visualize as aulas da semana', page: 'agenda', color: 'bg-blue-500' },
      { icon: Plus, title: 'Criar Aula', description: 'Adicione uma nova aula', page: 'criar-aula', color: 'bg-green-500' },
      { icon: ClipboardList, title: 'Gerenciar Atividades', description: 'Crie ou edite atividades', page: 'criar-atividade', color: 'bg-purple-500' },
      { icon: CheckSquare, title: 'Avaliar Atividades', description: 'Corrija trabalhos enviados', page: 'avaliar', color: 'bg-orange-500' },
      { icon: Settings, title: 'Configurar Avaliações', description: 'Defina tipos e pesos de notas', page: 'configurar-avaliacoes', color: 'bg-indigo-500' },
      { icon: BookCheck, title: 'Lançar Notas', description: 'Registre notas dos alunos', page: 'lancar-notas', color: 'bg-pink-500' },
      { icon: Users, title: 'Minhas Turmas', description: 'Gerencie suas turmas', page: 'turmas', color: 'bg-cyan-500' },
      { icon: Search, title: 'Pesquisar Tema', description: 'Busque materiais educativos', page: 'pesquisa', color: 'bg-teal-500' },
    ];
  }
  
  // --- CORREÇÃO AQUI ---
  if (usuario?.tipo_usuario === 'admin') {
    menuItems = [
      { icon: Shield, title: 'Painel Admin', description: 'Gerencie o sistema', page: 'admin', color: 'bg-purple-600' },
      // A linha "Ver Backend" foi removida
    ];
  }
  // --- FIM DA CORREÇÃO ---

  const renderStats = () => {
    if (isLoading) {
      return (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card><CardHeader><CardDescription>...</CardDescription><CardTitle><Loader2 className="w-6 h-6 animate-spin" /></CardTitle></CardHeader></Card>
          <Card><CardHeader><CardDescription>...</CardDescription><CardTitle><Loader2 className="w-6 h-6 animate-spin" /></CardTitle></CardHeader></Card>
          <Card><CardHeader><CardDescription>...</CardDescription><CardTitle><Loader2 className="w-6 h-6 animate-spin" /></CardTitle></CardHeader></Card>
        </div>
      );
    }
    
    // --- STATS DO ALUNO ---
    if (usuario?.tipo_usuario === 'aluno') {
      return (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader><CardDescription>Atividades Pendentes</CardDescription><CardTitle>{stats.atividadesPendentes ?? 0}</CardTitle></CardHeader>
          </Card>
          <Card>
            <CardHeader><CardDescription>Aulas Esta Semana</CardDescription><CardTitle>{stats.aulasEstaSemana ?? 0}</CardTitle></CardHeader>
          </Card>
           <Card className="border-2 border-orange-200 bg-orange-50">
            <CardHeader><CardDescription>Desempenho (Soma)</CardDescription><CardTitle className="text-orange-600">Ver Notas</CardTitle></CardHeader>
          </Card>
        </div>
      );
    }
    
    // --- STATS DO PROFESSOR ---
    if (usuario?.tipo_usuario === 'professor') {
      return (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card><CardHeader><CardDescription>Aulas Esta Semana</CardDescription><CardTitle>{stats.aulasEstaSemana ?? 0}</CardTitle></CardHeader></Card>
          <Card><CardHeader><CardDescription>Turmas Ativas</CardDescription><CardTitle>{stats.turmasAtivas ?? 0}</CardTitle></CardHeader></Card>
          <Card><CardHeader><CardDescription>Atividades Criadas</CardDescription><CardTitle>{stats.atividadesCriadas ?? 0}</CardTitle></CardHeader></Card>
          <Card className="border-2 border-orange-200 bg-orange-50"><CardHeader><CardDescription>Aguardando Correção</CardDescription><CardTitle className="text-orange-600">{stats.aguardandoCorrecao ?? 0}</CardTitle></CardHeader></Card>
        </div>
      );
    }
    // --- STATS DO ADMIN ---
    if (usuario?.tipo_usuario === 'admin') {
      return (
         <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-2 border-blue-200 bg-blue-50"><CardHeader><div className="flex items-center justify-between"><CardDescription>Total de Alunos</CardDescription><Users className="w-5 h-5 text-blue-600" /></div><CardTitle className="text-3xl">{stats.totalAlunos ?? 0}</CardTitle></CardHeader></Card>
          <Card className="border-2 border-green-200 bg-green-50"><CardHeader><div className="flex items-center justify-between"><CardDescription>Professores</CardDescription><Users className="w-5 h-5 text-green-600" /></div><CardTitle className="text-3xl">{stats.totalProfessores ?? 0}</CardTitle></CardHeader></Card>
          <Card className="border-2 border-purple-200 bg-purple-50"><CardHeader><div className="flex items-center justify-between"><CardDescription>Turmas Ativas</CardDescription><School className="w-5 h-5 text-purple-600" /></div><CardTitle className="text-3xl">{stats.totalTurmas ?? 0}</CardTitle></CardHeader></Card>
          <Card className="border-2 border-orange-200 bg-orange-50"><CardHeader><div className="flex items-center justify-between"><CardDescription>Matérias</CardDescription><BookOpen className="w-5 h-5 text-orange-600" /></div><CardTitle className="text-3xl">{stats.totalMaterias ?? 0}</CardTitle></CardHeader></Card>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="bg-blue-500 w-10 h-10 rounded-lg flex items-center justify-center"><BookOpen className="w-6 h-6 text-white" /></div>
              <div><h1 className="text-primary">Agenda Escolar Interativa</h1><p className="text-sm text-muted-foreground">Bem-vindo(a), {usuario?.nome_completo}</p></div>
              <Badge variant="secondary" className={
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
              <Button variant="outline" size="icon" onClick={() => onNavigate('configuracoes')}><Settings className="w-5 h-5" /></Button>
              <Button variant="outline" size="icon" onClick={logout}><LogOut className="w-5 h-5" /></Button>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-8 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
          <CardHeader>
            <CardTitle className="text-white">Olá, {usuario?.nome_completo.split(' ')[0]}! 👋</CardTitle>
            <CardDescription className="text-blue-100">
              {usuario?.tipo_usuario === 'aluno' ? 'Pronto para mais um dia de aprendizado?' : (usuario?.tipo_usuario === 'professor' ? 'Vamos inspirar nossos alunos hoje!' : 'Gerencie o sistema com eficiência.')}
            </CardDescription>
          </CardHeader>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.page} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onNavigate(item.page)}>
                <CardHeader>
                  <div className={`${item.color} w-12 h-12 rounded-lg flex items-center justify-center mb-3`}><Icon className="w-6 h-6 text-white" /></div>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
        {renderStats()}
      </main>
    </div>
  );
}