// src/components/BoletimAluno.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Progress } from './ui/progress';
import { ClipboardList, Award, AlertCircle, Loader2 } from 'lucide-react';
import { TipoAvaliacao } from '../types';
import { Alert, AlertDescription } from './ui/alert';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const API_URL = '/api'; // <-- CORRIGIDO PARA VERCEL

type NotaBoletim = { tipo: TipoAvaliacao; nota: string; observacao: string | null; data: string; };
type ConfigBoletim = { tipo: TipoAvaliacao; peso: number; };
type UnidadeBoletim = { unidade: number; media: string | null; notas: NotaBoletim[]; configuracoes: ConfigBoletim[]; };
type MateriaBoletim = { id_materia: number; nome_materia: string; media_geral: string | null; unidades: UnidadeBoletim[]; };

export default function BoletimAluno() {
  const { token } = useAuth();
  const [boletim, setBoletim] = useState<MateriaBoletim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unidadeSelecionada, setUnidadeSelecionada] = useState(1);

  useEffect(() => {
    const fetchBoletim = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_URL}/boletim`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) throw new Error('Falha ao buscar boletim.');
        const data = await response.json(); setBoletim(data);
      } catch (error: any) { toast.error(error.message); } finally { setIsLoading(false); }
    };
    if (token) fetchBoletim();
  }, [token]);

  const tiposLabel: { [key in TipoAvaliacao]: string } = { prova: 'Prova', teste: 'Teste', trabalho: 'Trabalho', atividade: 'Atividade', caderno: 'Caderno', outro: 'Outro', };
  const getCorMedia = (media: number | null) => {
    if (media === null) return 'bg-gray-300';
    if (media >= 7) return 'bg-blue-500';
    if (media >= 5) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  const mediaGeralTodasMaterias = () => {
    const medias = boletim.filter((m): m is MateriaBoletim & { media_geral: string } => m.media_geral !== null).map(m => parseFloat(m.media_geral)).filter(m => !isNaN(m));
    if (medias.length === 0) return null;
    return medias.reduce((sum, m) => sum + m, 0) / medias.length;
  };
  const mediaGeral = mediaGeralTodasMaterias();

  if (isLoading) { return (<div className="flex justify-center items-center py-20"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>); }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2"><CardHeader><div className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-blue-600" /><CardTitle>Meu Boletim Escolar</CardTitle></div></CardHeader></Card>
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50"><CardHeader><div className="flex items-center gap-2"><Award className="h-5 w-5 text-purple-600" /><CardTitle className="text-base">Média Geral (Global)</CardTitle></div></CardHeader><CardContent>{mediaGeral !== null ? (<div className="text-center"><div className="text-4xl mb-2">{mediaGeral.toFixed(2)}</div><Progress value={mediaGeral * 10} className="h-2" /></div>) : (<p className="text-sm text-muted-foreground text-center">Sem notas lançadas</p>)}</CardContent></Card>
      </div>
      <Card><CardContent className="pt-6"><div className="flex items-center gap-4"><p>Selecionar Unidade:</p><Select value={unidadeSelecionada.toString()} onValueChange={(value: string) => setUnidadeSelecionada(Number(value))}><SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">1ª Unidade</SelectItem><SelectItem value="2">2ª Unidade</SelectItem><SelectItem value="3">3ª Unidade</SelectItem><SelectItem value="4">4ª Unidade</SelectItem></SelectContent></Select></div></CardContent></Card>
      {boletim.map((materia) => {
        const unidade = materia.unidades.find(u => u.unidade === unidadeSelecionada);
        if (!unidade) return null; 
        const mediaUnidade = unidade.media ? parseFloat(unidade.media) : null;
        return (
          <Card key={materia.id_materia}>
            <CardHeader><div className="flex items-center justify-between"><CardTitle className="text-lg">{materia.nome_materia}</CardTitle><div className="flex gap-3">
              {mediaUnidade !== null && (<div className="text-right"><p className="text-xs text-muted-foreground">Média da Unidade</p><Badge variant={mediaUnidade >= 7 ? "default" : mediaUnidade >= 5 ? "secondary" : "destructive"}>{mediaUnidade.toFixed(2)}</Badge></div>)}
              {materia.media_geral !== null && (<div className="text-right"><p className="text-xs text-muted-foreground">Média Geral</p><Badge variant="outline">{materia.media_geral}</Badge></div>)}
            </div></div></CardHeader>
            <CardContent className="space-y-4">
              <div><p className="text-sm text-muted-foreground mb-2">Sistema de Avaliação:</p><div className="flex flex-wrap gap-2">{unidade.configuracoes.map((config, idx) => (<Badge key={idx} variant="outline">{tiposLabel[config.tipo]}: {config.peso}%</Badge>))}</div></div>
              {unidade.notas.length > 0 ? (<Table><TableHeader><TableRow><TableHead>Tipo</TableHead><TableHead>Nota</TableHead><TableHead>Peso</TableHead><TableHead>Data</TableHead><TableHead>Observação</TableHead></TableRow></TableHeader><TableBody>{unidade.notas.map((nota) => { const config = unidade.configuracoes.find(c => c.tipo === nota.tipo); const notaVal = parseFloat(nota.nota); return (<TableRow key={nota.tipo}><TableCell>{tiposLabel[nota.tipo]}</TableCell><TableCell><Badge variant={notaVal >= 7 ? "default" : notaVal >= 5 ? "secondary" : "destructive"}>{nota.nota}</Badge></TableCell><TableCell className="text-muted-foreground">{config?.peso}%</TableCell><TableCell className="text-sm text-muted-foreground">{new Date(nota.data).toLocaleDateString('pt-BR')}</TableCell><TableCell className="text-sm text-muted-foreground italic">{nota.observacao || '-'}</TableCell></TableRow>); })}</TableBody></Table>) : (<Alert><AlertCircle className="h-4 w-4" /><AlertDescription>Nenhuma nota lançada ainda para esta unidade</AlertDescription></Alert>)}
              {mediaUnidade !== null && (<div className="p-4 bg-muted/50 rounded-lg"><div className="flex items-center justify-between mb-2"><span className="text-sm">Desempenho nesta unidade:</span><span className="text-sm">{mediaUnidade.toFixed(2)} / 10</span></div><div className="relative h-3 bg-muted rounded-full overflow-hidden"><div className={`absolute top-0 left-0 h-full ${getCorMedia(mediaUnidade)} transition-all`} style={{ width: `${(mediaUnidade / 10) * 100}%` }} /></div></div>)}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}