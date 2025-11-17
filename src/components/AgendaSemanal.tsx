// src/components/AgendaSemanal.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Clock, BookOpen, User, Plus, FileText, Loader2, Filter } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Aula } from '../types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'; // Importado
import { Label } from './ui/label'; // Importado

// URL da API (local)
const API_URL = 'http://localhost:5000/api';

type AulaCompleta = Aula & {
  nome_turma: string;
  nome_materia: string;
  nome_professor: string;
  total_materiais: string; 
};

interface AgendaSemanalProps {
  onBack: () => void;
  onViewMateriais: (aula: AulaCompleta) => void;
  currentPage: string; 
}

// --- LÓGICA DE DATA ---
const getISODate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};
const getSemanaAtual = (date: Date) => {
  const dataBase = new Date(date);
  const hoje = dataBase.getDay();
  const diffSegunda = dataBase.getDate() - hoje + (hoje === 0 ? -6 : 1);
  const segunda = new Date(dataBase);
  segunda.setDate(diffSegunda);
  const dias = [];
  for (let i = 0; i < 5; i++) { const dia = new Date(segunda); dia.setDate(segunda.getDate() + i); dias.push(dia); }
  const fimSemana = new Date(segunda);
  fimSemana.setDate(segunda.getDate() + 4);
  return {
    inicio: getISODate(segunda),
    fim: getISODate(fimSemana),
    dias: dias
  };
};

const dataSimulada = new Date(); // Usa a data atual
const semana = getSemanaAtual(dataSimulada);
const diasSemana = semana.dias.map(date => ({
  diaNome: date.toLocaleDateString('pt-BR', { weekday: 'long' }),
  diaMes: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
  dataCompleta: getISODate(date)
}));
// --- FIM DA LÓGICA DE DATA ---

export function AgendaSemanal({ onBack, onViewMateriais, currentPage }: AgendaSemanalProps) {
  const { usuario, token } = useAuth();
  const [aulas, setAulas] = useState<AulaCompleta[]>([]); // Todas as aulas do professor
  const [isLoading, setIsLoading] = useState(true); 
  
  // --- (NOVO) Estado para o filtro de turma ---
  const [selectedTurmaId, setSelectedTurmaId] = useState('all'); // 'all' = Todas as turmas

  useEffect(() => {
    const fetchAgenda = async () => {
      setIsLoading(true);
      try {
        const url = `${API_URL}/aulas?data_inicio=${semana.inicio}&data_fim=${semana.fim}`;
        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Falha ao buscar agenda.');
        const data = await response.json();
        setAulas(data); 
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (token && currentPage === 'agenda') {
      fetchAgenda();
    }
  }, [token, currentPage]); 

  // --- (NOVO) Lógica para o Filtro ---
  // 1. Deriva a lista de turmas únicas a partir das aulas buscadas
  const turmasUnicas = useMemo(() => {
    const turmasMap = new Map<number, string>();
    aulas.forEach(aula => {
      if (!turmasMap.has(aula.id_turma)) {
        turmasMap.set(aula.id_turma, aula.nome_turma);
      }
    });
    return Array.from(turmasMap, ([id, nome]) => ({ id_turma: id, nome_turma: nome }));
  }, [aulas]);

  // 2. Filtra as aulas com base na seleção do dropdown
  const aulasFiltradas = useMemo(() => {
    if (selectedTurmaId === 'all') {
      return aulas; // Mostra todas
    }
    return aulas.filter(aula => aula.id_turma.toString() === selectedTurmaId);
  }, [aulas, selectedTurmaId]);

  // 3. Modifica a função de exibição para usar a lista filtrada
  const getAulasPorDia = (dataCompleta: string) => {
    return aulasFiltradas.filter(aula => aula.data === dataCompleta);
  };
  // --- FIM DA LÓGICA DE FILTRO ---

  const getMateriaColor = (materia: string) => {
    const colors: Record<string, string> = {
      'Matemática': 'bg-blue-100 text-blue-700 border-blue-200',
      'Português': 'bg-green-100 text-green-700 border-green-200',
      'História': 'bg-purple-100 text-purple-700 border-purple-200',
      'Geografia': 'bg-yellow-100 text-yellow-700 border-yellow-200', 
    };
    return colors[materia] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <header className="bg-white shadow-sm border-b">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Lado Esquerdo: Voltar e Título */}
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
              <div>
                <h1 className="text-primary">Agenda Semanal</h1>
                <p className="text-sm text-muted-foreground">
                  Semana de {diasSemana[0]?.diaMes} a {diasSemana[diasSemana.length - 1]?.diaMes}
                </p>
              </div>
            </div>
            
            {/* (NOVO) Lado Direito: Filtro (Só para professor com mais de 1 turma) */}
            {usuario?.tipo_usuario === 'professor' && turmasUnicas.length > 1 && (
              <div className="flex items-center gap-2">
                <Label htmlFor="filtro-turma" className="text-sm text-muted-foreground">
                  <Filter className="w-4 h-4 inline-block mr-1" />
                  Ver Turma:
                </Label>
                <Select value={selectedTurmaId} onValueChange={setSelectedTurmaId}>
                  <SelectTrigger id="filtro-turma" className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Turmas</SelectItem>
                    {turmasUnicas.map(turma => (
                      <SelectItem key={turma.id_turma} value={turma.id_turma.toString()}>
                        {turma.nome_turma}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
           <div className="flex justify-center items-center py-20"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {diasSemana.map((dia) => {
              // (MODIFICADO) Usa a função 'getAulasPorDia' que agora respeita o filtro
              const aulasDoDia = getAulasPorDia(dia.dataCompleta);
              const isHoje = dia.dataCompleta === getISODate(dataSimulada); 

              return (
                <div key={dia.diaNome} className="space-y-4">
                  <div className={`text-center p-3 rounded-lg ${isHoje ? 'bg-blue-500 text-white' : 'bg-white'}`}>
                    <div className={`capitalize ${isHoje ? '' : 'text-muted-foreground'}`}>{dia.diaNome}</div>
                    <div>{dia.diaMes}</div>
                  </div>
                  <div className="space-y-3">
                    {aulasDoDia.length > 0 ? (
                      aulasDoDia.map((aula) => (
                        <Card key={aula.id_aula} className="overflow-hidden">
                          <CardHeader className={`pb-3 border-l-4 ${getMateriaColor(aula.nome_materia).split(' ')[0]}`}>
                            <Badge className={getMateriaColor(aula.nome_materia)} variant="outline">{aula.nome_materia}</Badge>
                            {/* O professor sempre verá a turma neste card */}
                            <Badge variant="secondary" className="mt-1">{aula.nome_turma}</Badge>
                            <CardTitle className="text-base mt-2">{aula.assunto}</CardTitle>
                            <div className="text-sm text-muted-foreground">
                              <div className="flex items-center gap-1 mt-1"><Clock className="w-3 h-3" />{aula.hora.substring(0, 5)}</div>
                              <div className="flex items-center gap-1 mt-1"><User className="w-3 h-3" />{aula.nome_professor.split(' ')[0]}</div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => onViewMateriais(aula)}
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              Ver Materiais ({aula.total_materiais})
                            </Button>
                          </CardContent>
                        </Card>
                      ))
                    ) : (<Card className="bg-muted"><CardContent className="py-8 text-center text-sm text-muted-foreground">Sem aulas</CardContent></Card>)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}