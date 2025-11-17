// src/components/PainelAdministrador.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Users, BookOpen, School, UserPlus, Settings, BarChart3, Edit, Trash2, GraduationCap, UserCheck, Loader2, AlertCircle, Search, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from './ui/dialog';
import { toast } from 'sonner';
import GerenciarTurmasSeries from './GerenciarTurmasSeries';
import GerenciarProfessoresTurmas from './GerenciarProfessoresTurmas';
import { useAuth } from '../contexts/AuthContext';
import { Usuario, Materia, TipoUsuario } from '../types';

// URL da API (local)
const API_URL = '/api';

// Hook para "atrasar" a pesquisa (debounce)
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

interface PainelAdministradorProps {
  onBack: () => void;
}

export function PainelAdministrador({ onBack }: PainelAdministradorProps) {
  const { token, usuario: adminLogado } = useAuth();
  const [activeTab, setActiveTab] = useState('usuarios');

  // --- Estados de Usuários ---
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [searchUsuario, setSearchUsuario] = useState('');
  const [userDialogAberto, setUserDialogAberto] = useState(false);
  const [editandoUsuario, setEditandoUsuario] = useState<Usuario | null>(null);
  const [formUsuario, setFormUsuario] = useState({
    nome_completo: '',
    email: '',
    senha: '',
    tipo_usuario: 'aluno' as TipoUsuario
  });

  // --- Estados de Matérias ---
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [isLoadingMaterias, setIsLoadingMaterias] = useState(false);
  const [searchMateria, setSearchMateria] = useState('');
  const [materiaDialogAberto, setMateriaDialogAberto] = useState(false);
  const [editandoMateria, setEditandoMateria] = useState<Materia | null>(null);
  const [formMateria, setFormMateria] = useState({ nome_materia: '' });
  
  // --- Estados de Estatísticas ---
  const [stats, setStats] = useState<Record<string, number>>({});
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Debounce (atraso) para as barras de pesquisa
  const debouncedSearchUsuario = useDebounce(searchUsuario, 300);
  const debouncedSearchMateria = useDebounce(searchMateria, 300);

  // --- API: Buscar Usuários (com pesquisa) ---
  const fetchUsers = async (searchTerm = '') => {
    setIsLoadingUsers(true);
    try {
      const url = searchTerm ? `${API_URL}/users?search=${searchTerm}` : `${API_URL}/users`;
      const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error('Falha ao buscar usuários');
      setUsuarios(await response.json());
    } catch (error: any) { toast.error(error.message); } finally { setIsLoadingUsers(false); }
  };

  // --- API: Buscar Matérias (com pesquisa) ---
  const fetchMaterias = async (searchTerm = '') => {
    setIsLoadingMaterias(true);
    try {
      const url = searchTerm ? `${API_URL}/materias?search=${searchTerm}` : `${API_URL}/materias`;
      const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error('Falha ao buscar matérias');
      setMaterias(await response.json());
    } catch (error: any) { toast.error(error.message); } finally { setIsLoadingMaterias(false); }
  };
  
  // --- API: Buscar Estatísticas ---
  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
       const [alunosRes, profRes, turmasRes, materiasRes] = await Promise.all([
         fetch(`${API_URL}/users?tipo=aluno`, { headers: { 'Authorization': `Bearer ${token}` } }),
         fetch(`${API_URL}/users?tipo=professor`, { headers: { 'Authorization': `Bearer ${token}` } }),
         fetch(`${API_URL}/turmas`, { headers: { 'Authorization': `Bearer ${token}` } }),
         fetch(`${API_URL}/materias`, { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);
      setStats({
        totalAlunos: (await alunosRes.json()).length,
        totalProfessores: (await profRes.json()).length,
        totalTurmas: (await turmasRes.json()).length,
        totalMaterias: (await materiasRes.json()).length
      });
    } catch (error: any) { toast.error("Erro ao buscar estatísticas"); } finally { setIsLoadingStats(false); }
  };

  // --- Efeitos de Carregamento e Pesquisa ---
  useEffect(() => {
    if (token && activeTab === 'usuarios') fetchUsers(debouncedSearchUsuario);
  }, [token, activeTab, debouncedSearchUsuario]);

  useEffect(() => {
    if (token && activeTab === 'materias') fetchMaterias(debouncedSearchMateria);
  }, [token, activeTab, debouncedSearchMateria]);
  
  useEffect(() => {
    if (token) fetchStats();
  }, [token, usuarios, materias]); // Recarrega stats se usuários ou matérias mudarem

  // --- CRUD Usuários ---
  const handleOpenUserDialog = (usuario: Usuario | null) => {
    if (usuario) {
      setEditandoUsuario(usuario);
      setFormUsuario({
        nome_completo: usuario.nome_completo,
        email: usuario.email,
        senha: '',
        tipo_usuario: usuario.tipo_usuario
      });
    } else {
      setEditandoUsuario(null);
      setFormUsuario({ nome_completo: '', email: '', senha: '', tipo_usuario: 'aluno' });
    }
    setUserDialogAberto(true);
  };

  const handleSalvarUsuario = async () => {
    if (!formUsuario.nome_completo || !formUsuario.email || (!editandoUsuario && !formUsuario.senha)) {
      toast.error('Preencha nome, email e senha (para novos usuários).');
      return;
    }
    
    setIsLoadingUsers(true);
    const url = editandoUsuario ? `${API_URL}/users/${editandoUsuario.id_usuario}` : `${API_URL}/users/create`;
    const method = editandoUsuario ? 'PUT' : 'POST';
    
    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formUsuario)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      toast.success(editandoUsuario ? 'Usuário atualizado!' : 'Usuário criado!');
      if (editandoUsuario) {
        setUsuarios(usuarios.map(u => u.id_usuario === data.id_usuario ? data : u));
      } else {
        setUsuarios([data, ...usuarios]);
      }
      setUserDialogAberto(false);
    } catch (error: any) { toast.error(error.message); } finally { setIsLoadingUsers(false); }
  };

  const handleExcluirUsuario = async (usuario: Usuario) => {
    if (usuario.id_usuario === adminLogado?.id_usuario) {
      toast.error('Você não pode excluir a si mesmo.');
      return;
    }
    if (!window.confirm(`Tem certeza que deseja excluir ${usuario.nome_completo}?`)) return;
    
    setIsLoadingUsers(true);
    try {
      const response = await fetch(`${API_URL}/users/${usuario.id_usuario}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      toast.success(data.message);
      setUsuarios(usuarios.filter(u => u.id_usuario !== usuario.id_usuario));
    } catch (error: any) { toast.error(error.message); } finally { setIsLoadingUsers(false); }
  };

  // --- CRUD Matérias ---
  const handleOpenMateriaDialog = (materia: Materia | null) => {
    if (materia) {
      setEditandoMateria(materia);
      setFormMateria({ nome_materia: materia.nome_materia });
    } else {
      setEditandoMateria(null);
      setFormMateria({ nome_materia: '' });
    }
    setMateriaDialogAberto(true);
  };
  
  const handleSalvarMateria = async () => {
    if (!formMateria.nome_materia) { toast.error('Digite o nome da matéria'); return; }
    setIsLoadingMaterias(true);
    
    const url = editandoMateria ? `${API_URL}/materias/${editandoMateria.id_materia}` : `${API_URL}/materias`;
    const method = editandoMateria ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formMateria)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      toast.success(editandoMateria ? 'Matéria atualizada!' : 'Matéria cadastrada!');
      if (editandoMateria) {
        setMaterias(materias.map(m => m.id_materia === data.id_materia ? data : m));
      } else {
        setMaterias([data, ...materias]);
      }
      setMateriaDialogAberto(false);
    } catch (error: any) { toast.error(error.message); } finally { setIsLoadingMaterias(false); }
  };
  
  const handleExcluirMateria = async (materia: Materia) => {
    if (!window.confirm(`Tem certeza que deseja excluir "${materia.nome_materia}"?`)) return;
    setIsLoadingMaterias(true);
    try {
      const response = await fetch(`${API_URL}/materias/${materia.id_materia}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      toast.success(data.message);
      setMaterias(materias.filter(m => m.id_materia !== materia.id_materia));
    } catch (error: any) { toast.error(error.message); } finally { setIsLoadingMaterias(false); }
  };

  // --- Funções Auxiliares de Renderização ---
  const getTipoUsuarioBadge = (tipo: string) => {
    const configs = { aluno: 'bg-blue-100 text-blue-700', professor: 'bg-green-100 text-green-700', admin: 'bg-purple-100 text-purple-700' };
    return configs[tipo as keyof typeof configs] || configs.aluno;
  };

  return (
    // --- CORREÇÃO AQUI: Removemos os Dialogs aninhados ---
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
              <div className="flex-1"><h1 className="text-primary">Painel do Administrador</h1><p className="text-sm text-muted-foreground">Gerencie usuários, turmas e configurações do sistema</p></div>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700"><Settings className="w-3 h-3 mr-1" />Admin</Badge>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="border-2 border-blue-200 bg-blue-50"><CardHeader><div className="flex items-center justify-between"><CardDescription>Total de Alunos</CardDescription><Users className="w-5 h-5 text-blue-600" /></div><CardTitle className="text-3xl">{isLoadingStats ? '...' : stats.totalAlunos}</CardTitle></CardHeader></Card>
            <Card className="border-2 border-green-200 bg-green-50"><CardHeader><div className="flex items-center justify-between"><CardDescription>Professores</CardDescription><Users className="w-5 h-5 text-green-600" /></div><CardTitle className="text-3xl">{isLoadingStats ? '...' : stats.totalProfessores}</CardTitle></CardHeader></Card>
            <Card className="border-2 border-purple-200 bg-purple-50"><CardHeader><div className="flex items-center justify-between"><CardDescription>Turmas Ativas</CardDescription><School className="w-5 h-5 text-purple-600" /></div><CardTitle className="text-3xl">{isLoadingStats ? '...' : stats.totalTurmas}</CardTitle></CardHeader></Card>
            <Card className="border-2 border-orange-200 bg-orange-50"><CardHeader><div className="flex items-center justify-between"><CardDescription>Matérias</CardDescription><BookOpen className="w-5 h-5 text-orange-600" /></div><CardTitle className="text-3xl">{isLoadingStats ? '...' : stats.totalMaterias}</CardTitle></CardHeader></Card>
          </div>

          {/* Tabs de Gerenciamento */}
          <Card>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <CardHeader>
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="usuarios"><Users className="w-4 h-4 mr-2" />Usuários</TabsTrigger>
                  <TabsTrigger value="turmas-series"><GraduationCap className="w-4 h-4 mr-2" />Gestão Turmas</TabsTrigger>
                  <TabsTrigger value="professores-turmas"><UserCheck className="w-4 h-4 mr-2" />Prof-Turmas</TabsTrigger>
                  <TabsTrigger value="materias"><BookOpen className="w-4 h-4 mr-2" />Matérias</TabsTrigger>
                  <TabsTrigger value="relatorios" disabled><BarChart3 className="w-4 h-4 mr-2" />Relatórios</TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent>
                {/* Tab: Usuários */}
                <TabsContent value="usuarios" className="space-y-6">
                  {/* --- CORREÇÃO AQUI: O Dialog começa aqui --- */}
                  <Dialog open={userDialogAberto} onOpenChange={setUserDialogAberto}>
                    <div className="flex items-center justify-between">
                      <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="Pesquisar usuário por nome..." 
                          className="pl-9"
                          value={searchUsuario}
                          onChange={(e) => setSearchUsuario(e.target.value)}
                        />
                      </div>
                      <DialogTrigger asChild>
                        <Button onClick={() => handleOpenUserDialog(null)}>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Novo Usuário
                        </Button>
                      </DialogTrigger>
                    </div>
                    {isLoadingUsers ? (<div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin" /></div>) : (
                      <div className="space-y-3">
                        {usuarios.map((usuario) => (
                          <Card key={usuario.id_usuario}>
                            <CardContent className="py-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="bg-primary text-primary-foreground w-10 h-10 rounded-full flex items-center justify-center">{usuario.nome_completo.charAt(0)}</div>
                                  <div><h4>{usuario.nome_completo}</h4><p className="text-sm text-muted-foreground">{usuario.email}</p></div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className={getTipoUsuarioBadge(usuario.tipo_usuario)} variant="outline">
                                    {usuario.tipo_usuario === 'aluno' ? 'Aluno' : usuario.tipo_usuario === 'professor' ? 'Professor' : 'Admin'}
                                  </Badge>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="icon" onClick={() => handleOpenUserDialog(usuario)}>
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <Button variant="outline" size="icon" onClick={() => handleExcluirUsuario(usuario)} disabled={usuario.id_usuario === adminLogado?.id_usuario}>
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </Dialog> {/* --- FIM DO DIALOG DE USUÁRIO --- */}
                </TabsContent>

                <TabsContent value="turmas-series"><GerenciarTurmasSeries /></TabsContent>
                <TabsContent value="professores-turmas"><GerenciarProfessoresTurmas /></TabsContent>

                {/* Tab: Matérias */}
                <TabsContent value="materias" className="space-y-6">
                  {/* --- CORREÇÃO AQUI: O Dialog começa aqui --- */}
                  <Dialog open={materiaDialogAberto} onOpenChange={setMateriaDialogAberto}>
                    <div className="flex items-center justify-between">
                      <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="Pesquisar matéria..." 
                          className="pl-9"
                          value={searchMateria}
                          onChange={(e) => setSearchMateria(e.target.value)}
                        />
                      </div>
                      <DialogTrigger asChild>
                        <Button onClick={() => handleOpenMateriaDialog(null)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Nova Matéria
                        </Button>
                      </DialogTrigger>
                    </div>
                    {isLoadingMaterias ? (<div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin" /></div>) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {materias.map((materia) => (
                          <Card key={materia.id_materia}>
                            <CardHeader><div className="flex items-center justify-between"><CardTitle>{materia.nome_materia}</CardTitle><BookOpen className="w-6 h-6 text-primary" /></div></CardHeader>
                            <CardContent>
                              <div className="flex gap-2">
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenMateriaDialog(materia)}>
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleExcluirMateria(materia)}>
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </Dialog> {/* --- FIM DO DIALOG DE MATÉRIA --- */}
                </TabsContent>

                <TabsContent value="relatorios"><div className="text-center py-12"><BarChart3 className="w-16 h-16 mx-auto text-muted-foreground mb-4" /><h3 className="mb-2">Relatórios em Desenvolvimento</h3><p className="text-muted-foreground">Em breve você poderá visualizar relatórios detalhados.</p></div></TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </main>
      </div>

      {/* Modal (Dialog) para Usuários */}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editandoUsuario ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
          <DialogDescription>Preencha os dados para gerenciar o usuário.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2"><Label htmlFor="nome">Nome Completo *</Label><Input id="nome" value={formUsuario.nome_completo} onChange={(e) => setFormUsuario({ ...formUsuario, nome_completo: e.target.value })} placeholder="Digite o nome completo" /></div>
          <div className="space-y-2"><Label htmlFor="email">Email *</Label><Input id="email" type="email" value={formUsuario.email} onChange={(e) => setFormUsuario({ ...formUsuario, email: e.target.value })} placeholder="usuario@escola.com" /></div>
          <div className="space-y-2"><Label htmlFor="senha">Senha {editandoUsuario ? '(Deixe em branco para manter)' : '*'}</Label><Input id="senha" type="password" value={formUsuario.senha} onChange={(e) => setFormUsuario({ ...formUsuario, senha: e.target.value })} placeholder="••••••" /></div>
          <div className="space-y-2"><Label htmlFor="tipo">Tipo de Usuário *</Label><Select value={formUsuario.tipo_usuario} onValueChange={(value: TipoUsuario) => setFormUsuario({ ...formUsuario, tipo_usuario: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="aluno">Aluno</SelectItem><SelectItem value="professor">Professor</SelectItem><SelectItem value="admin">Administrador</SelectItem></SelectContent></Select></div>
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => setUserDialogAberto(false)}>Cancelar</Button>
            <Button onClick={handleSalvarUsuario} disabled={isLoadingUsers}>{isLoadingUsers ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}</Button>
          </div>
        </div>
      </DialogContent>
      
      {/* Modal (Dialog) para Matérias */}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editandoMateria ? 'Editar Matéria' : 'Nova Matéria'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2"><Label htmlFor="nome-materia">Nome da Matéria *</Label><Input id="nome-materia" value={formMateria.nome_materia} onChange={(e) => setFormMateria({ ...formMateria, nome_materia: e.target.value })} placeholder="Ex: Matemática" /></div>
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => setMateriaDialogAberto(false)}>Cancelar</Button>
            <Button onClick={handleSalvarMateria} disabled={isLoadingMaterias}>{isLoadingMaterias ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}</Button>
          </div>
        </div>
      </DialogContent>
    </>
  );
}