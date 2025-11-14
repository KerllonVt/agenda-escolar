// src/components/PainelAdministrador.tsx
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, BookOpen, School, UserPlus, Settings, BarChart3, Edit, Trash2, GraduationCap, UserCheck, Loader2, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import GerenciarTurmasSeries from './GerenciarTurmasSeries';
import GerenciarProfessoresTurmas from './GerenciarProfessoresTurmas';
import { useAuth } from '../contexts/AuthContext';
import { Usuario, Materia } from '../types';

const API_URL = '/api'; // <-- CORRIGIDO PARA VERCEL

interface PainelAdministradorProps { onBack: () => void; }

export function PainelAdministrador({ onBack }: PainelAdministradorProps) {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('usuarios');
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [novoUsuario, setNovoUsuario] = useState({ nome_completo: '', email: '', senha: '', tipo_usuario: 'aluno' as 'aluno' | 'professor' | 'admin' });
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [novaMateria, setNovaMateria] = useState({ nome_materia: '' });
  const [isLoadingMaterias, setIsLoadingMaterias] = useState(false);
  const [isCreatingMateria, setIsCreatingMateria] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [errorUsers, setErrorUsers] = useState<string | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const fetchUsers = async () => {
    setIsLoadingUsers(true); setErrorUsers(null);
    try {
      const response = await fetch(`${API_URL}/users`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || 'Falha ao buscar usuários'); }
      const data: Usuario[] = await response.json(); setUsuarios(data);
    } catch (error: any) { console.error(error); setErrorUsers(error.message); toast.error(error.message); } finally { setIsLoadingUsers(false); }
  };
  const handleCadastrarUsuario = async () => {
    if (!novoUsuario.nome_completo || !novoUsuario.email || !novoUsuario.senha) { toast.error('Preencha todos os campos obrigatórios'); return; }
    setIsCreatingUser(true);
    try {
      const response = await fetch(`${API_URL}/users/create`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(novoUsuario) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      toast.success(`Usuário ${data.usuario.nome_completo} cadastrado com sucesso!`);
      setNovoUsuario({ nome_completo: '', email: '', senha: '', tipo_usuario: 'aluno' }); fetchUsers(); 
    } catch (error: any) { console.error(error); toast.error(error.message); } finally { setIsCreatingUser(false); }
  };
  const fetchMaterias = async () => {
    setIsLoadingMaterias(true);
    try {
      const response = await fetch(`${API_URL}/materias`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error('Falha ao buscar matérias.');
      const data: Materia[] = await response.json(); setMaterias(data);
    } catch (error: any) { toast.error(error.message); } finally { setIsLoadingMaterias(false); }
  };
  const handleCadastrarMateria = async () => {
    if (!novaMateria.nome_materia) { toast.error('Digite o nome da matéria'); return; }
    setIsCreatingMateria(true);
    try {
      const response = await fetch(`${API_URL}/materias`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(novaMateria) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      toast.success(`Matéria ${data.nome_materia} cadastrada!`);
      setNovaMateria({ nome_materia: '' }); fetchMaterias();
    } catch (error: any) { toast.error(error.message); } finally { setIsCreatingMateria(false); }
  };
  useEffect(() => {
    if (activeTab === 'usuarios') { fetchUsers(); }
    if (activeTab === 'materias') { fetchMaterias(); }
  }, [activeTab, token]);
  const getTipoUsuarioBadge = (tipo: string) => {
    const configs = { aluno: 'bg-blue-100 text-blue-700', professor: 'bg-green-100 text-green-700', admin: 'bg-purple-100 text-purple-700' };
    return configs[tipo as keyof typeof configs] || configs.aluno;
  };
  const renderUserList = () => {
    if (isLoadingUsers) { return (<div className="flex justify-center items-center py-10"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /><p className="ml-2 text-muted-foreground">Carregando usuários...</p></div>); }
    if (errorUsers) { return (<div className="flex justify-center items-center py-10 text-red-600"><AlertCircle className="w-8 h-8" /><p className="ml-2">Erro ao carregar usuários: {errorUsers}</p></div>); }
    if (usuarios.length === 0) { return (<div className="text-center py-10 text-muted-foreground"><p>Nenhum usuário encontrado.</p></div>); }
    return (
      <div className="space-y-3">
        {usuarios.map((usuario) => (
          <Card key={usuario.id_usuario}><CardContent className="py-4"><div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary text-primary-foreground w-10 h-10 rounded-full flex items-center justify-center">{usuario.nome_completo.charAt(0)}</div>
              <div><h4>{usuario.nome_completo}</h4><p className="text-sm text-muted-foreground">{usuario.email}</p></div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getTipoUsuarioBadge(usuario.tipo_usuario)} variant="outline">{usuario.tipo_usuario === 'aluno' ? 'Aluno' : usuario.tipo_usuario === 'professor' ? 'Professor' : 'Admin'}</Badge>
              <Button variant="outline" size="icon" disabled><Edit className="w-4 h-4" /></Button>
              <Button variant="outline" size="icon" disabled><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div></CardContent></Card>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
            <div className="flex-1"><h1 className="text-primary">Painel do Administrador</h1><p className="text-sm text-muted-foreground">Gerencie usuários, turmas e configurações do sistema</p></div>
            <Badge variant="secondary" className="bg-purple-100 text-purple-700"><Settings className="w-3 h-3 mr-1" />Admin</Badge>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="border-2 border-blue-200 bg-blue-50"><CardHeader><div className="flex items-center justify-between"><CardDescription>Total de Alunos</CardDescription><Users className="w-5 h-5 text-blue-600" /></div><CardTitle className="text-3xl">{usuarios.filter(u => u.tipo_usuario === 'aluno').length}</CardTitle></CardHeader></Card>
            <Card className="border-2 border-green-200 bg-green-50"><CardHeader><div className="flex items-center justify-between"><CardDescription>Professores</CardDescription><Users className="w-5 h-5 text-green-600" /></div><CardTitle className="text-3xl">{usuarios.filter(u => u.tipo_usuario === 'professor').length}</CardTitle></CardHeader></Card>
            <Card className="border-2 border-purple-200 bg-purple-50"><CardHeader><div className="flex items-center justify-between"><CardDescription>Turmas Ativas</CardDescription><School className="w-5 h-5 text-purple-600" /></div><CardTitle className="text-3xl">...</CardTitle></CardHeader></Card>
            <Card className="border-2 border-orange-200 bg-orange-50"><CardHeader><div className="flex items-center justify-between"><CardDescription>Matérias</CardDescription><BookOpen className="w-5 h-5 text-orange-600" /></div><CardTitle className="text-3xl">{materias.length}</CardTitle></CardHeader></Card>
        </div>
        <Card>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader>
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="usuarios"><Users className="w-4 h-4 mr-2" />Usuários</TabsTrigger>
                <TabsTrigger value="turmas" disabled><School className="w-4 h-4 mr-2" />Turmas</TabsTrigger>
                <TabsTrigger value="turmas-series"><GraduationCap className="w-4 h-4 mr-2" />Gestão Turmas</TabsTrigger>
                <TabsTrigger value="professores-turmas"><UserCheck className="w-4 h-4 mr-2" />Prof-Turmas</TabsTrigger>
                <TabsTrigger value="materias"><BookOpen className="w-4 h-4 mr-2" />Matérias</TabsTrigger>
                <TabsTrigger value="relatorios" disabled><BarChart3 className="w-4 h-4 mr-2" />Relatórios</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="usuarios" className="space-y-6">
                <Card className="bg-muted"><CardHeader><CardTitle className="text-lg">Cadastrar Novo Usuário</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2"><Label htmlFor="nome">Nome Completo *</Label><Input id="nome" value={novoUsuario.nome_completo} onChange={(e) => setNovoUsuario({ ...novoUsuario, nome_completo: e.target.value })} placeholder="Digite o nome completo" /></div>
                      <div className="space-y-2"><Label htmlFor="email">Email *</Label><Input id="email" type="email" value={novoUsuario.email} onChange={(e) => setNovoUsuario({ ...novoUsuario, email: e.target.value })} placeholder="usuario@escola.com" /></div>
                      <div className="space-y-2"><Label htmlFor="senha">Senha *</Label><Input id="senha" type="password" value={novoUsuario.senha} onChange={(e) => setNovoUsuario({ ...novoUsuario, senha: e.target.value })} placeholder="Digite a senha" /></div>
                      <div className="space-y-2"><Label htmlFor="tipo">Tipo de Usuário *</Label><Select value={novoUsuario.tipo_usuario} onValueChange={(value: any) => setNovoUsuario({ ...novoUsuario, tipo_usuario: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="aluno">Aluno</SelectItem><SelectItem value="professor">Professor</SelectItem><SelectItem value="admin">Administrador</SelectItem></SelectContent></Select></div>
                    </div>
                    <Button onClick={handleCadastrarUsuario} className="w-full" disabled={isCreatingUser}>{isCreatingUser ? (<Loader2 className="w-4 h-4 mr-2 animate-spin" />) : (<UserPlus className="w-4 h-4 mr-2" />)}Cadastrar Usuário</Button>
                  </CardContent>
                </Card>
                <div><h3 className="mb-4">Usuários Cadastrados</h3>{renderUserList()}</div>
              </TabsContent>
              <TabsContent value="turmas-series"><GerenciarTurmasSeries /></TabsContent>
              <TabsContent value="professores-turmas"><GerenciarProfessoresTurmas /></TabsContent>
              <TabsContent value="materias" className="space-y-6">
                <Card className="bg-muted"><CardHeader><CardTitle className="text-lg">Cadastrar Nova Matéria</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2"><Label htmlFor="nome-materia">Nome da Matéria *</Label><Input id="nome-materia" value={novaMateria.nome_materia} onChange={(e) => setNovaMateria({ ...novaMateria, nome_materia: e.target.value })} placeholder="Ex: Matemática" /></div>
                    <Button onClick={handleCadastrarMateria} className="w-full" disabled={isCreatingMateria}>{isCreatingMateria ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BookOpen className="w-4 h-4 mr-2" />}Cadastrar Matéria</Button>
                  </CardContent>
                </Card>
                <div>
                  <h3 className="mb-4">Matérias Cadastradas</h3>
                  {isLoadingMaterias ? (<div className="flex justify-center items-center py-10"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {materias.map((materia) => (
                        <Card key={materia.id_materia}><CardHeader><div className="flex items-center justify-between"><CardTitle>{materia.nome_materia}</CardTitle><BookOpen className="w-6 h-6 text-primary" /></div></CardHeader>
                          <CardContent><div className="flex gap-2"><Button variant="outline" size="sm" className="flex-1" disabled><Edit className="w-4 h-4" /></Button><Button variant="outline" size="sm" className="flex-1" disabled><Trash2 className="w-4 h-4" /></Button></div></CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
               <TabsContent value="relatorios"><div className="text-center py-12"><BarChart3 className="w-16 h-16 mx-auto text-muted-foreground mb-4" /><h3 className="mb-2">Relatórios em Desenvolvimento</h3><p className="text-muted-foreground">Em breve você poderá visualizar relatórios detalhados.</p></div></TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </main>
    </div>
  );
}