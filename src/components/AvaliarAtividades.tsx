import { ArrowLeft, FileText, User, Calendar, CheckCircle, MessageSquare, Award } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useState } from 'react';
import { toast } from 'sonner@2.0.3';

interface AvaliarAtividadesProps {
  onBack: () => void;
}

export function AvaliarAtividades({ onBack }: AvaliarAtividadesProps) {
  const [envioSelecionado, setEnvioSelecionado] = useState<number | null>(null);
  const [nota, setNota] = useState('');
  const [comentario, setComentario] = useState('');

  // Dados mock de envios pendentes
  const enviosPendentes = [
    {
      id_envio: 1,
      aluno: 'Maria Silva',
      atividade: 'Exercícios de Funções Quadráticas',
      materia: 'Matemática',
      turma: '3º Ano A',
      data_envio: '2025-10-14 10:30:00',
      arquivo_enviado: 'maria-funcoes.pdf',
      resposta_texto: 'Resolvi todos os exercícios conforme solicitado. Tive algumas dúvidas no exercício 7, mas consegui resolver consultando o material complementar.'
    },
    {
      id_envio: 2,
      aluno: 'João Santos',
      atividade: 'Redação sobre a Segunda Guerra',
      materia: 'História',
      turma: '3º Ano A',
      data_envio: '2025-10-15 14:20:00',
      arquivo_enviado: 'joao-redacao.pdf',
      resposta_texto: 'Segue minha redação em anexo.'
    },
    {
      id_envio: 3,
      aluno: 'Ana Costa',
      atividade: 'Exercícios de Funções Quadráticas',
      materia: 'Matemática',
      turma: '3º Ano A',
      data_envio: '2025-10-15 09:15:00',
      arquivo_enviado: 'ana-funcoes.pdf'
    }
  ];

  const handleAvaliar = (id_envio: number) => {
    if (!nota || parseFloat(nota) < 0 || parseFloat(nota) > 100) {
      toast.error('Digite uma nota válida entre 0 e 100');
      return;
    }

    toast.success('Atividade avaliada com sucesso!');
    setEnvioSelecionado(null);
    setNota('');
    setComentario('');
  };

  const envioAtual = enviosPendentes.find(e => e.id_envio === envioSelecionado);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-primary">Avaliar Atividades</h1>
              <p className="text-sm text-muted-foreground">
                {enviosPendentes.length} atividade(s) aguardando correção
              </p>
            </div>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
              {enviosPendentes.length} Pendentes
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Envios */}
          <div className="lg:col-span-1 space-y-4">
            <h3>Atividades Pendentes</h3>
            {enviosPendentes.map((envio) => (
              <Card
                key={envio.id_envio}
                className={`cursor-pointer transition-all ${
                  envioSelecionado === envio.id_envio
                    ? 'ring-2 ring-primary'
                    : 'hover:shadow-lg'
                }`}
                onClick={() => setEnvioSelecionado(envio.id_envio)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{envio.aluno}</CardTitle>
                      <CardDescription className="text-sm truncate">
                        {envio.atividade}
                      </CardDescription>
                    </div>
                    {envioSelecionado === envio.id_envio && (
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {envio.materia}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(envio.data_envio).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Detalhes e Avaliação */}
          <div className="lg:col-span-2">
            {envioAtual ? (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{envioAtual.atividade}</CardTitle>
                      <CardDescription>
                        {envioAtual.materia} • {envioAtual.turma}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      Pendente
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Informações do Aluno */}
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-primary text-primary-foreground w-10 h-10 rounded-full flex items-center justify-center">
                        {envioAtual.aluno.charAt(0)}
                      </div>
                      <div>
                        <h4>{envioAtual.aluno}</h4>
                        <p className="text-sm text-muted-foreground">
                          Enviado em {new Date(envioAtual.data_envio).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Resposta do Aluno */}
                  {envioAtual.resposta_texto && (
                    <div>
                      <Label>Resposta do Aluno</Label>
                      <div className="mt-2 p-4 bg-muted rounded-lg">
                        <p className="text-sm">{envioAtual.resposta_texto}</p>
                      </div>
                    </div>
                  )}

                  {/* Arquivo Enviado */}
                  {envioAtual.arquivo_enviado && (
                    <div>
                      <Label>Arquivo Enviado</Label>
                      <div className="mt-2 flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <span className="flex-1 text-sm">{envioAtual.arquivo_enviado}</span>
                        <Button variant="outline" size="sm">
                          Baixar
                        </Button>
                        <Button variant="outline" size="sm">
                          Visualizar
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Formulário de Avaliação */}
                  <div className="border-t pt-6 space-y-4">
                    <h4>Avaliação</h4>
                    
                    <div className="space-y-2">
                      <Label htmlFor="nota">Nota (0-100) *</Label>
                      <div className="relative">
                        <Award className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="nota"
                          type="number"
                          min="0"
                          max="100"
                          value={nota}
                          onChange={(e) => setNota(e.target.value)}
                          placeholder="Digite a nota"
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="comentario">Comentário para o Aluno</Label>
                      <Textarea
                        id="comentario"
                        value={comentario}
                        onChange={(e) => setComentario(e.target.value)}
                        placeholder="Escreva um feedback para o aluno (opcional)"
                        rows={4}
                      />
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={() => handleAvaliar(envioAtual.id_envio)}
                        className="flex-1"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Salvar Avaliação
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEnvioSelecionado(null);
                          setNota('');
                          setComentario('');
                        }}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-16 text-center">
                  <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="mb-2">Selecione uma atividade</h3>
                  <p className="text-muted-foreground">
                    Clique em uma atividade da lista para avaliar
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
