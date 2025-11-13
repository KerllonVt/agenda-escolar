// src/components/AvaliarAtividades.tsx

import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileText, User, Calendar, CheckCircle, MessageSquare, Award, Loader2, Download, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

// URL da API (local)
const API_URL = 'http://localhost:5000/api';

interface AvaliarAtividadesProps {
  onBack: () => void;
}

// Tipo para os envios pendentes
type EnvioPendente = {
  id_envio: number;
  data_envio: string;
  nome_aluno: string;
  nome_atividade: string;
  nome_materia: string;
  nome_turma: string;
  resposta: string | null;
  arquivo_enviado: string | null;
  total_anexos: number;
};

export function AvaliarAtividades({ onBack }: AvaliarAtividadesProps) {
  const { token } = useAuth();
  
  const [envios, setEnvios] = useState<EnvioPendente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [envioSelecionado, setEnvioSelecionado] = useState<EnvioPendente | null>(null);
  const [nota, setNota] = useState('');
  const [comentario, setComentario] = useState('');

  // Busca envios pendentes
  const fetchEnvios = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/atividades/envios-pendentes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Falha ao buscar envios pendentes.');
      const data = await response.json();
      setEnvios(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchEnvios();
    }
  }, [token]);

  const handleSelecionarEnvio = (envio: EnvioPendente) => {
    setEnvioSelecionado(envio);
    setNota(''); // Limpa campos
    setComentario('');
  };

  // Avaliar (enviar nota)
  const handleAvaliar = async () => {
    if (!envioSelecionado) return;
    
    if (!nota || parseFloat(nota) < 0 || parseFloat(nota) > 10) {
      toast.error('Digite uma nota válida entre 0 e 10');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/atividades/envios/${envioSelecionado.id_envio}/avaliar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nota: parseFloat(nota),
          comentario_professor: comentario
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      toast.success('Atividade avaliada com sucesso!');
      setEnvioSelecionado(null); // Limpa a seleção
      fetchEnvios(); // Recarrega a lista de pendentes
      
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

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
                {isLoading ? 'Buscando...' : `${envios.length} atividade(s) aguardando correção`}
              </p>
            </div>
            {envios.length > 0 && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                {envios.length} Pendentes
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Envios */}
          <div className="lg:col-span-1 space-y-4">
            <h3>Atividades Pendentes</h3>
            {isLoading && (
              <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            )}
            {!isLoading && envios.length === 0 && (
              <Card>
                <CardContent className="py-10 text-center">
                  <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-3" />
                  <p className="text-muted-foreground">Nenhuma atividade pendente!</p>
                </CardContent>
              </Card>
            )}
            {envios.map((envio) => (
              <Card
                key={envio.id_envio}
                className={`cursor-pointer transition-all ${
                  envioSelecionado?.id_envio === envio.id_envio
                    ? 'ring-2 ring-primary'
                    : 'hover:shadow-lg'
                }`}
                onClick={() => handleSelecionarEnvio(envio)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{envio.nome_aluno}</CardTitle>
                      <CardDescription className="text-sm truncate">
                        {envio.nome_atividade}
                      </CardDescription>
                    </div>
                    {envioSelecionado?.id_envio === envio.id_envio && (
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {envio.nome_materia} ({envio.nome_turma})
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
            {envioSelecionado ? (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{envioSelecionado.nome_atividade}</CardTitle>
                      <CardDescription>
                        {envioSelecionado.nome_materia} • {envioSelecionado.nome_turma}
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
                        {envioSelecionado.nome_aluno.charAt(0)}
                      </div>
                      <div>
                        <h4>{envioSelecionado.nome_aluno}</h4>
                        <p className="text-sm text-muted-foreground">
                          Enviado em {new Date(envioSelecionado.data_envio).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Resposta do Aluno */}
                  {envioSelecionado.resposta && (
                    <div>
                      <Label>Resposta do Aluno</Label>
                      <div className="mt-2 p-4 bg-muted rounded-lg">
                        <p className="text-sm">{envioSelecionado.resposta}</p>
                      </div>
                    </div>
                  )}

                  {/* Arquivo Enviado */}
                  {envioSelecionado.arquivo_enviado && (
                    <div>
                      <Label>Arquivo Enviado (Simulado)</Label>
                      <div className="mt-2 flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <span className="flex-1 text-sm">{envioSelecionado.arquivo_enviado}</span>
                        <Button variant="outline" size="sm" disabled>
                          <Download className="w-4 h-4 mr-2" />
                          Baixar
                        </Button>
                      </div>
                       <p className="text-xs text-muted-foreground mt-1">
                        (Upload de arquivos real será implementado com Vercel Blob)
                      </p>
                    </div>
                  )}

                  {/* Formulário de Avaliação */}
                  <div className="border-t pt-6 space-y-4">
                    <h4>Avaliação</h4>
                    <div className="space-y-2">
                      <Label htmlFor="nota">Nota (0-10) *</Label>
                      <div className="relative">
                        <Award className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="nota"
                          type="number"
                          step="0.1"
                          min="0"
                          max="10"
                          value={nota}
                          onChange={(e) => setNota(e.target.value)}
                          placeholder="Ex: 8.5"
                          className="pl-9"
                          disabled={isSubmitting}
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
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={handleAvaliar}
                        className="flex-1"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                        Salvar Avaliação
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setEnvioSelecionado(null)}
                        className="flex-1"
                        disabled={isSubmitting}
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