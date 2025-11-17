// src/components/GerenciarProfessoresTurmas.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { UserCheck, Plus, Trash2, BookOpen, Loader2, Search, Edit } from 'lucide-react';
import { Input } from './ui/input'; // <-- 1. 'Input' ADICIONADO AQUI
import { ProfessorTurmaMateria, Usuario, Turma, Materia } from '../types';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

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

type VinculoCompleto = ProfessorTurmaMateria & {
  nome_professor: string;
  nome_turma: string;
  serie: string;
  nome_materia: string;
};

export default function GerenciarProfessoresTurmas() {
  const { token } = useAuth();
  
  const [professores, setProfessores] = useState<Usuario[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [vinculos, setVinculos] = useState<VinculoCompleto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [searchVinculo, setSearchVinculo] = useState('');
  const debouncedSearchVinculo = useDebounce(searchVinculo, 300);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [editandoVinculo, setEditandoVinculo] = useState<VinculoCompleto | null>(null);
  const [formVinculo, setFormVinculo] = useState({
    id_professor: '',
    id_turma: '',
    id_materia: '',
  });

  // --- API: Carregar dados (com pesquisa) ---
  const carregarDados = async (searchTerm = '') => {
    setIsLoading(true);
    try {
      const [profRes, turmasRes, materiasRes, vinculosRes] = await Promise.all([
        fetch(`${API_URL}/users?tipo=professor`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/turmas`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/materias`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(searchTerm ? `${API_URL}/vinculos?search=${searchTerm}` : `${API_URL}/vinculos`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      if (!profRes.ok) throw new Error('Falha ao buscar professores');
      if (!turmasRes.ok) throw new Error('Falha ao buscar turmas');
      if (!materiasRes.ok) throw new Error('Falha ao buscar matérias');
      if (!vinculosRes.ok) throw new Error('Falha ao buscar vínculos');

      setProfessores(await profRes.json());
      setTurmas(await turmasRes.json());
      setMaterias(await materiasRes.json());
      setVinculos(await vinculosRes.json());
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if(token) carregarDados(debouncedSearchVinculo);
  }, [token, debouncedSearchVinculo]);
  
  const handleOpenDialog = (vinculo: VinculoCompleto | null) => {
    if (vinculo) {
      setEditandoVinculo(vinculo);
      setFormVinculo({
        id_professor: vinculo.id_professor.toString(),
        id_turma: vinculo.id_turma.toString(),
        id_materia: vinculo.id_materia.toString(),
      });
    } else {
      setEditandoVinculo(null);
      setFormVinculo({ id_professor: '', id_turma: '', id_materia: '' });
    }
    setDialogAberto(true);
  };
  
  const handleSalvarVinculo = async () => {
    if (!formVinculo.id_professor || !formVinculo.id_turma || !formVinculo.id_materia) {
      toast.error('Selecione professor, turma e matéria');
      return;
    }
    
    setIsSubmitting(true);
    const url = editandoVinculo ? `${API_URL}/vinculos/${editandoVinculo.id_ptm}` : `${API_URL}/vinculos`;
    const method = editandoVinculo ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          id_professor: Number(formVinculo.id_professor),
          id_turma: Number(formVinculo.id_turma),
          id_materia: Number(formVinculo.id_materia),
        })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      toast.success(editandoVinculo ? 'Vínculo atualizado!' : 'Vínculo criado!');
      if (editandoVinculo) {
        setVinculos(vinculos.map(v => v.id_ptm === data.id_ptm ? data : v));
      } else {
        setVinculos([...vinculos, data]);
      }
      setDialogAberto(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExcluirVinculo = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja remover este vínculo?')) return;
    try {
      const response = await fetch(`${API_URL}/vinculos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      toast.success('Vínculo removido com sucesso!');
      setVinculos(vinculos.filter(v => v.id_ptm !== id)); 
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getVinculosPorProfessor = (professorId: number) => {
    return vinculos.filter(v => v.id_professor === professorId);
  };

  return (
    <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
      <div className="space-y-6">
        {/* Criar/Editar Vínculos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-blue-600" />
                <div>
                  <CardTitle>Vincular Professores a Turmas</CardTitle>
                  <CardDescription>Defina quais turmas e matérias cada professor leciona</CardDescription>
                </div>
              </div>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Vínculo
                </Button>
              </DialogTrigger>
            </div>
            <div className="relative w-full max-w-sm mt-4">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Pesquisar por professor, turma ou matéria..." 
                className="pl-9"
                value={searchVinculo}
                // 2. TIPO ADICIONADO
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchVinculo(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (<div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin" /></div>) : (
              <Table>
                <TableHeader><TableRow><TableHead>Professor</TableHead><TableHead>Turma</TableHead><TableHead>Matéria</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                <TableBody>
                  {vinculos.map((vinculo) => (
                    <TableRow key={vinculo.id_ptm}>
                      <TableCell>{vinculo.nome_professor}</TableCell>
                      <TableCell><Badge variant="outline">{vinculo.nome_turma} - {vinculo.serie}</Badge></TableCell>
                      <TableCell><Badge>{vinculo.nome_materia}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(vinculo)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <Button variant="ghost" size="sm" onClick={() => handleExcluirVinculo(vinculo.id_ptm)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Resumo por Professor */}
        <Card>
          <CardHeader><div className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-green-600" /><div><CardTitle>Resumo por Professor</CardTitle><CardDescription>Visualize todas as turmas e matérias de cada professor</CardDescription></div></div></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {professores.map((professor) => {
                const vinculosProfessor = getVinculosPorProfessor(professor.id_usuario);
                return (
                  <div key={professor.id_usuario} className="border rounded-lg p-4">
                    <div className="mb-3"><p className="text-muted-foreground">{professor.nome_completo}</p></div>
                    {vinculosProfessor.length === 0 ? (<p className="text-sm text-muted-foreground">Nenhuma turma vinculada</p>) : (
                      <div className="flex flex-wrap gap-2">
                        {vinculosProfessor.map((vinculo) => (
                          <Badge key={vinculo.id_ptm} variant="secondary" className="text-sm">
                            {vinculo.nome_turma} - {vinculo.nome_materia}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        
        {/* Modal de Criar/Editar Vínculo */}
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editandoVinculo ? 'Editar Vínculo' : 'Novo Vínculo'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {/* 3. TIPOS ADICIONADOS */}
            <div><Label htmlFor="professor">Professor</Label><Select value={formVinculo.id_professor} onValueChange={(value: string) => setFormVinculo({ ...formVinculo, id_professor: value })}><SelectTrigger id="professor"><SelectValue placeholder="Selecione um professor" /></SelectTrigger><SelectContent>{professores.map((prof) => (<SelectItem key={prof.id_usuario} value={prof.id_usuario.toString()}>{prof.nome_completo}</SelectItem>))}</SelectContent></Select></div>
            <div><Label htmlFor="turma">Turma</Label><Select value={formVinculo.id_turma} onValueChange={(value: string) => setFormVinculo({ ...formVinculo, id_turma: value })}><SelectTrigger id="turma"><SelectValue placeholder="Selecione uma turma" /></SelectTrigger><SelectContent>{turmas.map((turma) => (<SelectItem key={turma.id_turma} value={turma.id_turma.toString()}>{turma.nome_turma} - {turma.serie} ({turma.turno})</SelectItem>))}</SelectContent></Select></div>
            <div><Label htmlFor="materia">Matéria</Label><Select value={formVinculo.id_materia} onValueChange={(value: string) => setFormVinculo({ ...formVinculo, id_materia: value })}><SelectTrigger id="materia"><SelectValue placeholder="Selecione uma matéria" /></SelectTrigger><SelectContent>{materias.map((materia) => (<SelectItem key={materia.id_materia} value={materia.id_materia.toString()}>{materia.nome_materia}</SelectItem>))}</SelectContent></Select></div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDialogAberto(false)}>Cancelar</Button>
              <Button onClick={handleSalvarVinculo} disabled={isSubmitting}>{isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Salvar'}</Button>
            </div>
          </div>
        </DialogContent>
      </div>
    </Dialog>
  );
}