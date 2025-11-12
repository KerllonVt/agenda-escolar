import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Progress } from './ui/progress';
import { ClipboardList, TrendingUp, Award, AlertCircle } from 'lucide-react';
import { NotaAvaliacao, TipoAvaliacao } from '../types';
import { Alert, AlertDescription } from './ui/alert';

export default function BoletimAluno() {
  const alunoId = 1; // Mock: aluno logado
  const alunoTurma = 1; // 9° A

  const materias = [
    { id_materia: 1, nome_materia: 'Matemática' },
    { id_materia: 2, nome_materia: 'Português' },
    { id_materia: 3, nome_materia: 'Geografia' },
    { id_materia: 4, nome_materia: 'História' },
  ];

  // Configurações de avaliação dos professores
  const configuracoes = [
    { id_materia: 1, unidade: 1, tipo_avaliacao: 'prova' as TipoAvaliacao, peso: 40 },
    { id_materia: 1, unidade: 1, tipo_avaliacao: 'atividade' as TipoAvaliacao, peso: 30 },
    { id_materia: 1, unidade: 1, tipo_avaliacao: 'trabalho' as TipoAvaliacao, peso: 30 },
    { id_materia: 2, unidade: 1, tipo_avaliacao: 'prova' as TipoAvaliacao, peso: 50 },
    { id_materia: 2, unidade: 1, tipo_avaliacao: 'caderno' as TipoAvaliacao, peso: 50 },
    { id_materia: 3, unidade: 1, tipo_avaliacao: 'prova' as TipoAvaliacao, peso: 60 },
    { id_materia: 3, unidade: 1, tipo_avaliacao: 'trabalho' as TipoAvaliacao, peso: 40 },
  ];

  const [notas] = useState<NotaAvaliacao[]>([
    // Matemática - 1ª Unidade
    { id_nota: 1, id_aluno: 1, id_professor: 10, id_turma: 1, id_materia: 1, unidade: 1, tipo_avaliacao: 'prova', nota: 8.5, data_lancamento: '2025-03-10', observacao: 'Bom desempenho!' },
    { id_nota: 2, id_aluno: 1, id_professor: 10, id_turma: 1, id_materia: 1, unidade: 1, tipo_avaliacao: 'atividade', nota: 9.0, data_lancamento: '2025-03-12', observacao: '' },
    { id_nota: 3, id_aluno: 1, id_professor: 10, id_turma: 1, id_materia: 1, unidade: 1, tipo_avaliacao: 'trabalho', nota: 7.5, data_lancamento: '2025-03-15', observacao: '' },
    // Português - 1ª Unidade
    { id_nota: 4, id_aluno: 1, id_professor: 11, id_turma: 1, id_materia: 2, unidade: 1, tipo_avaliacao: 'prova', nota: 7.0, data_lancamento: '2025-03-11', observacao: 'Revisar concordância verbal' },
    { id_nota: 5, id_aluno: 1, id_professor: 11, id_turma: 1, id_materia: 2, unidade: 1, tipo_avaliacao: 'caderno', nota: 9.5, data_lancamento: '2025-03-14', observacao: 'Caderno completo e organizado!' },
    // Geografia - 1ª Unidade
    { id_nota: 6, id_aluno: 1, id_professor: 12, id_turma: 1, id_materia: 3, unidade: 1, tipo_avaliacao: 'prova', nota: 6.5, data_lancamento: '2025-03-13', observacao: '' },
  ]);

  const [unidadeSelecionada, setUnidadeSelecionada] = useState(1);

  const tiposLabel: { [key in TipoAvaliacao]: string } = {
    prova: 'Prova',
    teste: 'Teste',
    trabalho: 'Trabalho',
    atividade: 'Atividade',
    caderno: 'Caderno',
    outro: 'Outro',
  };

  const calcularMediaMateria = (materiaId: number, unidade: number) => {
    const notasMateria = notas.filter(
      n => n.id_aluno === alunoId && n.id_materia === materiaId && n.unidade === unidade
    );

    if (notasMateria.length === 0) return null;

    const configsMateria = configuracoes.filter(
      c => c.id_materia === materiaId && c.unidade === unidade
    );

    let somaPonderada = 0;
    let somaPesos = 0;

    notasMateria.forEach(nota => {
      const config = configsMateria.find(c => c.tipo_avaliacao === nota.tipo_avaliacao);
      if (config) {
        somaPonderada += nota.nota * (config.peso / 100);
        somaPesos += config.peso / 100;
      }
    });

    return somaPesos > 0 ? somaPonderada / somaPesos : null;
  };

  const calcularMediaGeral = (materiaId: number) => {
    const medias = [1, 2, 3, 4].map(u => calcularMediaMateria(materiaId, u)).filter(m => m !== null) as number[];
    if (medias.length === 0) return null;
    return medias.reduce((sum, m) => sum + m, 0) / medias.length;
  };

  const getNotasMateria = (materiaId: number) => {
    return notas.filter(
      n => n.id_aluno === alunoId && n.id_materia === materiaId && n.unidade === unidadeSelecionada
    );
  };

  const getConfigsMateria = (materiaId: number) => {
    return configuracoes.filter(
      c => c.id_materia === materiaId && c.unidade === unidadeSelecionada
    );
  };

  const getCorMedia = (media: number) => {
    if (media >= 9) return 'bg-green-500';
    if (media >= 7) return 'bg-blue-500';
    if (media >= 5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const mediaGeralTodasMaterias = () => {
    const medias = materias.map(m => calcularMediaGeral(m.id_materia)).filter(m => m !== null) as number[];
    if (medias.length === 0) return null;
    return medias.reduce((sum, m) => sum + m, 0) / medias.length;
  };

  const mediaGeral = mediaGeralTodasMaterias();

  return (
    <div className="space-y-6">
      {/* Cabeçalho com Média Geral */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-blue-600" />
              <CardTitle>Meu Boletim Escolar</CardTitle>
            </div>
            <CardDescription>Acompanhe suas notas e médias por matéria e unidade</CardDescription>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-base">Média Geral</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {mediaGeral !== null ? (
              <div className="text-center">
                <div className="text-4xl mb-2">{mediaGeral.toFixed(2)}</div>
                <Progress value={mediaGeral * 10} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {mediaGeral >= 7 ? 'Excelente!' : mediaGeral >= 5 ? 'Bom!' : 'Precisa melhorar'}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center">Sem notas lançadas</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Seletor de Unidade */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <p>Selecionar Unidade:</p>
            <Select
              value={unidadeSelecionada.toString()}
              onValueChange={(value) => setUnidadeSelecionada(Number(value))}
            >
              <SelectTrigger className="w-[200px]">
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
        </CardContent>
      </Card>

      {/* Notas por Matéria */}
      {materias.map((materia) => {
        const notasMateria = getNotasMateria(materia.id_materia);
        const configsMateria = getConfigsMateria(materia.id_materia);
        const mediaUnidade = calcularMediaMateria(materia.id_materia, unidadeSelecionada);
        const mediaGeralMateria = calcularMediaGeral(materia.id_materia);

        // Se não há configuração para esta matéria nesta unidade, não exibe
        if (configsMateria.length === 0) return null;

        return (
          <Card key={materia.id_materia}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{materia.nome_materia}</CardTitle>
                <div className="flex gap-3">
                  {mediaUnidade !== null && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Média da Unidade</p>
                      <Badge variant={mediaUnidade >= 7 ? "default" : mediaUnidade >= 5 ? "secondary" : "destructive"}>
                        {mediaUnidade.toFixed(2)}
                      </Badge>
                    </div>
                  )}
                  {mediaGeralMateria !== null && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Média Geral</p>
                      <Badge variant="outline">
                        {mediaGeralMateria.toFixed(2)}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tipos de Avaliação Configurados */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Sistema de Avaliação:</p>
                <div className="flex flex-wrap gap-2">
                  {configsMateria.map((config, idx) => (
                    <Badge key={idx} variant="outline">
                      {tiposLabel[config.tipo_avaliacao]}: {config.peso}%
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Notas Lançadas */}
              {notasMateria.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo de Avaliação</TableHead>
                      <TableHead>Nota</TableHead>
                      <TableHead>Peso</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Observação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notasMateria.map((nota) => {
                      const config = configsMateria.find(c => c.tipo_avaliacao === nota.tipo_avaliacao);
                      return (
                        <TableRow key={nota.id_nota}>
                          <TableCell>{tiposLabel[nota.tipo_avaliacao]}</TableCell>
                          <TableCell>
                            <Badge variant={nota.nota >= 7 ? "default" : nota.nota >= 5 ? "secondary" : "destructive"}>
                              {nota.nota.toFixed(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{config?.peso}%</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(nota.data_lancamento).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground italic">
                            {nota.observacao || '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Nenhuma nota lançada ainda para esta unidade
                  </AlertDescription>
                </Alert>
              )}

              {/* Indicador de Progresso */}
              {mediaUnidade !== null && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Desempenho nesta unidade:</span>
                    <span className="text-sm">{mediaUnidade.toFixed(2)} / 10</span>
                  </div>
                  <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`absolute top-0 left-0 h-full ${getCorMedia(mediaUnidade)} transition-all`}
                      style={{ width: `${(mediaUnidade / 10) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
