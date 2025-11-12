import { ArrowLeft, Calendar as CalendarIcon, FileText, Award, Save, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { useState } from 'react';
import { toast } from 'sonner@2.0.3';

interface CriarAtividadeProps {
  onBack: () => void;
}

export function CriarAtividade({ onBack }: CriarAtividadeProps) {
  const [novaAtividade, setNovaAtividade] = useState({
    id_aula: '',
    descricao: '',
    data_entrega: '',
    valor_pontos: '100',
    permite_reenvio: true,
    data_limite_acesso: ''
  });

  // Dados mock - aulas disponíveis
  const aulas = [
    { id_aula: 1, assunto: 'Funções Quadráticas', materia: 'Matemática', turma: '3º Ano A', data: '2025-10-13' },
    { id_aula: 2, assunto: 'Análise Sintática', materia: 'Português', turma: '3º Ano A', data: '2025-10-13' },
    { id_aula: 3, assunto: 'Segunda Guerra Mundial', materia: 'História', turma: '3º Ano A', data: '2025-10-14' },
  ];

  const handleSalvar = () => {
    if (!novaAtividade.id_aula || !novaAtividade.descricao || !novaAtividade.data_entrega) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const pontos = parseInt(novaAtividade.valor_pontos);
    if (isNaN(pontos) || pontos < 0 || pontos > 100) {
      toast.error('O valor de pontos deve estar entre 0 e 100');
      return;
    }

    // Validar data limite de acesso se fornecida
    if (novaAtividade.data_limite_acesso && novaAtividade.data_limite_acesso < novaAtividade.data_entrega) {
      toast.error('A data limite de acesso deve ser posterior à data de entrega');
      return;
    }

    toast.success('Atividade criada com sucesso!');
    onBack();
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
            {/* Aula Relacionada */}
            <div className="space-y-2">
              <Label htmlFor="aula">Vincular à Aula *</Label>
              <Select
                value={novaAtividade.id_aula}
                onValueChange={(value) => setNovaAtividade({ ...novaAtividade, id_aula: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a aula" />
                </SelectTrigger>
                <SelectContent>
                  {aulas.map((aula) => (
                    <SelectItem key={aula.id_aula} value={aula.id_aula.toString()}>
                      {aula.materia} - {aula.assunto} ({aula.turma}) - {new Date(aula.data).toLocaleDateString('pt-BR')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                A atividade será vinculada a esta aula específica
              </p>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição da Atividade *</Label>
              <Textarea
                id="descricao"
                value={novaAtividade.descricao}
                onChange={(e) => setNovaAtividade({ ...novaAtividade, descricao: e.target.value })}
                placeholder="Descreva a atividade que os alunos devem realizar. Ex: Resolver os exercícios 1 a 10 da apostila sobre funções quadráticas"
                rows={6}
              />
            </div>

            {/* Data de Entrega e Valor */}
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
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Prazo para os alunos entregarem
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor-pontos">Valor em Pontos *</Label>
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
                    placeholder="0-100"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Valor máximo que o aluno pode receber (0-100 pontos)
                </p>
              </div>
            </div>

            {/* Configurações de Acesso */}
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
                  onCheckedChange={(checked) => setNovaAtividade({ ...novaAtividade, permite_reenvio: checked })}
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
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Após esta data, a atividade ficará indisponível para visualização/envio
                </p>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="mb-2">
                    <strong>Como funciona:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Os alunos verão esta atividade na seção "Minhas Atividades"</li>
                    <li>Eles poderão enviar respostas em texto e/ou arquivos</li>
                    <li>{novaAtividade.permite_reenvio ? 'Poderão atualizar o envio até a data limite' : 'Só poderão enviar uma vez'}</li>
                    <li>Você receberá notificação quando enviarem</li>
                    <li>Após corrigir, você poderá atribuir a nota e comentários</li>
                    {novaAtividade.data_limite_acesso && (
                      <li>A atividade ficará invisível após {new Date(novaAtividade.data_limite_acesso).toLocaleDateString('pt-BR')}</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-4">
              <Button onClick={handleSalvar} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                Criar Atividade
              </Button>
              <Button variant="outline" onClick={onBack} className="flex-1">
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}