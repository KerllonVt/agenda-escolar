// /backend/routes/notas.js

import express from 'express';
import { query } from '../db.js';
import { isProfessor } from '../authMiddleware.js';

const router = express.Router();

// Middleware para garantir que o usuário é professor
router.use(isProfessor);

/**
 * ROTA: Professor busca as notas já lançadas
 * GET /api/notas
 * Query params: ?id_turma=1&id_materia=1&unidade=1&tipo_avaliacao=prova
 */
router.get('/', async (req, res) => {
  const id_professor = req.user.id_usuario;
  const { id_turma, id_materia, unidade, tipo_avaliacao } = req.query;

  if (!id_turma || !id_materia || !unidade || !tipo_avaliacao) {
    return res.status(400).json({ message: 'Filtros de turma, matéria, unidade e tipo são obrigatórios.' });
  }

  try {
    const queryText = `
      SELECT * FROM notas_avaliacao
      WHERE id_professor = $1
        AND id_turma = $2
        AND id_materia = $3
        AND unidade = $4
        AND tipo_avaliacao = $5;
    `;
    const params = [id_professor, id_turma, id_materia, unidade, tipo_avaliacao];
    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar notas:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

/**
 * ROTA: Professor lança ou atualiza uma nota
 * POST /api/notas/lancar
 */
router.post('/lancar', async (req, res) => {
  const id_professor = req.user.id_usuario;
  const { id_aluno, id_turma, id_materia, unidade, tipo_avaliacao, nota, observacao } = req.body;

  if (nota === undefined || !id_aluno || !id_turma || !id_materia || !unidade || !tipo_avaliacao) {
    return res.status(400).json({ message: 'Dados insuficientes para lançar a nota.' });
  }
  
  const notaFloat = parseFloat(nota);
  if (isNaN(notaFloat) || notaFloat < 0 || notaFloat > 10) {
    return res.status(400).json({ message: 'A nota deve ser um valor entre 0 e 10.' });
  }

  try {
    // UPSERT: Atualiza se existir, insere se não existir.
    const queryText = `
      INSERT INTO notas_avaliacao
      (id_aluno, id_professor, id_turma, id_materia, unidade, tipo_avaliacao, nota, data_lancamento, observacao)
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, $8)
      ON CONFLICT (id_aluno, id_turma, id_materia, unidade, tipo_avaliacao)
      DO UPDATE SET
        nota = EXCLUDED.nota,
        observacao = EXCLUDED.observacao,
        data_lancamento = CURRENT_DATE
      RETURNING *;
    `;
    const params = [id_aluno, id_professor, id_turma, id_materia, unidade, tipo_avaliacao, notaFloat, observacao];
    const result = await query(queryText, params);
    
    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('Erro ao lançar nota:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

export default router;