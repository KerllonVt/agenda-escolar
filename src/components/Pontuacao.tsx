import { ArrowLeft, Award, Trophy, Star, TrendingUp, Target, Search, Zap, Sparkles, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { pontuacoes, conquistas, alunosConquistas } from '../lib/mock-data';

interface PontuacaoProps {
  onBack: () => void;
}

// Mapeamento de ícones
const iconMap: Record<string, any> = {
  Star,
  Target,
  Trophy,
  Award,
  TrendingUp,
  Search,
  Zap,
  Sparkles
};

export function Pontuacao({ onBack }: PontuacaoProps) {
  const { usuario } = useAuth();
  
  const pontuacao = pontuacoes.find(p => p.id_aluno === usuario?.id) || {
    id: 1,
    id_aluno: usuario?.id || 1,
    pontos_totais: 1250,
    medalhas: 8,
    nivel: 5
  };

  // Calcula o nível baseado na pontuação
  const getNivelNome = (nivel: number) => {
    if (nivel <= 2) return 'Iniciante';
    if (nivel <= 4) return 'Intermediário';
    if (nivel <= 6) return 'Avançado';
    if (nivel <= 8) return 'Expert';
    return 'Mestre';
  };

  const pontosNoNivelAtual = pontuacao.pontos_totais % 300;
  const pontosPorNivel = 300;
  const pontosFaltando = pontosPorNivel - pontosNoNivelAtual;
  const progresso = (pontosNoNivelAtual / pontosPorNivel) * 100;

  // Busca conquistas do aluno
  const conquistasDoAluno = alunosConquistas
    .filter(ac => ac.id_aluno === usuario?.id)
    .map(ac => ac.id_conquista);

  const conquistasComStatus = conquistas.map(conquista => ({
    ...conquista,
    conquistada: conquistasDoAluno.includes(conquista.id_conquista),
    dataConquista: alunosConquistas.find(
      ac => ac.id_aluno === usuario?.id && ac.id_conquista === conquista.id_conquista
    )?.data_conquista
  }));

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
              <h1 className="text-primary">Pontuação e Conquistas</h1>
              <p className="text-sm text-muted-foreground">
                Acompanhe seu progresso
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Pontuação Principal - Visual Melhorado */}
        <Card className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
          <CardHeader>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <CardDescription className="text-yellow-100">Você é um estudante</CardDescription>
                <CardTitle className="text-5xl text-white mt-2 mb-1">
                  {getNivelNome(pontuacao.nivel)}
                </CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-2xl">
                    {pontuacao.pontos_totais.toLocaleString('pt-BR')} pontos
                  </span>
                </div>
              </div>
              <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                <Trophy className="w-12 h-12" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-white/20 px-3 py-1 rounded-full">
                    <span>Nível {pontuacao.nivel}</span>
                  </div>
                  <span className="text-yellow-100">→</span>
                  <div className="bg-white/10 px-3 py-1 rounded-full border border-white/30">
                    <span>Nível {pontuacao.nivel + 1}</span>
                  </div>
                </div>
              </div>
              <div className="bg-white/20 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-white h-full rounded-full transition-all duration-500"
                  style={{ width: `${progresso}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-yellow-100">
                  {pontosNoNivelAtual} / {pontosPorNivel} pontos
                </p>
                <p className="text-yellow-100">
                  Faltam <strong>{pontosFaltando} pontos</strong>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardDescription>Nível Atual</CardDescription>
                <div className="bg-blue-500 p-2 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
              </div>
              <CardTitle className="text-4xl">{pontuacao.nivel}</CardTitle>
              <p className="text-sm text-muted-foreground">{getNivelNome(pontuacao.nivel)}</p>
            </CardHeader>
          </Card>

          <Card className="border-2 border-yellow-200 bg-yellow-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardDescription>Medalhas</CardDescription>
                <div className="bg-yellow-500 p-2 rounded-lg">
                  <Award className="w-5 h-5 text-white" />
                </div>
              </div>
              <CardTitle className="text-4xl">{pontuacao.medalhas}</CardTitle>
              <p className="text-sm text-muted-foreground">Conquistas desbloqueadas</p>
            </CardHeader>
          </Card>

          <Card className="border-2 border-purple-200 bg-purple-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardDescription>Conquistas</CardDescription>
                <div className="bg-purple-500 p-2 rounded-lg">
                  <Star className="w-5 h-5 text-white" />
                </div>
              </div>
              <CardTitle className="text-4xl">
                {conquistasComStatus.filter(c => c.conquistada).length}/{conquistasComStatus.length}
              </CardTitle>
              <p className="text-sm text-muted-foreground">Badges coletados</p>
            </CardHeader>
          </Card>
        </div>

        {/* Conquistas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>🏆 Suas Conquistas</CardTitle>
                <CardDescription>
                  Continue estudando para desbloquear mais conquistas
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {conquistasComStatus.filter(c => c.conquistada).length}/{conquistasComStatus.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {conquistasComStatus.map((conquista) => {
                const Icon = iconMap[conquista.icone] || Star;
                return (
                  <div
                    key={conquista.id_conquista}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      conquista.conquistada
                        ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300 shadow-sm'
                        : 'bg-gray-50 border-gray-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-3 rounded-xl ${
                          conquista.conquistada
                            ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-md'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4>{conquista.nome}</h4>
                          {conquista.conquistada && (
                            <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300" variant="outline">
                              ✓
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {conquista.descricao}
                        </p>
                        {conquista.conquistada ? (
                          <div className="flex items-center gap-2 text-xs text-green-600">
                            <CheckCircle className="w-3 h-3" />
                            <span>Conquistado em {new Date(conquista.dataConquista || '').toLocaleDateString('pt-BR')}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-blue-500 h-full"
                                style={{ 
                                  width: `${Math.min((pontuacao.pontos_totais / conquista.pontos_necessarios) * 100, 100)}%` 
                                }}
                              ></div>
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {conquista.pontos_necessarios} pts
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Ranking (Preview) */}
        <Card>
          <CardHeader>
            <CardTitle>Ranking da Turma</CardTitle>
            <CardDescription>
              Veja sua posição entre os colegas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { posicao: 1, nome: 'João Santos', pontos: 1450 },
                { posicao: 2, nome: usuario?.nome_completo || 'Maria Silva', pontos: 1250, destaque: true },
                { posicao: 3, nome: 'Ana Costa', pontos: 1180 },
              ].map((aluno) => (
                <div
                  key={aluno.posicao}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    aluno.destaque ? 'bg-blue-50 border border-blue-200' : 'bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        aluno.posicao === 1
                          ? 'bg-yellow-500 text-white'
                          : aluno.posicao === 2
                          ? 'bg-gray-400 text-white'
                          : 'bg-orange-600 text-white'
                      }`}
                    >
                      {aluno.posicao}
                    </div>
                    <span>{aluno.nome}</span>
                  </div>
                  <span>{aluno.pontos.toLocaleString('pt-BR')} pts</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
