// src/components/CriarAtividade.tsx

import React, { useState, useEffect, useMemo } from 'react'; // <-- 1. useMemo ADICIONADO
import { ArrowLeft, Calendar as CalendarIcon, FileText, Award, Save, Clock, Loader2, Plus, Edit, Trash2, School } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { Aula, Atividade, ProfessorTurmaMateria } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';

// URL da API (local)
const API_URL = 'http://localhost:5000/api';

interface CriarAtividadeProps { onBack: () => void; }
type AulaSimples = Partial<Aula> & { id_aula: number; assunto: string; nome_materia: string; nome_turma: string; data: string; };
type AtividadeCompleta = Atividade & { nome_materia: string | null; nome_turma: string | null; total_envios: string; };
type VinculoProfessor = ProfessorTurmaMateria & { nome_turma: string; serie: string; nome_materia: string; };
// 2. TIPO ADICIONADO
type TurmaUnica = {
  id_turma: number;
  nome_turma: string;
};

export function CriarAtividade({ onBack }: CriarAtividadeProps) {
  const { token } = useAuth();
  const [aulas, setAulas] = useState<AulaSimples[]>([]);
  const [atividades, setAtividades] = useState<AtividadeCompleta[]>([]);
  const [vinculos, setVinculos] = useState<VinculoProfessor[]>([]); 
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [dialogAberto, setDialogAberto] = useState(false);
  const [editandoAtividade, setEditandoAtividade] = useState<Atividade | null>(null);
  
  const estadoInicial = {
    id_aula: null as number | null,
    descricao: '',
    data_entrega: '',
    valor_pontos: '100', 
    permite_reenvio: true,
    data_limite_acesso: '',
    unidade: 1, 
    id_turma_avulsa: null as number | null,
  };
  const [form, setForm] = useState(estadoInicial);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [aulasRes, atividadesRes, vinculosRes] = await Promise.all([
          fetch(`${API_URL}/aulas`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URL}/atividades`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URL}/vinculos/meus-vinculos`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        if (!aulasRes.ok) throw new Error('Falha ao buscar suas aulas.');
        if (!atividadesRes.ok) throw new Error('Falha ao buscar suas atividades.');
        if (!vinculosRes.ok) throw new Error('Falha ao buscar seus vínculos.');
        
        setAulas(await aulasRes.json());
        setAtividades(await atividadesRes.json());
        setVinculos(await vinculosRes.json());
      } catch (error: any) { toast.error(error.message); } finally { setIsLoading(false); }
    };
    if (token) fetchData();
  }, [token]);

  // 3. TIPO APLICADO
  const turmasUnicas: TurmaUnica[] = useMemo(() => {
    const turmasMap = new Map<number, string>();
    vinculos.forEach(v => {
      if (!turmasMap.has(v.id_turma)) {
        turmasMap.set(v.id_turma, `${v.nome_turma} - ${v.serie}`);
      }
    });
    return Array.from(turmasMap, ([id, nome]) => ({ id_turma: id, nome_turma: nome }));
  }, [vinculos]);
  
  const handleOpenDialog = (atividade: Atividade | null = null) => {
    if (atividade) {
      setEditandoAtividade(atividade);
      setForm({
        ...atividade,
        id_aula: atividade.id_aula || null,
        data_entrega: new Date(atividade.data_entrega).toISOString().split('T')[0],
        data_limite_acesso: atividade.data_limite_acesso ? new Date(atividade.data_limite_acesso).toISOString().split('T')[0] : '',
        valor_pontos: atividade.valor_pontos.toString(),
        unidade: atividade.unidade || 1,
        id_turma_avulsa: atividade.id_turma || null,
      });
    } else {
      setEditandoAtividade(null);
      setForm(estadoInicial);
    }
    setDialogAberto(true);
  };

  const handleSalvar = async () => {
    if (!form.descricao || !form.data_entrega || !form.unidade) {
      toast.error('Descrição, Data de Entrega e Unidade são obrigatórios.');
      return;
    }
    if (!form.id_aula && !form.id_turma_avulsa) {
      toast.error('Para Atividades Avulsas, você deve selecionar uma Turma.');
      return;
    }
    
    setIsSubmitting(true);
    const url = editandoAtividade ? `${API_URL}/atividades/${editandoAtividade.id_atividade}` : `${API_URL}/atividades`;
    const method = editandoAtividade ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          valor_pontos: form.valor_pontos ? Number(form.valor_pontos) : 100,
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      toast.success(editandoAtividade ? 'Atividade atualizada!' : 'Atividade criada!');
      if (editandoAtividade) {
        setAtividades(atividades.map(a => a.id_atividade === data.id_atividade ? data : a));
      } else {
        setAtividades([data, ...atividades]);
      }
      setDialogAberto(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleExcluir = async (id_atividade: number) => {
    if (!window.confirm('Tem certeza? Isso excluirá permanentemente a atividade e TODOS os envios dos alunos.')) return;
    try {
      const response = await fetch(`${API_URL}/atividades/${id_atividade}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      toast.success('Atividade excluída com sucesso!');
      setAtividades(atividades.filter(a => a.id_atividade !== id_atividade));
    } catch (error: any) { toast.error(error.message); }
  };

  return (
    <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
                <div><h1 className="text-primary">Gerenciar Atividades</h1><p className="text-sm text-muted-foreground">Crie e edite atividades para seus alunos</p></div>
              </div>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog(null)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Atividade
                </Button>
              </DialogTrigger>
            </div>
          </div>
        </header>
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardHeader><CardTitle>Atividades Criadas</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {isLoading && (<div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin" /></div>)}
              {!isLoading && atividades.length === 0 && (<p className="text-muted-foreground text-center py-4">Nenhuma atividade criada ainda.</p>)}
              
              {atividades.map((at) => (
                <Card key={at.id_atividade} className="bg-muted/30">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{at.descricao}</CardTitle>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleOpenDialog(at)}><Edit className="w-4 h-4" /></Button>
                        <Button variant="outline" size="icon" onClick={() => handleExcluir(at.id_atividade)}><Trash2 className="w-4 h-4 text-red-600" /></Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
                    <div>
                      {at.id_aula ? (<Badge variant="secondary">{at.nome_turma} - {at.nome_materia}</Badge>) : (<Badge variant="outline">Avulsa: {at.nome_turma}</Badge>)}
                      <Badge variant="outline" className="ml-2">Unidade: {at.unidade}</Badge>
                    </div>
                    <div className="flex gap-4">
                      <span>Prazo: {new Date(at.data_entrega).toLocaleDateString('pt-BR')}</span>
                      <span>Envios: {at.total_envios}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Modal de Criar/Editar */}
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{editandoAtividade ? 'Editar Atividade' : 'Nova Atividade'}</DialogTitle></DialogHeader>
        <div className="space-y-6 max-h-[70vh] overflow-y-auto p-1 pr-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="aula">Vincular à Aula (Opcional)</Label>
              <Select
                value={form.id_aula?.toString() || 'null'}
                // 4. TIPOS ADICIONADOS
                onValueChange={(value: string) => setForm({ ...form, id_aula: value === 'null' ? null : Number(value), id_turma_avulsa: null })}
                disabled={isSubmitting}
              >
                <SelectTrigger><SelectValue placeholder="Selecione a aula (opcional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">Nenhuma (Atividade Avulsa)</SelectItem>
                  {aulas.map((aula) => (
                    <SelectItem key={aula.id_aula} value={aula.id_aula.toString()}>
                      {aula.nome_materia} - {aula.assunto} ({aula.nome_turma})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!form.id_aula && (
              <div className="space-y-2">
                <Label htmlFor="turma-avulsa">Selecionar Turma *</Label>
                <Select
                  value={form.id_turma_avulsa?.toString() || ''}
                  // 4. TIPOS ADICIONADOS
                  onValueChange={(value: string) => setForm({ ...form, id_turma_avulsa: Number(value) })}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="turma-avulsa"><SelectValue placeholder="Selecione a turma" /></SelectTrigger>
                  <SelectContent>
                    {turmasUnicas.map((turma) => ( // 4. TIPO APLICADO
                      <SelectItem key={turma.id_turma} value={turma.id_turma.toString()}>
                        {turma.nome_turma}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="unidade">Unidade / Bimestre *</Label>
              <Select
                value={form.unidade.toString()}
                // 4. TIPOS ADICIONADOS
                onValueChange={(value: string) => setForm({ ...form, unidade: Number(value) })}
                disabled={isSubmitting}
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
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição da Atividade *</Label>
            <Textarea id="descricao" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Descreva a atividade que os alunos devem realizar..." rows={6} disabled={isSubmitting} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data-entrega">Data Limite de Entrega *</Label>
              <div className="relative"><CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input id="data-entrega" type="date" value={form.data_entrega} onChange={(e) => setForm({ ...form, data_entrega: e.target.value })} className="pl-9" min={new Date().toISOString().split('T')[0]} disabled={isSubmitting} /></div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor-pontos">Valor da Atividade (Opcional)</Label>
              <div className="relative"><Award className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input id="valor-pontos" type="number" value={form.valor_pontos} onChange={(e) => setForm({ ...form, valor_pontos: e.target.value })} className="pl-9" min="0" placeholder="100 (padrão)" disabled={isSubmitting} /></div>
            </div>
          </div>
          <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
            <h3 className="text-muted-foreground">Configurações de Acesso</h3>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5"><Label htmlFor="permite-reenvio">Permitir Reenvio *</Label><p className="text-xs text-muted-foreground">Alunos podem atualizar o envio caso cometam erro</p></div>
              {/* 4. TIPOS ADICIONADOS */}
              <Switch id="permite-reenvio" checked={form.permite_reenvio} onCheckedChange={(checked: boolean) => setForm({ ...form, permite_reenvio: checked })} disabled={isSubmitting} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data-limite-acesso">Data Limite de Acesso (Opcional)</Label>
              <div className="relative"><Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input id="data-limite-acesso" type="date" value={form.data_limite_acesso} onChange={(e) => setForm({ ...form, data_limite_acesso: e.target.value })} className="pl-9" min={form.data_entrega || new Date().toISOString().split('T')[0]} disabled={isSubmitting} /></div>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSalvar} className="flex-1" disabled={isSubmitting}>{isSubmitting ? (<Loader2 className="w-4 h-4 mr-2 animate-spin" />) : (<Save className="w-4 h-4 mr-2" />)}{editandoAtividade ? 'Salvar Mudanças' : 'Criar Atividade'}</Button>
            <Button variant="outline" onClick={() => setDialogAberto(false)} className="flex-1" disabled={isSubmitting}>Cancelar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}