// src/components/CriarAtividade.tsx

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar as CalendarIcon, FileText, Award, Save, Clock, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { Aula } from '../types';

// URL da API (local)
const API_URL = 'http://localhost:5000/api';

interface CriarAtividadeProps {
  onBack: () => void;
}

// Tipo estendido para as aulas que vêm da API
type AulaSimples = Partial<Aula> & {
  id_aula: number;
  assunto: string;
  nome_materia: string;
  nome_turma: string;
  data: string;
};

export function CriarAtividade({ onBack }: CriarAtividadeProps) {
  const { token } = useAuth();
  const [aulas, setAulas] = useState<AulaSimples[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [novaAtividade, setNovaAtividade] = useState({
    id_aula: '',
    descricao: '',
    data_entrega: '',
    valor_pontos: '100', // Pontos para gamificação (0-100)
    permite_reenvio: true,
    data_limite_acesso: ''
  });

  // Busca as aulas do professor para o dropdown
  useEffect(() => {
    const fetchAulas = async () => {
      setIsLoading(true);
      try {
        // Usamos a API de agenda para pegar as aulas futuras como base
        const hoje = new Date().toISOString().split('T')[0];
        const futuro = new Date();
        futuro.setDate(futuro.getDate() + 90); // 90 dias no futuro
        
        const url = `${API_URL}/aulas?data_inicio=${hoje}&data_fim=${getISODate(futuro)}`;
        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Falha ao buscar aulas.');
        const data = await response.json();
        setAulas(data);
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    if (token) {
      fetchAulas();
    }
  }, [token]);
  
  // Função helper para formatar data
  const getISODate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const handleSalvar = async () => {
    if (!novaAtividade.id_aula || !novaAtividade.descricao || !novaAtividade.data_entrega) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (novaAtividade.data_limite_acesso && novaAtividade.data_limite_acesso < novaAtividade.data_entrega) {
      toast.error('A data limite de acesso deve ser posterior à data de entrega');
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/atividades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...novaAtividade,
          id_aula: Number(novaAtividade.id_aula),
          valor_pontos: Number(novaAtividade.valor_pontos)
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      toast.success('Atividade criada com sucesso!');
      onBack();

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-primary">Criar Nova Atividade</h1>
              <p className="text-sm text-muted-foreground">
                Crie uma atividade para seus alunos
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Informações da Atividade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="aula">Vincular à Aula *</Label>
              <Select
                value={novaAtividade.id_aula}
                onValueChange={(value: string) => setNovaAtividade({ ...novaAtividade, id_aula: value })}
                disabled={isLoading || aulas.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    isLoading ? "Carregando aulas..." : "Selecione a aula"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {aulas.map((aula) => (
                    <SelectItem key={aula.id_aula} value={aula.id_aula.toString()}>
                      {aula.nome_materia} - {aula.assunto} ({aula.nome_turma}) - {new Date(aula.data).toLocaleDateString('pt-BR')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição da Atividade *</Label>
              <Textarea
                id="descricao"
                value={novaAtividade.descricao}
                onChange={(e) => setNovaAtividade({ ...novaAtividade, descricao: e.target.value })}
                placeholder="Descreva a atividade que os alunos devem realizar..."
                rows={6}
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data-entrega">Data Limite de Entrega *</Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="data-entrega"
                    type="date"
                    value={novaAtividade.data_entrega}
                    onChange={(e) => setNovaAtividade({ ...novaAtividade, data_entrega: e.target.value })}
                    className="pl-9"
                    min={new Date().toISOString().split('T')[0]}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor-pontos">Valor em Pontos (0-100)</Label>
                <div className="relative">
                  <Award className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="valor-pontos"
                    type="number"
                    value={novaAtividade.valor_pontos}
                    onChange={(e) => setNovaAtividade({ ...novaAtividade, valor_pontos: e.target.value })}
                    className="pl-9"
                    min="0"
                    max="100"
                    placeholder="100"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
              <h3 className="text-muted-foreground">Configurações de Acesso</h3>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="permite-reenvio">Permitir Reenvio</Label>
                  <p className="text-xs text-muted-foreground">
                    Alunos podem atualizar o envio caso cometam erro
                  </p>
                </div>
                <Switch
                  id="permite-reenvio"
                  checked={novaAtividade.permite_reenvio}
                  onCheckedChange={(checked: boolean) => setNovaAtividade({ ...novaAtividade, permite_reenvio: checked })}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data-limite-acesso">Data Limite de Acesso (Opcional)</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="data-limite-acesso"
                    type="date"
                    value={novaAtividade.data_limite_acesso}
                    onChange={(e) => setNovaAtividade({ ...novaAtividade, data_limite_acesso: e.target.value })}
                    className="pl-9"
                    min={novaAtividade.data_entrega || new Date().toISOString().split('T')[0]}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSalvar} className="flex-1" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Criar Atividade
              </Button>
              <Button variant="outline" onClick={onBack} className="flex-1" disabled={isLoading}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}