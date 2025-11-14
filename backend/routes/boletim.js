// /backend/routes/boletim.js

import express from 'express';
import { query } from '../db.js';

const router = express.Router();

/**
 * ROTA: Aluno busca seu boletim
 * GET /api/boletim
 * (A rota é protegida pelo 'verifyToken' no index.js,
 * então podemos pegar o id_aluno e id_turma do req.user)
 */
router.get('/', async (req, res) => {
  const { id_usuario: id_aluno, id_turma } = req.user;

  if (!id_aluno || !id_turma) {
    return res.status(400).json({ message: 'Usuário não é um aluno ou não está alocado em uma turma.' });
  }

  try {
    // 1. Buscar todas as matérias da turma do aluno
    const materiasQuery = `
      SELECT DISTINCT m.id_materia, m.nome_materia
      FROM professores_turmas_materias ptm
      JOIN materias m ON ptm.id_materia = m.id_materia
      WHERE ptm.id_turma = $1;
    `;
    const materiasResult = await query(materiasQuery, [id_turma]);
    const materias = materiasResult.rows;

    // 2. Buscar todas as configurações de avaliação para essa turma
    const configsQuery = `
      SELECT id_materia, unidade, tipo_avaliacao, peso
      FROM configuracao_avaliacao
      WHERE id_turma = $1 AND ativo = TRUE;
    `;
    const configsResult = await query(configsQuery, [id_turma]);
    const configuracoes = configsResult.rows;
    
    // 3. Buscar TODAS as notas do aluno logado
    const notasQuery = `
      SELECT id_materia, unidade, tipo_avaliacao, nota, observacao, data_lancamento
      FROM notas_avaliacao
      WHERE id_aluno = $1;
    `;
    const notasResult = await query(notasQuery, [id_aluno]);
    const notas = notasResult.rows;

    // 4. Montar o JSON de resposta (processamento no backend)
    const boletim = materias.map(materia => {
      const mediasPorUnidade = [1, 2, 3, 4].map(unidade => {
        
        const configsUnidade = configuracoes.filter(
          c => c.id_materia === materia.id_materia && c.unidade === unidade
        );
        
        const notasUnidade = notas.filter(
          n => n.id_materia === materia.id_materia && n.unidade === unidade
        );

        if (configsUnidade.length === 0) return null; // Sem configuração, sem média

        let somaPonderada = 0;
        let somaPesos = 0;

        configsUnidade.forEach(config => {
          const nota = notasUnidade.find(n => n.tipo_avaliacao === config.tipo_avaliacao);
          if (nota) {
            somaPonderada += nota.nota * (config.peso / 100);
          }
          somaPesos += config.peso / 100;
        });

        // Só calcula a média se houver notas e pesos
        const media = (somaPesos > 0) ? somaPonderada / somaPesos : null;

        return {
          unidade: unidade,
          media: media ? media.toFixed(2) : null,
          notas: notasUnidade.map(n => ({
            tipo: n.tipo_avaliacao,
            nota: n.nota.toFixed(2),
            observacao: n.observacao,
            data: n.data_lancamento
          })),
          configuracoes: configsUnidade.map(c => ({
            tipo: c.tipo_avaliacao,
            peso: c.peso
          }))
        };
      }).filter(u => u !== null); // Remove unidades não configuradas

      const mediasValidas = mediasPorUnidade
        .map(u => u.media ? parseFloat(u.media) : NaN)
        .filter(m => !isNaN(m));
      
      const mediaGeralMateria = mediasValidas.length > 0 
        ? (mediasValidas.reduce((a, b) => a + b, 0) / mediasValidas.length).toFixed(2) 
        : null;

      return {
        id_materia: materia.id_materia,
        nome_materia: materia.nome_materia,
        media_geral: mediaGeralMateria,
        unidades: mediasPorUnidade
      };
    });

    res.json(boletim);

  } catch (error) {
    console.error('Erro ao calcular boletim:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

export default router;