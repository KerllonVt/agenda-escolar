import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { BookCheck, Save, Eye } from 'lucide-react';
import { NotaAvaliacao, TipoAvaliacao } from '../types';
import { toast } from 'sonner@2.0.3';

export default function LancarNotas() {
  const professorId = 10;

  const turmasMaterias = [
    { id_turma: 1, nome_turma: '9° A', id_materia: 1, nome_materia: 'Matemática' },
    { id_turma: 2, nome_turma: '9° B', id_materia: 2, nome_materia: 'Português' },
  ];

  const alunos = [
    { id_aluno: 1, nome: 'João Silva', id_turma: 1 },
    { id_aluno: 2, nome: 'Maria Santos', id_turma: 1 },
    { id_aluno: 3, nome: 'Carlos Oliveira', id_turma: 1 },
    { id_aluno: 4, nome: 'Ana Costa', id_turma: 2 },
    { id_aluno: 5, nome: 'Pedro Alves', id_turma: 2 },
  ];

  // Configurações de avaliação disponíveis
  const configuracoes = [
    { id_turma: 1, id_materia: 1, unidade: 1, tipo_avaliacao: 'prova' as TipoAvaliacao, peso: 40 },
    { id_turma: 1, id_materia: 1, unidade: 1, tipo_avaliacao: 'atividade' as TipoAvaliacao, peso: 30 },
    { id_turma: 1, id_materia: 1, unidade: 1, tipo_avaliacao: 'trabalho' as TipoAvaliacao, peso: 30 },
    { id_turma: 2, id_materia: 2, unidade: 1, tipo_avaliacao: 'prova' as TipoAvaliacao, peso: 50 },
    { id_turma: 2, id_materia: 2, unidade: 1, tipo_avaliacao: 'caderno' as TipoAvaliacao, peso: 50 },
  ];

  const [notas, setNotas] = useState<NotaAvaliacao[]>([
    { id_nota: 1, id_aluno: 1, id_professor: 10, id_turma: 1, id_materia: 1, unidade: 1, tipo_avaliacao: 'prova', nota: 8.5, data_lancamento: '2025-03-10', observacao: '' },
    { id_nota: 2, id_aluno: 2, id_professor: 10, id_turma: 1, id_materia: 1, unidade: 1, tipo_avaliacao: 'prova', nota: 9.0, data_lancamento: '2025-03-10', observacao: '' },
  ]);

  const [filtros, setFiltros] = useState({
    id_turma: 1,
    id_materia: 1,
    unidade: 1,
    tipo_avaliacao: 'prova' as TipoAvaliacao,
  });

  const [notasTemporarias, setNotasTemporarias] = useState<{ [key: number]: { nota: string; observacao: string } }>({});

  const tiposLabel: { [key in TipoAvaliacao]: string } = {
    prova: 'Prova',
    teste: 'Teste',
    trabalho: 'Trabalho',
    atividade: 'Atividade',
    caderno: 'Caderno',
    outro: 'Outro',
  };

  const getTiposDisponiveis = () => {
    return configuracoes
      .filter(c => c.id_turma === filtros.id_turma && c.id_materia === filtros.id_materia && c.unidade === filtros.unidade)
      .map(c => c.tipo_avaliacao);
  };

  const alunosDaTurma = alunos.filter(a => a.id_turma === filtros.id_turma);

  const getNotaAluno = (alunoId: number) => {
    return notas.find(
      n => n.id_aluno === alunoId &&
           n.id_turma === filtros.id_turma &&
           n.id_materia === filtros.id_materia &&
           n.unidade === filtros.unidade &&
           n.tipo_avaliacao === filtros.tipo_avaliacao
    );
  };

  const handleSetNotaTemporaria = (alunoId: number, nota: string, observacao?: string) => {
    setNotasTemporarias({
      ...notasTemporarias,
      [alunoId]: {
        nota,
        observacao: observacao !== undefined ? observacao : (notasTemporarias[alunoId]?.observacao || ''),
      },
    });
  };

  const handleSalvarNota = (alunoId: number) => {
    const temp = notasTemporarias[alunoId];
    if (!temp || !temp.nota) {
      toast.error('Digite uma nota válida');
      return;
    }

    const notaValor = parseFloat(temp.nota);
    if (isNaN(notaValor) || notaValor < 0 || notaValor > 10) {
      toast.error('Nota deve estar entre 0 e 10');
      return;
    }

    const notaExistente = getNotaAluno(alunoId);

    if (notaExistente) {
      // Atualizar nota existente
      setNotas(notas.map(n =>
        n.id_nota === notaExistente.id_nota
          ? { ...n, nota: notaValor, observacao: temp.observacao, data_lancamento: new Date().toISOString().split('T')[0] }
          : n
      ));
      toast.success('Nota atualizada com sucesso!');
    } else {
      // Criar nova nota
      const novaNota: NotaAvaliacao = {
        id_nota: notas.length + 1,
        id_aluno: alunoId,
        id_professor: professorId,
        id_turma: filtros.id_turma,
        id_materia: filtros.id_materia,
        unidade: filtros.unidade,
        tipo_avaliacao: filtros.tipo_avaliacao,
        nota: notaValor,
        data_lancamento: new Date().toISOString().split('T')[0],
        observacao: temp.observacao,
      };
      setNotas([...notas, novaNota]);
      toast.success('Nota lançada com sucesso!');
    }

    // Limpar temporária
    const newTemp = { ...notasTemporarias };
    delete newTemp[alunoId];
    setNotasTemporarias(newTemp);
  };

  const calcularMediaAluno = (alunoId: number) => {
    const notasAluno = notas.filter(
      n => n.id_aluno === alunoId &&
           n.id_turma === filtros.id_turma &&
           n.id_materia === filtros.id_materia &&
           n.unidade === filtros.unidade
    );

    if (notasAluno.length === 0) return null;

    const configs = configuracoes.filter(
      c => c.id_turma === filtros.id_turma &&
           c.id_materia === filtros.id_materia &&
           c.unidade === filtros.unidade
    );

    let somaPonderada = 0;
    let somaPesos = 0;

    notasAluno.forEach(nota => {
      const config = configs.find(c => c.tipo_avaliacao === nota.tipo_avaliacao);
      if (config) {
        somaPonderada += nota.nota * (config.peso / 100);
        somaPesos += config.peso / 100;
      }
    });

    return somaPesos > 0 ? somaPonderada / somaPesos : null;
  };

  const tiposDisponiveis = getTiposDisponiveis();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookCheck className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle>Lançar Notas</CardTitle>
              <CardDescription>Registre as notas dos alunos por tipo de avaliação</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <Label>Turma e Matéria</Label>
              <Select
                value={`${filtros.id_turma}-${filtros.id_materia}`}
                onValueChange={(value) => {
                  const [turmaId, materiaId] = value.split('-').map(Number);
                  setFiltros({ ...filtros, id_turma: turmaId, id_materia: materiaId });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {turmasMaterias.map((tm) => (
                    <SelectItem key={`${tm.id_turma}-${tm.id_materia}`} value={`${tm.id_turma}-${tm.id_materia}`}>
                      {tm.nome_turma} - {tm.nome_materia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Unidade</Label>
              <Select
                value={filtros.unidade.toString()}
                onValueChange={(value) => setFiltros({ ...filtros, unidade: Number(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1ª Unidade</SelectItem>
                  <SelectItem value="2">2ª Unidade</SelectItem>
                  <SelectItem value="3">3ª Unidade</SelectItem>
                  <SelectItem value="4">4ª Unidade</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo de Avaliação</Label>
              <Select
                value={filtros.tipo_avaliacao}
                onValueChange={(value: TipoAvaliacao) => setFiltros({ ...filtros, tipo_avaliacao: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tiposDisponiveis.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {tiposLabel[tipo]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabela de Lançamento */}
          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Nota (0-10)</TableHead>
                  <TableHead>Observação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alunosDaTurma.map((aluno) => {
                  const notaExistente = getNotaAluno(aluno.id_aluno);
                  const notaTemp = notasTemporarias[aluno.id_aluno];
                  const valorAtual = notaTemp?.nota || notaExistente?.nota?.toString() || '';
                  const obsAtual = notaTemp?.observacao || notaExistente?.observacao || '';

                  return (
                    <TableRow key={aluno.id_aluno}>
                      <TableCell>{aluno.nome}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="10"
                          placeholder="0.0"
                          className="w-24"
                          value={valorAtual}
                          onChange={(e) => handleSetNotaTemporaria(aluno.id_aluno, e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Opcional"
                          value={obsAtual}
                          onChange={(e) => handleSetNotaTemporaria(aluno.id_aluno, valorAtual, e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        {notaExistente ? (
                          <Badge variant="default">Lançada</Badge>
                        ) : (
                          <Badge variant="secondary">Pendente</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleSalvarNota(aluno.id_aluno)}
                          disabled={!notaTemp?.nota}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Salvar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Médias Parciais */}
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-base">Médias Parciais da Unidade</CardTitle>
              <CardDescription>Baseadas nas notas lançadas até o momento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {alunosDaTurma.map((aluno) => {
                  const media = calcularMediaAluno(aluno.id_aluno);
                  return (
                    <div key={aluno.id_aluno} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                      <span className="text-sm">{aluno.nome}</span>
                      {media !== null ? (
                        <Badge variant={media >= 7 ? "default" : media >= 5 ? "secondary" : "destructive"}>
                          {media.toFixed(2)}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Sem notas</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
