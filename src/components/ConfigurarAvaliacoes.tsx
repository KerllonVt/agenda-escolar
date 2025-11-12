import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Settings, Plus, Trash2, Info } from 'lucide-react';
import { ConfiguracaoAvaliacao, TipoAvaliacao } from '../types';
import { toast } from 'sonner@2.0.3';
import { Alert, AlertDescription } from './ui/alert';

export default function ConfigurarAvaliacoes() {
  // Mock: assumindo professor ID 10 logado
  const professorId = 10;
  
  // Mock de turmas-matérias que o professor leciona
  const turmasMaterias = [
    { id_turma: 1, nome_turma: '9° A', id_materia: 1, nome_materia: 'Matemática' },
    { id_turma: 2, nome_turma: '9° B', id_materia: 2, nome_materia: 'Português' },
  ];

  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoAvaliacao[]>([
    { id_config: 1, id_professor: 10, id_turma: 1, id_materia: 1, unidade: 1, tipo_avaliacao: 'prova', peso: 40, ativo: true },
    { id_config: 2, id_professor: 10, id_turma: 1, id_materia: 1, unidade: 1, tipo_avaliacao: 'atividade', peso: 30, ativo: true },
    { id_config: 3, id_professor: 10, id_turma: 1, id_materia: 1, unidade: 1, tipo_avaliacao: 'trabalho', peso: 30, ativo: true },
    { id_config: 4, id_professor: 10, id_turma: 2, id_materia: 2, unidade: 1, tipo_avaliacao: 'prova', peso: 50, ativo: true },
    { id_config: 5, id_professor: 10, id_turma: 2, id_materia: 2, unidade: 1, tipo_avaliacao: 'caderno', peso: 50, ativo: true },
  ]);

  const [dialogAberto, setDialogAberto] = useState(false);
  const [novaConfig, setNovaConfig] = useState({
    id_turma: 0,
    id_materia: 0,
    unidade: 1,
    tipo_avaliacao: 'prova' as TipoAvaliacao,
    peso: 0,
  });

  const tiposAvaliacao: { value: TipoAvaliacao; label: string }[] = [
    { value: 'prova', label: 'Prova' },
    { value: 'teste', label: 'Teste' },
    { value: 'trabalho', label: 'Trabalho' },
    { value: 'atividade', label: 'Atividade' },
    { value: 'caderno', label: 'Caderno' },
    { value: 'outro', label: 'Outro' },
  ];

  const handleCriarConfiguracao = () => {
    if (!novaConfig.id_turma || !novaConfig.id_materia || novaConfig.peso <= 0) {
      toast.error('Preencha todos os campos corretamente');
      return;
    }

    // Verificar se já existe essa configuração
    const jaExiste = configuracoes.some(
      c => c.id_turma === novaConfig.id_turma &&
           c.id_materia === novaConfig.id_materia &&
           c.unidade === novaConfig.unidade &&
           c.tipo_avaliacao === novaConfig.tipo_avaliacao
    );

    if (jaExiste) {
      toast.error('Já existe uma configuração para este tipo de avaliação!');
      return;
    }

    const config: ConfiguracaoAvaliacao = {
      id_config: configuracoes.length + 1,
      id_professor: professorId,
      id_turma: novaConfig.id_turma,
      id_materia: novaConfig.id_materia,
      unidade: novaConfig.unidade,
      tipo_avaliacao: novaConfig.tipo_avaliacao,
      peso: novaConfig.peso,
      ativo: true,
    };

    setConfiguracoes([...configuracoes, config]);
    setNovaConfig({ id_turma: 0, id_materia: 0, unidade: 1, tipo_avaliacao: 'prova', peso: 0 });
    setDialogAberto(false);
    toast.success('Configuração criada com sucesso!');
  };

  const handleToggleAtivo = (id: number) => {
    setConfiguracoes(configuracoes.map(c => 
      c.id_config === id ? { ...c, ativo: !c.ativo } : c
    ));
    toast.success('Status atualizado!');
  };

  const handleExcluir = (id: number) => {
    setConfiguracoes(configuracoes.filter(c => c.id_config !== id));
    toast.success('Configuração excluída!');
  };

  const getTurmaNome = (id: number) => {
    const tm = turmasMaterias.find(t => t.id_turma === id);
    return tm ? tm.nome_turma : 'Desconhecida';
  };

  const getMateriaNome = (id: number) => {
    const tm = turmasMaterias.find(t => t.id_materia === id);
    return tm ? tm.nome_materia : 'Desconhecida';
  };

  const getTipoLabel = (tipo: TipoAvaliacao) => {
    const t = tiposAvaliacao.find(ta => ta.value === tipo);
    return t ? t.label : tipo;
  };

  const calcularPesoTotal = (turmaId: number, materiaId: number, unidade: number) => {
    return configuracoes
      .filter(c => c.id_turma === turmaId && c.id_materia === materiaId && c.unidade === unidade && c.ativo)
      .reduce((sum, c) => sum + c.peso, 0);
  };

  const getPesosIncorretos = () => {
    const grupos: { [key: string]: number } = {};
    configuracoes
      .filter(c => c.ativo)
      .forEach(c => {
        const key = `${c.id_turma}-${c.id_materia}-${c.unidade}`;
        grupos[key] = (grupos[key] || 0) + c.peso;
      });
    return Object.entries(grupos).filter(([_, peso]) => peso !== 100);
  };

  const pesosIncorretos = getPesosIncorretos();

  return (
    <div className="space-y-6">
      {pesosIncorretos.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Atenção: A soma dos pesos de algumas configurações não é 100%. 
            Ajuste os pesos para que a soma seja exatamente 100% por turma, matéria e unidade.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              <div>
                <CardTitle>Configurar Tipos de Avaliação</CardTitle>
                <CardDescription>
                  Defina quais tipos de avaliação você usa e seus pesos
                </CardDescription>
              </div>
            </div>
            <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Configuração
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Nova Configuração de Avaliação</DialogTitle>
                  <DialogDescription>
                    Configure os tipos de avaliação e seus pesos para cada turma/matéria
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="turma_materia">Turma e Matéria</Label>
                    <Select
                      value={`${novaConfig.id_turma}-${novaConfig.id_materia}`}
                      onValueChange={(value) => {
                        const [turmaId, materiaId] = value.split('-').map(Number);
                        setNovaConfig({ ...novaConfig, id_turma: turmaId, id_materia: materiaId });
                      }}
                    >
                      <SelectTrigger id="turma_materia">
                        <SelectValue placeholder="Selecione turma e matéria" />
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
                    <Label htmlFor="unidade">Unidade/Bimestre</Label>
                    <Select
                      value={novaConfig.unidade.toString()}
                      onValueChange={(value) => setNovaConfig({ ...novaConfig, unidade: Number(value) })}
                    >
                      <SelectTrigger id="unidade">
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
                    <Label htmlFor="tipo">Tipo de Avaliação</Label>
                    <Select
                      value={novaConfig.tipo_avaliacao}
                      onValueChange={(value: TipoAvaliacao) => setNovaConfig({ ...novaConfig, tipo_avaliacao: value })}
                    >
                      <SelectTrigger id="tipo">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposAvaliacao.map((tipo) => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="peso">Peso (%)</Label>
                    <Input
                      id="peso"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Ex: 40"
                      value={novaConfig.peso || ''}
                      onChange={(e) => setNovaConfig({ ...novaConfig, peso: Number(e.target.value) })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      A soma dos pesos deve ser 100%
                    </p>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setDialogAberto(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCriarConfiguracao}>
                      Criar Configuração
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {turmasMaterias.map((tm) => {
              const configs = configuracoes.filter(
                c => c.id_turma === tm.id_turma && c.id_materia === tm.id_materia
              );
              
              if (configs.length === 0) return null;

              return (
                <div key={`${tm.id_turma}-${tm.id_materia}`} className="border rounded-lg p-4">
                  <div className="mb-4">
                    <h3 className="text-muted-foreground">
                      {tm.nome_turma} - {tm.nome_materia}
                    </h3>
                  </div>
                  
                  {[1, 2, 3, 4].map((unidade) => {
                    const configsUnidade = configs.filter(c => c.unidade === unidade);
                    if (configsUnidade.length === 0) return null;

                    const pesoTotal = calcularPesoTotal(tm.id_turma, tm.id_materia, unidade);
                    const pesoOk = pesoTotal === 100;

                    return (
                      <div key={unidade} className="mb-4 last:mb-0">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm">{unidade}ª Unidade</p>
                          <Badge variant={pesoOk ? "default" : "destructive"}>
                            Total: {pesoTotal}%
                          </Badge>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Peso</TableHead>
                              <TableHead>Ativo</TableHead>
                              <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {configsUnidade.map((config) => (
                              <TableRow key={config.id_config}>
                                <TableCell>{getTipoLabel(config.tipo_avaliacao)}</TableCell>
                                <TableCell>{config.peso}%</TableCell>
                                <TableCell>
                                  <Switch
                                    checked={config.ativo}
                                    onCheckedChange={() => handleToggleAtivo(config.id_config)}
                                  />
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleExcluir(config.id_config)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
