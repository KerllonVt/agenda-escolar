// src/types/index.ts

// Tipos baseados na estrutura do banco de dados

export type TipoUsuario = 'aluno' | 'professor' | 'admin';

export interface Usuario {
  id_usuario: number;
  nome_completo: string;
  email: string;
  senha: string;
  tipo_usuario: TipoUsuario;
  id_turma?: number; // Para alunos - vinculação à turma
  data_cadastro?: string;
}

export interface Turma {
  id_turma: number;
  nome_turma: string; // Ex: "9° A", "1° B"
  serie: string; // Ex: "9° Ano", "1° Ano do Ensino Médio"
  ano: string; // Ex: "2025"
  turno: string; // "Matutino", "Vespertino", "Noturno"
}

export interface Materia {
  id_materia: number;
  nome_materia: string;
}

export interface ProfessorTurmaMateria {
  id_ptm: number;
  id_professor: number;
  id_turma: number;
  id_materia: number;
}

// tipo_aula foi REMOVIDO do banco
// export type TipoAula = 'teórica' | 'prática' | 'atividade';

export interface Aula {
  id_aula: number;
  id_turma: number;
  id_professor: number;
  id_materia: number;
  data: string;
  hora: string;
  assunto: string;
  // tipo_aula: TipoAula; // REMOVIDO
}

export type TipoMaterial = 'pdf' | 'vídeo' | 'texto' | 'link';

export interface Material {
  id_material: number;
  id_aula: number;
  tipo_material: TipoMaterial;
  caminho_arquivo: string; // URL do Vercel Blob ou link externo
  descricao: string;
}

export interface Atividade {
  id_atividade: number;
  id_aula: number | null; // Pode ser nulo
  descricao: string;
  data_entrega: string;
  valor_pontos: number;
  permite_reenvio: boolean;
  data_limite_acesso: string | null;
  // --- CAMPOS NOVOS ADICIONADOS ---
  unidade?: number; // 1, 2, 3, 4
  id_turma?: number | null; // Para atividades avulsas
}

export interface EnvioAtividade {
  id_envio: number;
  id_atividade: number;
  id_aluno: number;
  arquivo_enviado: string | null; // URL do Vercel Blob
  resposta: string | null; // (NOVO) Resposta em texto
  data_envio: string;
  data_atualizacao: string | null;
  nota: number | null; // Agora é 0-100 (ou o valor_pontos)
  comentario_professor: string | null;
}

export interface EnvioAnexo {
  id_anexo: number;
  id_envio: number;
  caminho_arquivo: string;
  tipo_arquivo: string;
  data_upload: string;
}

// --- TIPOS DO BOLETIM ---

export type TipoAvaliacao = 'atividade' | 'caderno' | 'teste' | 'trabalho' | 'prova' | 'outro';

export interface ConfiguracaoAvaliacao {
  id_config: number;
  id_professor: number;
  id_turma: number;
  id_materia: number;
  unidade: number; // 1, 2, 3, 4
  tipo_avaliacao: TipoAvaliacao;
  peso: number; // Peso percentual (0-100)
  ativo: boolean;
}

export interface NotaAvaliacao {
  id_nota: number;
  id_aluno: number;
  id_professor: number;
  id_turma: number;
  id_materia: number;
  unidade: number;
  tipo_avaliacao: TipoAvaliacao;
  nota: number; // 0-10
  data_lancamento: string;
  observacao?: string;
}

// --- TIPOS DE GAMIFICAÇÃO / DESEMPENHO ---

export interface Pontuacao {
  id_pontuacao: number;
  id_aluno: number;
  pontos_totais: number;
  medalhas: number;
  nivel: number;
}

export interface Conquista {
  id_conquista: number;
  nome: string;
  descricao: string;
  pontos_necessarios: number;
  icone: string;
}

export interface AlunoConquista {
  id_aluno: number;
  id_conquista: number;
  data_conquista: string;
}