// src/App.tsx

import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { AgendaSemanal } from './components/AgendaSemanal';
import { MateriaisAula } from './components/MateriaisAula';
import { Atividades } from './components/Atividades';
import { Pontuacao } from './components/Pontuacao';
import { PesquisaTema } from './components/PesquisaTema';
import { GerenciamentoTurmas } from './components/GerenciamentoTurmas';
import { Configuracoes } from './components/Configuracoes';
import { PainelAdministrador } from './components/PainelAdministrador';
import { CriarAula } from './components/CriarAula';
import { CriarAtividade } from './components/CriarAtividade';
import { AvaliarAtividades } from './components/AvaliarAtividades';
import { BackendCode } from './components/BackendCode';
import ConfigurarAvaliacoes from './components/ConfigurarAvaliacoes';
import LancarNotas from './components/LancarNotas';
import BoletimAluno from './components/BoletimAluno';
import { Toaster } from './components/ui/sonner';
import { Aula } from './types'; 

// Definimos um tipo mais forte para as Aulas
type AulaCompleta = Aula & {
  nome_turma: string;
  nome_materia: string;
  nome_professor: string;
  total_materiais: string; 
};

function AppContent() {
  const { usuario } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  // Mudamos o tipo para aceitar a Aula Completa
  const [selectedAula, setSelectedAula] = useState<AulaCompleta | null>(null);

  if (!usuario) {
    return <Login onLoginSuccess={() => setCurrentPage('dashboard')} />;
  }

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  // A função agora espera o objeto AulaCompleta
  const handleViewMateriais = (aula: AulaCompleta) => {
    setSelectedAula(aula);
    setCurrentPage('materiais');
  };

  const handleBack = () => {
    if (currentPage === 'materiais') {
      setCurrentPage('agenda'); // Volta para a agenda
    } else {
      setCurrentPage('dashboard'); // Volta para o dashboard
    }
  };

  return (
    <>
      {currentPage === 'dashboard' && (
        <Dashboard onNavigate={handleNavigate} />
      )}
      {/* --- CORREÇÃO AQUI --- */}
      {/* Passamos a prop 'currentPage' que estava faltando */}
      {currentPage === 'agenda' && (
        <AgendaSemanal 
          onBack={handleBack} 
          onViewMateriais={handleViewMateriais}
          currentPage={currentPage}
        />
      )}
      {/* --- FIM DA CORREÇÃO --- */}
      
      {currentPage === 'materiais' && selectedAula && (
        <MateriaisAula 
          aula={selectedAula} 
          onBack={handleBack}
        />
      )}
      {currentPage === 'atividades' && (
        <Atividades onBack={handleBack} />
      )}
      {currentPage === 'pontuacao' && (
        <Pontuacao onBack={handleBack} />
      )}
      {currentPage === 'boletim' && (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center gap-4">
                <button onClick={handleBack} className="text-primary hover:underline">
                  ← Voltar
                </button>
              </div>
            </div>
          </header>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <BoletimAluno />
          </main>
        </div>
      )}
      {currentPage === 'pesquisa' && (
        <PesquisaTema onBack={handleBack} />
      )}
      {currentPage === 'turmas' && (
        <GerenciamentoTurmas 
          onBack={handleBack}
          onNavigate={handleNavigate}
        />
      )}
      {currentPage === 'configuracoes' && (
        <Configuracoes onBack={handleBack} />
      )}
      {currentPage === 'admin' && (
        <PainelAdministrador onBack={handleBack} />
      )}
      {currentPage === 'criar-aula' && (
        <CriarAula onBack={handleBack} />
      )}
      {currentPage === 'criar-atividade' && (
        <CriarAtividade onBack={handleBack} />
      )}
      {currentPage === 'avaliar' && (
        <AvaliarAtividades onBack={handleBack} />
      )}
      {currentPage === 'configurar-avaliacoes' && (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center gap-4">
                <button onClick={handleBack} className="text-primary hover:underline">
                  ← Voltar
                </button>
                <h1 className="text-primary">Configurar Avaliações</h1>
              </div>
            </div>
          </header>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <ConfigurarAvaliacoes />
          </main>
        </div>
      )}
      {currentPage === 'lancar-notas' && (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center gap-4">
                <button onClick={handleBack} className="text-primary hover:underline">
                  ← Voltar
                </button>
                <h1 className="text-primary">Lançar Notas</h1>
              </div>
            </div>
          </header>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <LancarNotas />
          </main>
        </div>
      )}
      {currentPage === 'backend-code' && (
        <BackendCode onBack={handleBack} />
      )}
      <Toaster />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}