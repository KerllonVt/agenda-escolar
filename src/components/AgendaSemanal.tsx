// src/components/AgendaSemanal.tsx

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, BookOpen, User, Plus, FileText, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Aula } from '../types';

// URL da nossa API (configurada para Vercel)
const API_URL = '/api';

type AulaCompleta = Aula & {
  nome_turma: string;
  nome_materia: string;
  nome_professor: string;
};

interface AgendaSemanalProps {
  onBack: () => void;
  onViewMateriais: (agendaId: number) => void;
}

// --- LÓGICA DE DATA (MOVIDA PARA FORA) ---
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
  for (let i = 0; i < 5; i++) {
    const dia = new Date(segunda);
    dia.setDate(segunda.getDate() + i);
    dias.push(dia);
  }
  
  const fimSemana = new Date(segunda);
  fimSemana.setDate(segunda.getDate() + 4);
  
  return {
    inicio: getISODate(segunda),
    fim: getISODate(fimSemana),
    dias: dias
  };
};

// Data fixa para simulação (pode ser new Date())
const dataSimulada = new Date('2025-10-13T12:00:00Z');
const semana = getSemanaAtual(dataSimulada);

// Os dias da semana são constantes, não precisam ser um "estado"
const diasSemana = semana.dias.map(date => ({
  diaNome: date.toLocaleDateString('pt-BR', { weekday: 'long' }),
  diaMes: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
  dataCompleta: getISODate(date) // Formato YYYY-MM-DD
}));
// --- FIM DA LÓGICA DE DATA ---


export function AgendaSemanal({ onBack, onViewMateriais }: AgendaSemanalProps) {
  const { usuario, token } = useAuth();
  
  const [aulas, setAulas] = useState<AulaCompleta[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Começa carregando

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
        setAulas(data); // Define as aulas
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (token) {
      fetchAgenda();
    }
  }, [token]); // Só depende do token

  // Filtra as aulas (agora o 'aulas.data' vem formatado do backend)
  const getAulasPorDia = (dataCompleta: string) => {
    return aulas.filter(aula => aula.data === dataCompleta);
  };

  const getMateriaColor = (materia: string) => {
    const colors: Record<string, string> = {
      'Matemática': 'bg-blue-100 text-blue-700 border-blue-200',
      'Português': 'bg-green-100 text-green-700 border-green-200',
      'História': 'bg-purple-100 text-purple-700 border-purple-200',
      'Ciências': 'bg-orange-100 text-orange-700 border-orange-200',
      'Física': 'bg-indigo-100 text-indigo-700 border-indigo-200',
      'Geografia': 'bg-yellow-100 text-yellow-700 border-yellow-200', 
    };
    return colors[materia] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-primary">Agenda Semanal</h1>
              <p className="text-sm text-muted-foreground">
                Semana de {diasSemana[0]?.diaMes} a {diasSemana[diasSemana.length - 1]?.diaMes}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
           <div className="flex justify-center items-center py-20">
             <Loader2 className="w-12 h-12 animate-spin text-primary" />
           </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {diasSemana.map((dia) => {
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
                            <Badge className={getMateriaColor(aula.nome_materia)} variant="outline">
                              {aula.nome_materia}
                            </Badge>
                            
                            {usuario?.tipo_usuario === 'professor' && (
                              <Badge variant="secondary" className="mt-1">
                                {aula.nome_turma}
                              </Badge>
                            )}
                            
                            <CardTitle className="text-base mt-2">{aula.assunto}</CardTitle>
                            <CardDescription>
                              <div className="flex items-center gap-1 mt-1">
                                <Clock className="w-3 h-3" />
                                {aula.hora.substring(0, 5)}
                              </div>
                              <div className="flex items-center gap-1 mt-1">
                                <User className="w-3 h-3" />
                                {aula.nome_professor.split(' ')[0]}
                              </div>
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => onViewMateriais(aula.id_aula)}
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              Ver Materiais (0)
                            </Button>
                            
                            {usuario?.tipo_usuario === 'professor' && (
                              <Button variant="outline" size="sm" className="w-full mt-2">
                                <Plus className="w-4 h-4 mr-2" />
                                Adicionar Material
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <Card className="bg-muted">
                        <CardContent className="py-8 text-center text-sm text-muted-foreground">
                          Sem aulas
                        </CardContent>
                      </Card>
                    )}
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