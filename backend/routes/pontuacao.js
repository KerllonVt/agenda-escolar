// /backend/routes/pontuacao.js

import express from 'express';
import { query } from '../db.js';

const router = express.Router();

/**
 * ROTA: Aluno busca seu perfil de pontuação
 * GET /api/pontuacao/minha
 */
router.get('/minha', async (req, res) => {
  const { id_usuario: id_aluno } = req.user;

  try {
    // 1. Busca a pontuação (ou cria se não existir)
    const pontuacaoQuery = `
      INSERT INTO pontuacao (id_aluno, pontos_totais, medalhas, nivel)
      VALUES ($1, 0, 0, 1)
      ON CONFLICT (id_aluno)
      DO UPDATE SET id_aluno = $1 -- Ação vazia, apenas para retornar os dados
      RETURNING *;
    `;
    const pontuacaoResult = await query(pontuacaoQuery, [id_aluno]);
    const pontuacao = pontuacaoResult.rows[0];

    // 2. Busca todas as conquistas disponíveis
    const conquistasResult = await query('SELECT * FROM conquista ORDER BY pontos_necessarios');
    const todasConquistas = conquistasResult.rows;

    // 3. Busca as conquistas que este aluno já possui
    const alunoConquistasResult = await query(
      'SELECT * FROM aluno_conquista WHERE id_aluno = $1',
      [id_aluno]
    );
    const alunoConquistas = alunoConquistasResult.rows;

    // 4. Combina os dados
    const conquistasComStatus = todasConquistas.map(conquista => {
      const conquistada = alunoConquistas.find(ac => ac.id_conquista === conquista.id_conquista);
      return {
        ...conquista,
        conquistada: !!conquistada,
        data_conquista: conquistada ? conquistada.data_conquista : null
      };
    });

    res.json({
      pontuacao,
      conquistas: conquistasComStatus
    });

  } catch (error) {
    console.error('Erro ao buscar pontuação:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

export default router;