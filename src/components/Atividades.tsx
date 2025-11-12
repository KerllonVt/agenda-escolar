import { ArrowLeft, ClipboardList, Calendar, Upload, CheckCircle, Clock, AlertCircle, XCircle, File, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '../contexts/AuthContext';
import { atividades, enviosAtividade, agendas, professorTurmaMateria, materias, enviosAnexos } from '../lib/mock-data';
import { useState } from 'react';
import { toast } from 'sonner@2.0.3';

interface AtividadesProps {
  onBack: () => void;
}

interface ArquivoAnexo {
  nome: string;
  tipo: string;
  tamanho: number;
}

export function Atividades({ onBack }: AtividadesProps) {
  const { usuario } = useAuth();
  const [selectedAtividade, setSelectedAtividade] = useState<number | null>(null);
  const [resposta, setResposta] = useState('');
  const [arquivos, setArquivos] = useState<ArquivoAnexo[]>([]);

  const getAtividadeComDetalhes = (atividade: typeof atividades[0]) => {
    const agenda = agendas.find(a => a.id === atividade.id_agenda);
    const ptm = professorTurmaMateria.find(p => p.id === agenda?.id_ptm);
    const materia = materias.find(m => m.id === ptm?.id_materia);
    const envio = enviosAtividade.find(e => e.id_atividade === atividade.id && e.id_aluno === usuario?.id);

    return {
      ...atividade,
      materia: materia?.nome_materia || '',
      envio
    };
  };

  const atividadesComDetalhes = atividades.map(getAtividadeComDetalhes);

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'aprovado':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'enviado':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'revisar':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'reprovado':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status?: string) => {
    const configs = {
      aprovado: { label: 'Aprovado', className: 'bg-green-100 text-green-700' },
      enviado: { label: 'Aguardando Correção', className: 'bg-blue-100 text-blue-700' },
      revisar: { label: 'Revisar', className: 'bg-yellow-100 text-yellow-700' },
      reprovado: { label: 'Reprovado', className: 'bg-red-100 text-red-700' },
      pendente: { label: 'Pendente', className: 'bg-gray-100 text-gray-700' }
    };

    const config = configs[status as keyof typeof configs] || configs.pendente;
    return <Badge className={config.className} variant="outline">{config.label}</Badge>;
  };

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

  const handleEnviar = () => {
    if (!resposta.trim() && arquivos.length === 0) {
      toast.error('Por favor, escreva sua resposta ou anexe ao menos um arquivo');
      return;
    }
    toast.success(`Atividade enviada com sucesso! ${arquivos.length > 0 ? `${arquivos.length} arquivo(s) anexado(s).` : ''}`);
    setSelectedAtividade(null);
    setResposta('');
    setArquivos([]);
  };

  const getDiasRestantes = (dataLimite: string) => {
    const hoje = new Date('2025-10-13');
    const limite = new Date(dataLimite);
    const diff = Math.ceil((limite.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
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
        <div className="space-y-4">
          {atividadesComDetalhes.map((atividade) => {
            const diasRestantes = getDiasRestantes(atividade.data_limite);
            const isExpanded = selectedAtividade === atividade.id;

            return (
              <Card key={atividade.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{atividade.materia}</Badge>
                        {getStatusBadge(atividade.envio?.status)}
                      </div>
                      <CardTitle>{atividade.titulo}</CardTitle>
                      <CardDescription className="mt-2">
                        {atividade.descricao}
                      </CardDescription>
                      <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Prazo: {new Date(atividade.data_limite).toLocaleDateString('pt-BR')}
                        </div>
                        {diasRestantes > 0 && (
                          <Badge variant="secondary">
                            {diasRestantes} {diasRestantes === 1 ? 'dia restante' : 'dias restantes'}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {atividade.envio && getStatusIcon(atividade.envio.status)}
                  </div>
                </CardHeader>

                {atividade.envio ? (
                  <CardContent>
                    <div className="bg-muted p-4 rounded-lg space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Sua resposta:</p>
                        <p className="mt-1">{atividade.envio.resposta}</p>
                      </div>
                      {/* Mostrar anexos enviados */}
                      {enviosAnexos.filter(a => a.id_envio === atividade.envio?.id).length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Arquivos anexados:</p>
                          <div className="space-y-2">
                            {enviosAnexos
                              .filter(a => a.id_envio === atividade.envio?.id)
                              .map((anexo) => (
                                <div key={anexo.id_anexo} className="flex items-center gap-2 p-2 bg-background rounded border">
                                  <File className="w-4 h-4 text-blue-600" />
                                  <span className="text-sm flex-1">{anexo.caminho_arquivo.split('/').pop()}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {anexo.tipo_arquivo.split('/')[1]?.toUpperCase()}
                                  </Badge>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                      {atividade.envio.pontuacao !== undefined && (
                        <div>
                          <p className="text-sm text-muted-foreground">Pontuação:</p>
                          <p className="mt-1">{atividade.envio.pontuacao}/100</p>
                        </div>
                      )}
                      {atividade.envio.observacao_professor && (
                        <div>
                          <p className="text-sm text-muted-foreground">Observação do professor:</p>
                          <p className="mt-1">{atividade.envio.observacao_professor}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                ) : (
                  <CardContent>
                    {isExpanded ? (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="resposta">Sua Resposta</Label>
                          <Textarea
                            id="resposta"
                            placeholder="Digite sua resposta aqui..."
                            rows={5}
                            value={resposta}
                            onChange={(e) => setResposta(e.target.value)}
                            className="mt-2"
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
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Você pode selecionar múltiplos arquivos (PDF, DOCX, imagens, etc.)
                          </p>
                        </div>
                        
                        {/* Preview dos arquivos selecionados */}
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
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button onClick={handleEnviar} className="flex-1">
                            <Upload className="w-4 h-4 mr-2" />
                            Enviar Resposta
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedAtividade(null);
                              setResposta('');
                              setArquivos([]);
                            }}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => setSelectedAtividade(atividade.id)}
                      >
                        <ClipboardList className="w-4 h-4 mr-2" />
                        Responder Atividade
                      </Button>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
