// src/components/GerenciarProfessoresTurmas.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { UserCheck, Plus, Trash2, BookOpen, Loader2 } from 'lucide-react';
import { ProfessorTurmaMateria, Usuario, Turma, Materia } from '../types';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

const API_URL =  '/api';

// Tipo para o vínculo com dados completos (vindos do JOIN no backend)
type VinculoCompleto = ProfessorTurmaMateria & {
  nome_professor: string;
  nome_turma: string;
  serie: string;
  nome_materia: string;
};

export default function GerenciarProfessoresTurmas() {
  const { token } = useAuth();
  
  // Estados da API
  const [professores, setProfessores] = useState<Usuario[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [vinculos, setVinculos] = useState<VinculoCompleto[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Estados do Formulário
  const [dialogAberto, setDialogAberto] = useState(false);
  const [novoVinculo, setNovoVinculo] = useState({
    id_professor: 0,
    id_turma: 0,
    id_materia: 0,
  });

  // --- FUNÇÕES DE API ---

  // Função para carregar TODOS os dados iniciais
  const carregarDados = async () => {
    setIsLoading(true);
    try {
      // Usamos Promise.all para carregar tudo em paralelo
      const [profRes, turmasRes, materiasRes, vinculosRes] = await Promise.all([
        // 1. Buscar Professores
        fetch(`${API_URL}/users?tipo=professor`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        // 2. Buscar Turmas
        fetch(`${API_URL}/turmas`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        // 3. Buscar Matérias
        fetch(`${API_URL}/materias`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        // 4. Buscar Vínculos
        fetch(`${API_URL}/vinculos`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!profRes.ok) throw new Error('Falha ao buscar professores');
      if (!turmasRes.ok) throw new Error('Falha ao buscar turmas');
      if (!materiasRes.ok) throw new Error('Falha ao buscar matérias');
      if (!vinculosRes.ok) throw new Error('Falha ao buscar vínculos');

      const profData = await profRes.json();
      const turmasData = await turmasRes.json();
      const materiasData = await materiasRes.json();
      const vinculosData = await vinculosRes.json();

      setProfessores(profData);
      setTurmas(turmasData);
      setMaterias(materiasData);
      setVinculos(vinculosData);

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar dados quando o componente montar
  useEffect(() => {
    carregarDados();
  }, [token]);

  // Criar Vínculo
  const handleCriarVinculo = async () => {
    if (!novoVinculo.id_professor || !novoVinculo.id_turma || !novoVinculo.id_materia) {
      toast.error('Selecione professor, turma e matéria');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/vinculos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(novoVinculo)
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      toast.success('Vínculo criado com sucesso!');
      setVinculos([...vinculos, data]); // Adiciona o novo vínculo (já com nomes) à lista
      setNovoVinculo({ id_professor: 0, id_turma: 0, id_materia: 0 }); // Limpa form
      setDialogAberto(false);

    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Excluir Vínculo
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
      setVinculos(vinculos.filter(v => v.id_ptm !== id)); // Remove da lista

    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Resumo por Professor
  const getVinculosPorProfessor = (professorId: number) => {
    return vinculos.filter(v => v.id_professor === professorId);
  };

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="ml-2 text-muted-foreground">Carregando dados de gestão...</p>
        </div>
      ) : (
        <>
          {/* Criar Vínculos */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-blue-600" />
                  <div>
                    <CardTitle>Vincular Professores a Turmas e Matérias</CardTitle>
                    <CardDescription>Defina quais turmas e matérias cada professor leciona</CardDescription>
                  </div>
                </div>
                <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Vínculo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Criar Vínculo Professor-Turma-Matéria</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="professor">Professor</Label>
                        <Select
                          value={novoVinculo.id_professor.toString()}
                          onValueChange={(value: string) => setNovoVinculo({ ...novoVinculo, id_professor: Number(value) })}
                        >
                          <SelectTrigger id="professor">
                            <SelectValue placeholder="Selecione um professor" />
                          </SelectTrigger>
                          <SelectContent>
                            {professores.map((prof) => (
                              <SelectItem key={prof.id_usuario} value={prof.id_usuario.toString()}>
                                {prof.nome_completo}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="turma">Turma</Label>
                        <Select
                          value={novoVinculo.id_turma.toString()}
                          onValueChange={(value: string) => setNovoVinculo({ ...novoVinculo, id_turma: Number(value) })}
                        >
                          <SelectTrigger id="turma">
                            <SelectValue placeholder="Selecione uma turma" />
                          </SelectTrigger>
                          <SelectContent>
                            {turmas.map((turma) => (
                              <SelectItem key={turma.id_turma} value={turma.id_turma.toString()}>
                                {turma.nome_turma} - {turma.serie} ({turma.turno})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="materia">Matéria</Label>
                        <Select
                          value={novoVinculo.id_materia.toString()}
                          onValueChange={(value: string) => setNovoVinculo({ ...novoVinculo, id_materia: Number(value) })}
                        >
                          <SelectTrigger id="materia">
                            <SelectValue placeholder="Selecione uma matéria" />
                          </SelectTrigger>
                          <SelectContent>
                            {materias.map((materia) => (
                              <SelectItem key={materia.id_materia} value={materia.id_materia.toString()}>
                                {materia.nome_materia}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setDialogAberto(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleCriarVinculo}>
                          Criar Vínculo
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Professor</TableHead>
                    <TableHead>Turma</TableHead>
                    <TableHead>Matéria</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vinculos.map((vinculo) => (
                    <TableRow key={vinculo.id_ptm}>
                      <TableCell>{vinculo.nome_professor}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{vinculo.nome_turma} - {vinculo.serie}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge>{vinculo.nome_materia}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExcluirVinculo(vinculo.id_ptm)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Resumo por Professor */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-green-600" />
                <div>
                  <CardTitle>Resumo por Professor</CardTitle>
                  <CardDescription>Visualize todas as turmas e matérias de cada professor</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {professores.map((professor) => {
                  const vinculosProfessor = getVinculosPorProfessor(professor.id_usuario);
                  return (
                    <div key={professor.id_usuario} className="border rounded-lg p-4">
                      <div className="mb-3">
                        <p className="text-muted-foreground">{professor.nome_completo}</p>
                      </div>
                      {vinculosProfessor.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhuma turma vinculada</p>
                      ) : (
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
        </>
      )}
    </div>
  );
}