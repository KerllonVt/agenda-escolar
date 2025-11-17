// src/components/GerenciamentoTurmas.tsx

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, BookOpen, Calendar, ClipboardList, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useAuth } from '../contexts/AuthContext';
// --- CORREÇÃO AQUI ---
import { ProfessorTurmaMateria, Aula, Usuario } from '../types';
// --- FIM DA CORREÇÃO ---
import { toast } from 'sonner';

const API_URL = 'http://localhost:5000/api';

interface GerenciamentoTurmasProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
}

// Tipos de dados da API
type VinculoProfessor = ProfessorTurmaMateria & {
  nome_turma: string;
  serie: string;
  nome_materia: string;
};
type AulaSimples = Partial<Aula> & {
  id_turma: number;
  id_materia: number;
};

export function GerenciamentoTurmas({ onBack, onNavigate }: GerenciamentoTurmasProps) {
  const { usuario, token } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [turmasAgrupadas, setTurmasAgrupadas] = useState<any[]>([]);

  // Helper para pegar datas da semana
  const getISODate = (date: Date): string => date.toISOString().split('T')[0];
  const getSemanaAtual = () => {
    const hoje = new Date();
    const dataBase = new Date(hoje);
    const diaSemana = dataBase.getDay();
    const diffSegunda = dataBase.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
    const segunda = new Date(dataBase.setDate(diffSegunda));
    const sexta = new Date(segunda);
    sexta.setDate(segunda.getDate() + 4);
    return { inicio: getISODate(segunda), fim: getISODate(sexta) };
  };

  useEffect(() => {
    const carregarDados = async () => {
      if (!token) return;
      setIsLoading(true);
      try {
        const semana = getSemanaAtual();

        // 1. Buscar os vínculos (Turmas e Matérias do professor)
        const vinculosRes = await fetch(`${API_URL}/vinculos/meus-vinculos`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!vinculosRes.ok) throw new Error('Falha ao buscar turmas.');
        const vinculosData: VinculoProfessor[] = await vinculosRes.json();

        // 2. Buscar as aulas da semana (para contagem)
        const aulasRes = await fetch(`${API_URL}/aulas?data_inicio=${semana.inicio}&data_fim=${semana.fim}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!aulasRes.ok) throw new Error('Falha ao buscar agenda da semana.');
        const aulasData: AulaSimples[] = await aulasRes.json();

        // 3. Buscar todos os alunos (para contagem)
        const alunosRes = await fetch(`${API_URL}/users?tipo=aluno`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!alunosRes.ok) throw new Error('Falha ao buscar alunos.');
        const alunosData: Usuario[] = await alunosRes.json(); // Agora 'Usuario' está importado

        // 4. Agrupar os dados (lógica de frontend)
        const agrupado = vinculosData.reduce((acc, vinculo) => {
          let turma = acc.find(t => t.id_turma === vinculo.id_turma);

          if (!turma) {
            // Contar alunos na turma
            const totalAlunos = alunosData.filter(a => a.id_turma === vinculo.id_turma).length;
            turma = {
              id_turma: vinculo.id_turma,
              nome_turma: vinculo.nome_turma,
              descricao: vinculo.serie,
              totalAlunos: totalAlunos,
              materias: []
            };
            acc.push(turma);
          }

          // Contar aulas da semana para esta matéria
          const aulasEstaSemana = aulasData.filter(
            a => a.id_turma === vinculo.id_turma && a.id_materia === vinculo.id_materia
          ).length;

          turma.materias.push({
            nome: vinculo.nome_materia,
            aulas: aulasEstaSemana
          });

          return acc;
        }, [] as any[]);

        setTurmasAgrupadas(agrupado);
        
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    carregarDados();
  }, [token]);

  const getMateriaColor = (materia: string) => {
    const colors: Record<string, string> = {
      'Matemática': 'bg-blue-100 text-blue-700',
      'Português': 'bg-green-100 text-green-700',
      'História': 'bg-purple-100 text-purple-700',
      'Geografia': 'bg-yellow-100 text-yellow-700',
    };
    return colors[materia] || 'bg-gray-100 text-gray-700';
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
            <div>
              <h1 className="text-primary">Minhas Turmas</h1>
              <p className="text-sm text-muted-foreground">
                Gerencie suas turmas e matérias
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {turmasAgrupadas.map((turmaInfo, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-500 p-3 rounded-lg">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle>{turmaInfo.nome_turma}</CardTitle>
                        <CardDescription className="mt-1">
                          {turmaInfo.descricao}
                        </CardDescription>
                        <div className="flex items-center gap-2 mt-3">
                          <Badge variant="secondary">
                            {turmaInfo.totalAlunos} alunos
                          </Badge>
                          <Badge variant="secondary">
                            {turmaInfo.materias.length} {turmaInfo.materias.length === 1 ? 'matéria' : 'matérias'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Matérias */}
                  <div>
                    <h4 className="mb-2 text-muted-foreground">Matérias que você leciona:</h4>
                    <div className="space-y-2">
                      {turmaInfo.materias.map((materia: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted"
                        >
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            <span>{materia.nome}</span>
                          </div>
                          <Badge className={getMateriaColor(materia.nome)} variant="outline">
                            {materia.aulas} {materia.aulas === 1 ? 'aula' : 'aulas'} esta semana
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ações Rápidas */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => onNavigate('agenda')}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Agenda
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => onNavigate('criar-atividade')}
                    >
                      <ClipboardList className="w-4 h-4 mr-2" />
                      Atividades
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && turmasAgrupadas.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Você ainda não está vinculado a nenhuma turma
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}