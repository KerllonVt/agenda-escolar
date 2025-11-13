// src/components/Atividades.tsx

import React, { useState, useEffect } from 'react';
import { ArrowLeft, ClipboardList, Calendar, Upload, CheckCircle, Clock, AlertCircle, XCircle, File, X, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Atividade } from '../types'; // Importamos o tipo Atividade

// URL da API (local)
const API_URL = 'http://localhost:5000/api';

interface AtividadesProps {
  onBack: () => void;
}

// Tipo estendido para os dados que vêm da API
type AtividadeAluno = Atividade & {
  nome_materia: string;
  id_envio: number | null;
  nota: number | null;
  data_envio: string | null;
  comentario_professor: string | null;
};

interface ArquivoAnexo {
  nome: string;
  tipo: string;
  tamanho: number;
}

export function Atividades({ onBack }: AtividadesProps) {
  const { token } = useAuth();
  
  const [atividades, setAtividades] = useState<AtividadeAluno[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedAtividade, setSelectedAtividade] = useState<number | null>(null);
  const [resposta, setResposta] = useState('');
  const [arquivos, setArquivos] = useState<ArquivoAnexo[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Busca as atividades do aluno
  const fetchAtividades = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/atividades`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Falha ao buscar atividades.');
      const data = await response.json();
      setAtividades(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAtividades();
    }
  }, [token]);

  // --- Funções de Status e Data ---
  
  const getStatusBadge = (atividade: AtividadeAluno) => {
    if (atividade.nota !== null) {
      return <Badge className="bg-green-100 text-green-700">Nota: {atividade.nota.toFixed(1)}/10</Badge>;
    }
    if (atividade.id_envio) {
      return <Badge className="bg-blue-100 text-blue-700">Enviado</Badge>;
    }
    // Verifica se está atrasado
    const hoje = new Date();
    const limite = new Date(atividade.data_entrega);
    if (hoje > limite) {
      return <Badge variant="destructive">Atrasado</Badge>;
    }
    return <Badge variant="secondary">Pendente</Badge>;
  };

  const getDiasRestantes = (dataLimite: string) => {
    const hoje = new Date();
    const limite = new Date(dataLimite);
    const diff = Math.ceil((limite.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };
  
  // --- Funções de Envio ---
  
  const handleArquivosSelecionados = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const novosArquivos: ArquivoAnexo[] = Array.from(files).map(file => ({
        nome: file.name,
        tipo: file.type,
        tamanho: file.size
      }));
      setArquivos(prev => [...prev, ...novosArquivos]);
      toast.success(`${novosArquivos.length} arquivo(s) adicionado(s)`);
    }
  };

  const handleRemoverArquivo = (index: number) => {
    setArquivos(prev => prev.filter((_, i) => i !== index));
    toast.info('Arquivo removido');
  };

  const formatarTamanho = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleEnviar = async (id_atividade: number) => {
    if (!resposta.trim() && arquivos.length === 0) {
      toast.error('Por favor, escreva sua resposta ou anexe ao menos um arquivo');
      return;
    }
    
    setIsSubmitting(true);
    
    // TODO: Simulação de Upload.
    // Em um app real, faríamos o upload dos arquivos (ex: Vercel Blob)
    // e enviaríamos as URLs. Por enquanto, enviamos apenas os nomes.
    
    try {
      const response = await fetch(`${API_URL}/atividades/envios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id_atividade: id_atividade,
          resposta_texto: resposta,
          arquivos: arquivos // Enviamos a lista de arquivos (nome, tipo, tamanho)
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      toast.success(`Atividade enviada com sucesso!`);
      setSelectedAtividade(null);
      setResposta('');
      setArquivos([]);
      fetchAtividades(); // Recarrega a lista de atividades

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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-primary">Minhas Atividades</h1>
              <p className="text-sm text-muted-foreground">
                Gerencie suas tarefas e entregas
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {atividades.map((atividade) => {
              const diasRestantes = getDiasRestantes(atividade.data_entrega);
              const isExpanded = selectedAtividade === atividade.id_atividade;
              const podeReenviar = atividade.permite_reenvio || !atividade.id_envio;

              return (
                <Card key={atividade.id_atividade}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{atividade.nome_materia}</Badge>
                          {getStatusBadge(atividade)}
                        </div>
                        <CardTitle>{atividade.descricao}</CardTitle>
                        <CardDescription className="mt-2">
                          Valor: {atividade.valor_pontos} pontos (gamificação)
                        </CardDescription>
                        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Prazo: {new Date(atividade.data_entrega).toLocaleDateString('pt-BR')}
                          </div>
                          {diasRestantes >= 0 && !atividade.id_envio && (
                            <Badge variant="secondary">
                              {diasRestantes} {diasRestantes === 1 ? 'dia restante' : 'dias restantes'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {/* Se já foi enviado */}
                    {atividade.id_envio && !isExpanded && (
                      <div className="bg-muted p-4 rounded-lg space-y-3">
                        {atividade.data_envio && (
                           <div>
                            <p className="text-sm text-muted-foreground">Enviado em:</p>
                            <p className="mt-1">{new Date(atividade.data_envio).toLocaleString('pt-BR')}</p>
                          </div>
                        )}
                        {atividade.nota !== null && (
                          <div>
                            <p className="text-sm text-muted-foreground">Nota:</p>
                            <p className="mt-1 text-lg font-bold">{atividade.nota.toFixed(1)} / 10.0</p>
                          </div>
                        )}
                        {atividade.comentario_professor && (
                          <div>
                            <p className="text-sm text-muted-foreground">Observação do professor:</p>
                            <p className="mt-1 italic">"{atividade.comentario_professor}"</p>
                          </div>
                        )}
                        {podeReenviar && (
                          <Button
                            className="w-full"
                            variant="outline"
                            onClick={() => setSelectedAtividade(atividade.id_atividade)}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            {atividade.permite_reenvio ? "Enviar novamente" : "Responder"}
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Se não foi enviado (ou está expandido para reenviar) */}
                    {(!atividade.id_envio || isExpanded) && (
                      isExpanded ? (
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="resposta">Sua Resposta (opcional)</Label>
                            <Textarea
                              id="resposta"
                              placeholder="Digite sua resposta aqui..."
                              rows={5}
                              value={resposta}
                              onChange={(e) => setResposta(e.target.value)}
                              className="mt-2"
                              disabled={isSubmitting}
                            />
                          </div>
                          <div>
                            <Label htmlFor="arquivo">Anexar Arquivos</Label>
                            <Input
                              id="arquivo"
                              type="file"
                              multiple
                              onChange={handleArquivosSelecionados}
                              className="mt-2"
                              disabled={isSubmitting}
                            />
                          </div>
                          
                          {arquivos.length > 0 && (
                            <div className="space-y-2">
                              <Label>Arquivos Selecionados ({arquivos.length})</Label>
                              {arquivos.map((arquivo, index) => (
                                <div key={index} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                                  <File className="w-4 h-4 text-blue-600" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm truncate">{arquivo.nome}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatarTamanho(arquivo.tamanho)}
                                    </p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoverArquivo(index)}
                                    className="h-8 w-8"
                                    disabled={isSubmitting}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button 
                              onClick={() => handleEnviar(atividade.id_atividade)} 
                              className="flex-1"
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                              {atividade.id_envio ? "Enviar Correção" : "Enviar Resposta"}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setSelectedAtividade(null)}
                              disabled={isSubmitting}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          className="w-full"
                          onClick={() => setSelectedAtividade(atividade.id_atividade)}
                          disabled={!podeReenviar}
                        >
                          <ClipboardList className="w-4 h-4 mr-2" />
                          Responder Atividade
                        </Button>
                      )
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}