// src/components/GerenciarTurmasSeries.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Users, Plus, Pencil, Trash2, GraduationCap, Loader2 } from 'lucide-react';
import { Turma, Usuario } from '../types';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

// URL da nossa API (configurada para Vercel)
const API_URL = '/api';

type TurmaComAlunos = Turma & {
  total_alunos: string | number;
};

export default function GerenciarTurmasSeries() {
  const { token } = useAuth();

  const [turmas, setTurmas] = useState<TurmaComAlunos[]>([]);
  const [alunos, setAlunos] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [dialogAberto, setDialogAberto] = useState(false);
  const [turmaEditando, setTurmaEditando] = useState<Turma | null>(null);
  const [novaTurma, setNovaTurma] = useState({
    nome_turma: '',
    serie: '',
    ano: '2025',
    turno: 'Matutino' as 'Matutino' | 'Vespertino' | 'Noturno',
  });

  // --- FUNÇÕES DE API ---
  const fetchTurmas = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/turmas`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Falha ao buscar turmas.');
      const data: TurmaComAlunos[] = await response.json();
      setTurmas(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAlunos = async () => {
    try {
      const response = await fetch(`${API_URL}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Falha ao buscar alunos.');
      const data: Usuario[] = await response.json();
      setAlunos(data.filter(u => u.tipo_usuario === 'aluno'));
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchTurmas();
    fetchAlunos();
  }, [token]);

  const handleSalvarTurma = async () => {
    if (!novaTurma.nome_turma || !novaTurma.serie) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const url = turmaEditando 
      ? `${API_URL}/turmas/${turmaEditando.id_turma}` 
      : `${API_URL}/turmas`;
      
    const method = turmaEditando ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(novaTurma)
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      toast.success(turmaEditando ? 'Turma atualizada!' : 'Turma criada!');
      setDialogAberto(false);
      fetchTurmas(); 
      
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleExcluirTurma = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta turma?')) return;

    try {
      const response = await fetch(`${API_URL}/turmas/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      toast.success(data.message);
      fetchTurmas(); 
      fetchAlunos(); 

    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAlocarAluno = async (alunoId: number, turmaId: number | null) => {
    try {
      const response = await fetch(`${API_URL}/users/alocar-turma`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id_aluno: alunoId, id_turma: turmaId })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      toast.success('Aluno alocado com sucesso!');
      setAlunos(alunos.map(a => 
        a.id_usuario === alunoId 
          ? { ...a, id_turma: turmaId ?? undefined } 
          : a
      ));
      fetchTurmas(); 
      
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // --- Funções Auxiliares do Modal ---
  const abrirDialogNovaTurma = () => {
    setTurmaEditando(null);
    setNovaTurma({ nome_turma: '', serie: '', ano: '2025', turno: 'Matutino' });
    setDialogAberto(true);
  };

  const abrirDialogEditar = (turma: Turma) => {
    setTurmaEditando(turma);
    setNovaTurma({
      nome_turma: turma.nome_turma,
      serie: turma.serie,
      ano: turma.ano,
      turno: turma.turno as 'Matutino' | 'Vespertino' | 'Noturno',
    });
    setDialogAberto(true);
  };

  const getTurmaNome = (id: number | null | undefined) => {
    if (!id) return 'Sem turma';
    const turma = turmas.find(t => t.id_turma === id);
    return turma ? turma.nome_turma : 'Desconhecida';
  };

  return (
    <div className="space-y-6">
      {/* Gerenciar Turmas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              <div>
                <CardTitle>Gerenciar Turmas e Séries</CardTitle>
                <CardDescription>Crie e organize as turmas da escola</CardDescription>
              </div>
            </div>
            <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
              <DialogTrigger asChild>
                <Button onClick={abrirDialogNovaTurma}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Turma
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {turmaEditando ? 'Editar Turma' : 'Nova Turma'}
                  </DialogTitle>
                  <DialogDescription>
                    Preencha os dados da turma
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nome_turma">Nome da Turma *</Label>
                    <Input
                      id="nome_turma"
                      placeholder="Ex: 9° A, 1° B EM"
                      value={novaTurma.nome_turma}
                      onChange={(e) => setNovaTurma({ ...novaTurma, nome_turma: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="serie">Série *</Label>
                    <Input
                      id="serie"
                      placeholder="Ex: 9° Ano, 1° Ano Ensino Médio"
                      value={novaTurma.serie}
                      onChange={(e) => setNovaTurma({ ...novaTurma, serie: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ano">Ano Letivo</Label>
                    <Input
                      id="ano"
                      placeholder="2025"
                      value={novaTurma.ano}
                      onChange={(e) => setNovaTurma({ ...novaTurma, ano: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="turno">Turno</Label>
                    <Select
                      value={novaTurma.turno}
                      onValueChange={(value: any) => setNovaTurma({ ...novaTurma, turno: value })}
                    >
                      <SelectTrigger id="turno">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Matutino">Matutino</SelectItem>
                        <SelectItem value="Vespertino">Vespertino</SelectItem>
                        <SelectItem value="Noturno">Noturno</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setDialogAberto(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSalvarTurma}>
                      {turmaEditando ? 'Salvar' : 'Criar Turma'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Turma</TableHead>
                  <TableHead>Série</TableHead>
                  <TableHead>Ano Letivo</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead>Alunos</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {turmas.map((turma) => (
                  <TableRow key={turma.id_turma}>
                    <TableCell>{turma.nome_turma}</TableCell>
                    <TableCell>{turma.serie}</TableCell>
                    <TableCell>{turma.ano}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{turma.turno}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge>{turma.total_alunos} alunos</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => abrirDialogEditar(turma)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExcluirTurma(turma.id_turma)}
                        >
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

      {/* Alocar Alunos */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            <div>
              <CardTitle>Alocar Alunos nas Turmas</CardTitle>
              <CardDescription>Defina a turma de cada aluno</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Aluno</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Turma Atual</TableHead>
                <TableHead>Alocar para Turma</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alunos.map((aluno) => (
                <TableRow key={aluno.id_usuario}>
                  <TableCell>{aluno.nome_completo}</TableCell>
                  <TableCell className="text-muted-foreground">{aluno.email}</TableCell>
                  <TableCell>
                    <Badge variant={aluno.id_turma ? "default" : "secondary"}>
                      {getTurmaNome(aluno.id_turma)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={aluno.id_turma?.toString() || 'sem-turma'}
                      onValueChange={(value: string) => 
                        handleAlocarAluno(aluno.id_usuario, value === 'sem-turma' ? null : Number(value))
                      }
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sem-turma">Sem turma</SelectItem>
                        {turmas.map((turma) => (
                          <SelectItem key={turma.id_turma} value={turma.id_turma.toString()}>
                            {turma.nome_turma} - {turma.serie}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}