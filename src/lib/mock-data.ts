// Dados mock baseados na estrutura do banco de dados
import { Usuario, Turma, Materia, ProfessorTurmaMateria, Agenda, MaterialAula, Atividade, EnvioAtividade, Pontuacao, EnvioAnexo, Conquista, AlunoConquista } from '../types';

export const usuarios: Usuario[] = [
  {
    id: 1,
    nome_completo: 'Maria Silva',
    email: 'maria@escola.com',
    senha: '123456',
    tipo: 'aluno',
    data_cadastro: '2024-01-10'
  },
  {
    id: 2,
    nome_completo: 'João Santos',
    email: 'joao@escola.com',
    senha: '123456',
    tipo: 'aluno',
    data_cadastro: '2024-01-10'
  },
  {
    id: 3,
    nome_completo: 'Prof. Carlos Oliveira',
    email: 'carlos@escola.com',
    senha: '123456',
    tipo: 'professor',
    data_cadastro: '2024-01-05'
  },
  {
    id: 4,
    nome_completo: 'Profa. Ana Costa',
    email: 'ana@escola.com',
    senha: '123456',
    tipo: 'professor',
    data_cadastro: '2024-01-05'
  }
];

export const turmas: Turma[] = [
  {
    id: 1,
    nome_turma: '3º Ano A',
    descricao: 'Turma do terceiro ano do ensino médio'
  },
  {
    id: 2,
    nome_turma: '2º Ano B',
    descricao: 'Turma do segundo ano do ensino médio'
  }
];

export const materias: Materia[] = [
  {
    id: 1,
    nome_materia: 'Matemática',
    descricao: 'Disciplina de Matemática'
  },
  {
    id: 2,
    nome_materia: 'Português',
    descricao: 'Disciplina de Língua Portuguesa'
  },
  {
    id: 3,
    nome_materia: 'História',
    descricao: 'Disciplina de História'
  },
  {
    id: 4,
    nome_materia: 'Ciências',
    descricao: 'Disciplina de Ciências'
  }
];

export const professorTurmaMateria: ProfessorTurmaMateria[] = [
  { id: 1, id_professor: 3, id_turma: 1, id_materia: 1 },
  { id: 2, id_professor: 3, id_turma: 2, id_materia: 1 },
  { id: 3, id_professor: 4, id_turma: 1, id_materia: 2 },
  { id: 4, id_professor: 4, id_turma: 1, id_materia: 3 }
];

export const agendas: Agenda[] = [
  {
    id: 1,
    data_aula: '2025-10-13',
    horario_inicio: '08:00',
    horario_fim: '09:30',
    assunto: 'Funções Quadráticas',
    id_ptm: 1
  },
  {
    id: 2,
    data_aula: '2025-10-13',
    horario_inicio: '09:45',
    horario_fim: '11:15',
    assunto: 'Análise Sintática',
    id_ptm: 3
  },
  {
    id: 3,
    data_aula: '2025-10-14',
    horario_inicio: '08:00',
    horario_fim: '09:30',
    assunto: 'Segunda Guerra Mundial',
    id_ptm: 4
  },
  {
    id: 4,
    data_aula: '2025-10-14',
    horario_inicio: '09:45',
    horario_fim: '11:15',
    assunto: 'Equações de Segundo Grau',
    id_ptm: 1
  },
  {
    id: 5,
    data_aula: '2025-10-15',
    horario_inicio: '08:00',
    horario_fim: '09:30',
    assunto: 'Interpretação de Texto',
    id_ptm: 3
  }
];

export const materiaisAula: MaterialAula[] = [
  {
    id: 1,
    tipo: 'pdf',
    caminho: '/materiais/funcoes-quadraticas.pdf',
    descricao: 'Apostila sobre funções quadráticas',
    id_agenda: 1
  },
  {
    id: 2,
    tipo: 'vídeo',
    caminho: 'https://youtube.com/watch?v=exemplo',
    descricao: 'Vídeo explicativo sobre parábolas',
    id_agenda: 1
  },
  {
    id: 3,
    tipo: 'documento',
    caminho: '/materiais/analise-sintatica.docx',
    descricao: 'Exercícios de análise sintática',
    id_agenda: 2
  }
];

export const atividades: Atividade[] = [
  {
    id: 1,
    titulo: 'Exercícios de Funções Quadráticas',
    descricao: 'Resolver os exercícios 1 a 10 da apostila',
    data_envio: '2025-10-13',
    data_limite: '2025-10-20',
    id_agenda: 1
  },
  {
    id: 2,
    titulo: 'Redação sobre a Segunda Guerra',
    descricao: 'Escrever uma redação de 20 linhas sobre as causas da Segunda Guerra Mundial',
    data_envio: '2025-10-14',
    data_limite: '2025-10-21',
    id_agenda: 3
  }
];

export const enviosAtividade: EnvioAtividade[] = [
  {
    id: 1,
    id_atividade: 1,
    id_aluno: 1,
    resposta: 'Resolvi todos os exercícios conforme solicitado.',
    arquivo: '/envios/maria-funcoes.pdf',
    status: 'aprovado',
    pontuacao: 95,
    observacao_professor: 'Excelente trabalho!'
  },
  {
    id: 2,
    id_atividade: 2,
    id_aluno: 1,
    resposta: 'Segue minha redação em anexo.',
    arquivo: '/envios/maria-redacao.pdf',
    status: 'enviado'
  }
];

export const pontuacoes: Pontuacao[] = [
  {
    id: 1,
    id_aluno: 1,
    pontos_totais: 1250,
    medalhas: 8,
    nivel: 5
  },
  {
    id: 2,
    id_aluno: 2,
    pontos_totais: 890,
    medalhas: 5,
    nivel: 4
  }
];

// Tabela para múltiplos anexos de atividades
export const enviosAnexos: EnvioAnexo[] = [
  {
    id_anexo: 1,
    id_envio: 1,
    caminho_arquivo: '/envios/maria-funcoes.pdf',
    tipo_arquivo: 'application/pdf',
    data_upload: '2025-10-14 10:30:00'
  },
  {
    id_anexo: 2,
    id_envio: 1,
    caminho_arquivo: '/envios/maria-funcoes-resolucao.jpg',
    tipo_arquivo: 'image/jpeg',
    data_upload: '2025-10-14 10:32:00'
  }
];

// Tabela de conquistas disponíveis
export const conquistas: Conquista[] = [
  {
    id_conquista: 1,
    nome: 'Primeira Atividade',
    descricao: 'Completou sua primeira atividade',
    pontos_necessarios: 50,
    icone: 'Star'
  },
  {
    id_conquista: 2,
    nome: 'Estudante Dedicado',
    descricao: 'Completou 10 atividades',
    pontos_necessarios: 500,
    icone: 'Target'
  },
  {
    id_conquista: 3,
    nome: 'Mestre da Matemática',
    descricao: 'Tirou nota máxima em 5 atividades de matemática',
    pontos_necessarios: 750,
    icone: 'Trophy'
  },
  {
    id_conquista: 4,
    nome: 'Pontual',
    descricao: 'Entregou 10 atividades antes do prazo',
    pontos_necessarios: 600,
    icone: 'Award'
  },
  {
    id_conquista: 5,
    nome: 'Persistente',
    descricao: 'Refez 3 atividades até alcançar nota máxima',
    pontos_necessarios: 400,
    icone: 'TrendingUp'
  },
  {
    id_conquista: 6,
    nome: 'Explorador',
    descricao: 'Usou o recurso de pesquisa 20 vezes',
    pontos_necessarios: 300,
    icone: 'Search'
  },
  {
    id_conquista: 7,
    nome: 'Nota 100',
    descricao: 'Tirou nota 100 em uma atividade',
    pontos_necessarios: 200,
    icone: 'Star'
  },
  {
    id_conquista: 8,
    nome: 'Sequência Perfeita',
    descricao: 'Completou 5 atividades seguidas sem erros',
    pontos_necessarios: 800,
    icone: 'Zap'
  }
];

// Relacionamento entre alunos e conquistas
export const alunosConquistas: AlunoConquista[] = [
  {
    id_aluno: 1,
    id_conquista: 1,
    data_conquista: '2025-09-15 14:20:00'
  },
  {
    id_aluno: 1,
    id_conquista: 2,
    data_conquista: '2025-10-01 16:45:00'
  },
  {
    id_aluno: 1,
    id_conquista: 3,
    data_conquista: '2025-10-10 11:30:00'
  },
  {
    id_aluno: 1,
    id_conquista: 4,
    data_conquista: '2025-10-05 09:15:00'
  },
  {
    id_aluno: 1,
    id_conquista: 7,
    data_conquista: '2025-10-12 15:00:00'
  }
];
