// src/components/LancarNotas.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { BookCheck, Save, Loader2 } from 'lucide-react';
import { NotaAvaliacao, TipoAvaliacao, Usuario, ProfessorTurmaMateria, ConfiguracaoAvaliacao } from '../types';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

const API_URL = '/api'; // <-- CORRIGIDO PARA VERCEL

type VinculoProfessor = ProfessorTurmaMateria & { nome_turma: string; serie: string; nome_materia: string; };

export default function LancarNotas() {
  const { token } = useAuth();
  const [vinculos, setVinculos] = useState<VinculoProfessor[]>([]);
  const [alunos, setAlunos] = useState<Usuario[]>([]);
  const [configs, setConfigs] = useState<ConfiguracaoAvaliacao[]>([]);
  const [notas, setNotas] = useState<NotaAvaliacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVinculo, setSelectedVinculo] = useState('');
  const [selectedUnidade, setSelectedUnidade] = useState('1');
  const [selectedTipo, setSelectedTipo] = useState<TipoAvaliacao | ''>('');
  const [notasTemporarias, setNotasTemporarias] = useState<{ [key: number]: { nota: string; observacao: string } }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const carregarDados = async () => {
      setIsLoading(true);
      try {
        const [vinculosRes, configsRes, alunosRes] = await Promise.all([
          fetch(`${API_URL}/vinculos/meus-vinculos`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URL}/configuracoes`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URL}/users?tipo=aluno`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        if (!vinculosRes.ok) throw new Error('Falha ao buscar vínculos.');
        if (!configsRes.ok) throw new Error('Falha ao buscar configurações.');
        if (!alunosRes.ok) throw new Error('Falha ao buscar alunos.');
        setVinculos(await vinculosRes.json());
        setConfigs(await configsRes.json());
        setAlunos(await alunosRes.json());
      } catch (error: any) { toast.error(error.message); } finally { setIsLoading(false); }
    };
    if (token) carregarDados();
  }, [token]);
  useEffect(() => {
    const fetchNotas = async () => {
      if (!selectedVinculo || !selectedUnidade || !selectedTipo) { setNotas([]); return; }
      const [id_turma, id_materia] = selectedVinculo.split('-').map(Number);
      setIsLoading(true);
      try {
        const url = `${API_URL}/notas?id_turma=${id_turma}&id_materia=${id_materia}&unidade=${selectedUnidade}&tipo_avaliacao=${selectedTipo}`;
        const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) throw new Error('Falha ao buscar notas.');
        setNotas(await response.json());
      } catch (error: any) { toast.error(error.message); } finally { setIsLoading(false); }
    };
    if (token) fetchNotas();
  }, [token, selectedVinculo, selectedUnidade, selectedTipo]);
  
  const tiposDisponiveis = configs.filter(c => { const [id_turma, id_materia] = selectedVinculo.split('-').map(Number); return c.id_turma === id_turma && c.id_materia === id_materia && c.unidade === Number(selectedUnidade) && c.ativo; }).map(c => c.tipo_avaliacao);
  const alunosDaTurma = alunos.filter(a => { const [id_turma] = selectedVinculo.split('-').map(Number); return a.id_turma === id_turma; });
  const tiposLabel: { [key in TipoAvaliacao]: string } = { prova: 'Prova', teste: 'Teste', trabalho: 'Trabalho', atividade: 'Atividade', caderno: 'Caderno', outro: 'Outro', };
  const getNotaAluno = (alunoId: number) => { return notas.find(n => n.id_aluno === alunoId); };
  const handleSetNotaTemporaria = (alunoId: number, nota: string, observacao?: string) => { setNotasTemporarias({ ...notasTemporarias, [alunoId]: { nota, observacao: observacao !== undefined ? observacao : (notasTemporarias[alunoId]?.observacao || ''), }, }); };
  const handleSalvarNota = async (alunoId: number) => {
    const temp = notasTemporarias[alunoId];
    if (!temp || temp.nota === undefined) { toast.error('Digite uma nota válida'); return; }
    const notaValor = parseFloat(temp.nota);
    if (isNaN(notaValor) || notaValor < 0 || notaValor > 10) { toast.error('Nota deve estar entre 0 e 10'); return; }
    const [id_turma, id_materia] = selectedVinculo.split('-').map(Number);
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/notas/lancar`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ id_aluno: alunoId, id_turma, id_materia, unidade: Number(selectedUnidade), tipo_avaliacao: selectedTipo, nota: notaValor, observacao: temp.observacao }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      toast.success('Nota salva com sucesso!');
      const notaExistente = notas.find(n => n.id_aluno === alunoId);
      if (notaExistente) { setNotas(notas.map(n => n.id_aluno === alunoId ? data : n)); } else { setNotas([...notas, data]); }
      const newTemp = { ...notasTemporarias }; delete newTemp[alunoId]; setNotasTemporarias(newTemp);
    } catch (error: any) { toast.error(error.message); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <Card><CardHeader><div className="flex items-center gap-2"><BookCheck className="h-5 w-5 text-blue-600" /><CardTitle>Lançar Notas</CardTitle></div></CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div><Label>Turma e Matéria</Label><Select value={selectedVinculo} onValueChange={(v) => { setSelectedVinculo(v); setSelectedTipo(''); }}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent>{vinculos.map((v) => (<SelectItem key={v.id_ptm} value={`${v.id_turma}-${v.id_materia}`}>{v.nome_turma} - {v.nome_materia}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>Unidade</Label><Select value={selectedUnidade} onValueChange={(v) => { setSelectedUnidade(v); setSelectedTipo(''); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">1ª Unidade</SelectItem><SelectItem value="2">2ª Unidade</SelectItem><SelectItem value="3">3ª Unidade</SelectItem><SelectItem value="4">4ª Unidade</SelectItem></SelectContent></Select></div>
            <div><Label>Tipo de Avaliação</Label><Select value={selectedTipo} onValueChange={(v) => setSelectedTipo(v as TipoAvaliacao)} disabled={!selectedVinculo}><SelectTrigger><SelectValue placeholder={!selectedVinculo ? "Selecione turma/unidade" : "Selecione..."} /></SelectTrigger><SelectContent>{tiposDisponiveis.map((tipo) => (<SelectItem key={tipo} value={tipo}>{tiposLabel[tipo]}</SelectItem>))}</SelectContent></Select></div>
          </div>
          {selectedTipo && (<div>{isLoading ? (<div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin" /></div>) : (<Table><TableHeader><TableRow><TableHead>Aluno</TableHead><TableHead>Nota (0-10)</TableHead><TableHead>Observação</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader><TableBody>{alunosDaTurma.map((aluno) => { const notaExistente = getNotaAluno(aluno.id_usuario); const notaTemp = notasTemporarias[aluno.id_usuario]; const valorAtual = notaTemp?.nota ?? notaExistente?.nota?.toString() ?? ''; const obsAtual = notaTemp?.observacao ?? notaExistente?.observacao ?? ''; return (<TableRow key={aluno.id_usuario}><TableCell>{aluno.nome_completo}</TableCell><TableCell><Input type="number" step="0.1" min="0" max="10" placeholder="0.0" className="w-24" value={valorAtual} onChange={(e) => handleSetNotaTemporaria(aluno.id_usuario, e.target.value, obsAtual)} /></TableCell><TableCell><Input placeholder="Opcional" value={obsAtual} onChange={(e) => handleSetNotaTemporaria(aluno.id_usuario, valorAtual, e.target.value)} /></TableCell><TableCell>{notaExistente ? (<Badge variant="default">Lançada</Badge>) : (<Badge variant="secondary">Pendente</Badge>)}</TableCell><TableCell className="text-right"><Button size="sm" onClick={() => handleSalvarNota(aluno.id_usuario)} disabled={isSubmitting || !notaTemp?.nota}>{isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}</Button></TableCell></TableRow>); })}</TableBody></Table>)}</div>)}
        </CardContent>
      </Card>
    </div>
  );
}