// src/components/CriarAula.tsx

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar as CalendarIcon, Clock, BookOpen, School, Save, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

const API_URL = 'http://localhost:5000/api';

type VinculoProfessor = {
  id_ptm: number;
  id_turma: number;
  id_materia: number;
  nome_turma: string;
  serie: string;
  nome_materia: string;
};

interface CriarAulaProps {
  onBack: () => void;
}

export function CriarAula({ onBack }: CriarAulaProps) {
  const { token } = useAuth();
  const [vinculos, setVinculos] = useState<VinculoProfessor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [novaAula, setNovaAula] = useState({
    data: '',
    hora: '',
    assunto: '',
    // 'tipo_aula' foi removido
    selectedVinculo: '' // Armazena "id_turma-id_materia"
  });

  useEffect(() => {
    const fetchVinculos = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_URL}/vinculos/meus-vinculos`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Falha ao buscar suas turmas e matérias.');
        const data = await response.json();
        setVinculos(data);
      } catch (error: any) { toast.error(error.message); } finally { setIsLoading(false); }
    };
    fetchVinculos();
  }, [token]);

  const handleSalvar = async () => {
    const { data, hora, assunto, selectedVinculo } = novaAula;
    const [id_turma, id_materia] = selectedVinculo.split('-').map(Number);

    if (!data || !hora || !assunto || !id_turma || !id_materia) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/aulas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          data, hora, assunto, id_turma, id_materia
          // 'tipo_aula' foi removido
        })
      });

      const dataApi = await response.json();
      if (!response.ok) throw new Error(dataApi.message);

      toast.success('Aula criada com sucesso!');
      onBack(); 

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
            <div><h1 className="text-primary">Criar Nova Aula</h1><p className="text-sm text-muted-foreground">Adicione uma nova aula à agenda</p></div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader><CardTitle>Informações da Aula</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            
            <div className="space-y-2">
              <Label htmlFor="vinculo">Turma e Matéria *</Label>
              <div className="relative">
                <School className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                <Select
                  value={novaAula.selectedVinculo}
                  onValueChange={(value: string) => setNovaAula({ ...novaAula, selectedVinculo: value })}
                  disabled={isLoading || vinculos.length === 0}
                >
                  <SelectTrigger className="pl-9">
                    <SelectValue placeholder={
                      isLoading ? "Carregando suas turmas..." : "Selecione a turma e matéria"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {vinculos.map((vinculo) => (
                      <SelectItem key={vinculo.id_ptm} value={`${vinculo.id_turma}-${vinculo.id_materia}`}>
                        {vinculo.nome_turma} ({vinculo.serie}) - {vinculo.nome_materia}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="data">Data da Aula *</Label><div className="relative"><CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input id="data" type="date" value={novaAula.data} onChange={(e) => setNovaAula({ ...novaAula, data: e.target.value })} className="pl-9" disabled={isLoading} /></div></div>
              <div className="space-y-2"><Label htmlFor="hora">Horário *</Label><div className="relative"><Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input id="hora" type="time" value={novaAula.hora} onChange={(e) => setNovaAula({ ...novaAula, hora: e.target.value })} className="pl-9" disabled={isLoading} /></div></div>
            </div>

            {/* --- CAMPO TIPO DE AULA REMOVIDO --- */}

            <div className="space-y-2">
              <Label htmlFor="assunto">Assunto da Aula *</Label>
              <Textarea
                id="assunto"
                value={novaAula.assunto}
                onChange={(e) => setNovaAula({ ...novaAula, assunto: e.target.value })}
                placeholder="Descreva o assunto (ex: Revolução Francesa, pág. 10-15 do livro)"
                rows={4}
                disabled={isLoading}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSalvar} className="flex-1" disabled={isLoading}>{isLoading ? (<Loader2 className="w-4 h-4 mr-2 animate-spin" />) : (<Save className="w-4 h-4 mr-2" />)}Salvar Aula</Button>
              <Button variant="outline" onClick={onBack} className="flex-1" disabled={isLoading}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}