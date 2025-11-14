// src/components/ConfigurarAvaliacoes.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Alert, AlertDescription } from './ui/alert';
import { Settings, Plus, Trash2, Info, Loader2 } from 'lucide-react';
import { ConfiguracaoAvaliacao, TipoAvaliacao, ProfessorTurmaMateria, Materia } from '../types';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

const API_URL = 'http://localhost:5000/api';

// Tipo estendido para os vínculos
type VinculoProfessor = ProfessorTurmaMateria & {
  nome_turma: string;
  serie: string;
  nome_materia: string;
};

// Tipo estendido para as configurações
type ConfigCompleta = ConfiguracaoAvaliacao & {
  nome_turma?: string;
  nome_materia?: string;
};

export default function ConfigurarAvaliacoes() {
  const { token } = useAuth();
  
  const [vinculos, setVinculos] = useState<VinculoProfessor[]>([]);
  const [configuracoes, setConfiguracoes] = useState<ConfigCompleta[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // Carregar dados iniciais (vínculos e configs)
  useEffect(() => {
    const carregarDados = async () => {
      setIsLoading(true);
      try {
        const [vinculosRes, configsRes] = await Promise.all([
          fetch(`${API_URL}/vinculos/meus-vinculos`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URL}/configuracoes`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        if (!vinculosRes.ok) throw new Error('Falha ao buscar turmas e matérias.');
        if (!configsRes.ok) throw new Error('Falha ao buscar configurações.');
        
        const vinculosData = await vinculosRes.json();
        const configsData = await configsRes.json();
        
        setVinculos(vinculosData);
        setConfiguracoes(configsData);
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    if (token) carregarDados();
  }, [token]);


  const handleCriarConfiguracao = async () => {
    if (!novaConfig.id_turma || !novaConfig.id_materia || novaConfig.peso <= 0 || novaConfig.peso > 100) {
      toast.error('Preencha todos os campos corretamente (Peso de 1 a 100).');
      return;
    }
    
    // Validar soma dos pesos
    const pesoTotal = calcularPesoTotal(novaConfig.id_turma, novaConfig.id_materia, novaConfig.unidade);
    if (pesoTotal + novaConfig.peso > 100) {
      toast.error(`A soma dos pesos não pode exceder 100%. (Atual: ${pesoTotal}%)`);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/configuracoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(novaConfig)
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      setConfiguracoes([...configuracoes, data]);
      setNovaConfig({ id_turma: 0, id_materia: 0, unidade: 1, tipo_avaliacao: 'prova', peso: 0 });
      setDialogAberto(false);
      toast.success('Configuração criada com sucesso!');
    } catch (error: any) {
       toast.error(error.message);
    }
  };

  const handleToggleAtivo = async (id: number, ativo: boolean) => {
    try {
       const response = await fetch(`${API_URL}/configuracoes/${id}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ativo: ativo })
      });
      if (!response.ok) throw new Error('Falha ao atualizar status.');
      
      setConfiguracoes(configuracoes.map(c => 
        c.id_config === id ? { ...c, ativo: ativo } : c
      ));
      toast.success('Status atualizado!');
    } catch (error: any) {
       toast.error(error.message);
    }
  };

  const handleExcluir = async (id: number) => {
    if (!window.confirm('Tem certeza? Isso não pode ser desfeito.')) return;
    try {
      const response = await fetch(`${API_URL}/configuracoes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Falha ao excluir.');
      
      setConfiguracoes(configuracoes.filter(c => c.id_config !== id));
      toast.success('Configuração excluída!');
    } catch (error: any) {
       toast.error(error.message);
    }
  };
  
  // --- Funções Auxiliares ---

  const getTipoLabel = (tipo: TipoAvaliacao) => {
    return tiposAvaliacao.find(t => t.value === tipo)?.label || tipo;
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
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="turma_materia">Turma e Matéria</Label>
                    <Select
                      value={`${novaConfig.id_turma}-${novaConfig.id_materia}`}
                      onValueChange={(value: string) => {
                        const [turmaId, materiaId] = value.split('-').map(Number);
                        setNovaConfig({ ...novaConfig, id_turma: turmaId, id_materia: materiaId });
                      }}
                    >
                      <SelectTrigger id="turma_materia">
                        <SelectValue placeholder="Selecione turma e matéria" />
                      </SelectTrigger>
                      <SelectContent>
                        {vinculos.map((v) => (
                          <SelectItem key={v.id_ptm} value={`${v.id_turma}-${v.id_materia}`}>
                            {v.nome_turma} - {v.nome_materia}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="unidade">Unidade/Bimestre</Label>
                    <Select
                      value={novaConfig.unidade.toString()}
                      onValueChange={(value: string) => setNovaConfig({ ...novaConfig, unidade: Number(value) })}
                    >
                      <SelectTrigger id="unidade"><SelectValue /></SelectTrigger>
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
                      <SelectTrigger id="tipo"><SelectValue /></SelectTrigger>
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
                      id="peso" type="number" min="0" max="100" placeholder="Ex: 40"
                      value={novaConfig.peso || ''}
                      onChange={(e) => setNovaConfig({ ...novaConfig, peso: Number(e.target.value) })}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setDialogAberto(false)}>Cancelar</Button>
                    <Button onClick={handleCriarConfiguracao}>Criar</Button>
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
            <div className="space-y-6">
              {vinculos.map((v) => {
                const configs = configuracoes.filter(
                  c => c.id_turma === v.id_turma && c.id_materia === v.id_materia
                );
                return (
                  <div key={v.id_ptm} className="border rounded-lg p-4">
                    <div className="mb-4">
                      <h3 className="text-muted-foreground">
                        {v.nome_turma} - {v.nome_materia}
                      </h3>
                    </div>
                    {[1, 2, 3, 4].map((unidade) => {
                      const configsUnidade = configs.filter(c => c.unidade === unidade);
                      if (configsUnidade.length === 0) return null;
                      const pesoTotal = calcularPesoTotal(v.id_turma, v.id_materia, unidade);
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
                                      onCheckedChange={(checked: boolean) => handleToggleAtivo(config.id_config, checked)}
                                    />
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      variant="ghost" size="sm"
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}