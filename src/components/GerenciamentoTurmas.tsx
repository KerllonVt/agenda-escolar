import { ArrowLeft, Users, BookOpen, Calendar, ClipboardList } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { turmas, professorTurmaMateria, materias, agendas } from '../lib/mock-data';

interface GerenciamentoTurmasProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
}

export function GerenciamentoTurmas({ onBack, onNavigate }: GerenciamentoTurmasProps) {
  const { usuario } = useAuth();

  // Buscar turmas do professor
  const turmasDoProfessor = professorTurmaMateria
    .filter(ptm => ptm.id_professor === usuario?.id)
    .map(ptm => {
      const turma = turmas.find(t => t.id === ptm.id_turma);
      const materia = materias.find(m => m.id === ptm.id_materia);
      
      // Contar aulas da semana para essa turma/matéria
      const aulasEstaSemana = agendas.filter(a => {
        const dataAula = new Date(a.data_aula);
        const hoje = new Date('2025-10-13');
        const fimSemana = new Date('2025-10-17');
        return a.id_ptm === ptm.id && dataAula >= hoje && dataAula <= fimSemana;
      }).length;

      return {
        id: ptm.id,
        turma: turma?.nome_turma || '',
        materia: materia?.nome_materia || '',
        descricao: turma?.descricao || '',
        aulasEstaSemana,
        totalAlunos: 28 // Mock
      };
    });

  // Agrupar por turma
  const turmasAgrupadas = turmasDoProfessor.reduce((acc, item) => {
    const turmaExistente = acc.find(t => t.turma === item.turma);
    if (turmaExistente) {
      turmaExistente.materias.push({
        nome: item.materia,
        aulas: item.aulasEstaSemana
      });
    } else {
      acc.push({
        turma: item.turma,
        descricao: item.descricao,
        totalAlunos: item.totalAlunos,
        materias: [{
          nome: item.materia,
          aulas: item.aulasEstaSemana
        }]
      });
    }
    return acc;
  }, [] as any[]);

  const getMateriaColor = (materia: string) => {
    const colors: Record<string, string> = {
      'Matemática': 'bg-blue-100 text-blue-700',
      'Português': 'bg-green-100 text-green-700',
      'História': 'bg-purple-100 text-purple-700',
      'Ciências': 'bg-orange-100 text-orange-700',
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
                      <CardTitle>{turmaInfo.turma}</CardTitle>
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
                    onClick={() => onNavigate('atividades')}
                  >
                    <ClipboardList className="w-4 h-4 mr-2" />
                    Atividades
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {turmasAgrupadas.length === 0 && (
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
