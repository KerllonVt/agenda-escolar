// src/components/Pontuacao.tsx

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Award, Trophy, Star, TrendingUp, Target, Search, Zap, Sparkles, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { Pontuacao as PontuacaoType, Conquista } from '../types';
import { toast } from 'sonner';

const API_URL = 'http://localhost:5000/api';

interface PontuacaoProps {
  onBack: () => void;
}

// Mapeamento de ícones
const iconMap: Record<string, any> = {
  Star, Target, Trophy, Award, TrendingUp, Search, Zap, Sparkles
};

type ConquistaComStatus = Conquista & {
  conquistada: boolean;
  data_conquista: string | null;
};

type PontuacaoData = {
  pontuacao: PontuacaoType;
  conquistas: ConquistaComStatus[];
};

export function Pontuacao({ onBack }: PontuacaoProps) {
  const { token } = useAuth();
  
  const [data, setData] = useState<PontuacaoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPontuacao = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_URL}/pontuacao/minha`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Falha ao buscar pontuação.');
        setData(await response.json());
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    if (token) fetchPontuacao();
  }, [token]);

  // Calcula o nível baseado na pontuação
  const getNivelNome = (nivel: number) => {
    if (nivel <= 2) return 'Iniciante';
    if (nivel <= 4) return 'Intermediário';
    if (nivel <= 6) return 'Avançado';
    if (nivel <= 8) return 'Expert';
    return 'Mestre';
  };

  if (isLoading || !data) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  const { pontuacao, conquistas } = data;
  
  // (Lógica de Nível - 300 pontos por nível)
  const pontosPorNivel = 300;
  const nivelCalculado = Math.floor(pontuacao.pontos_totais / pontosPorNivel) + 1;
  const pontosNoNivelAtual = pontuacao.pontos_totais % pontosPorNivel;
  const pontosFaltando = pontosPorNivel - pontosNoNivelAtual;
  const progresso = (pontosNoNivelAtual / pontosPorNivel) * 100;
  const nomeNivel = getNivelNome(nivelCalculado);

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
        <Card className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
          <CardHeader>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <CardDescription className="text-yellow-100">Você é um estudante</CardDescription>
                <CardTitle className="text-5xl text-white mt-2 mb-1">
                  {nomeNivel}
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
                    <span>Nível {nivelCalculado}</span>
                  </div>
                  <span className="text-yellow-100">→</span>
                  <div className="bg-white/10 px-3 py-1 rounded-full border border-white/30">
                    <span>Nível {nivelCalculado + 1}</span>
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
                {conquistas.filter(c => c.conquistada).length}/{conquistas.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {conquistas.map((conquista) => {
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
                            <span>Conquistado em {new Date(conquista.data_conquista || '').toLocaleDateString('pt-BR')}</span>
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
      </main>
    </div>
  );
}