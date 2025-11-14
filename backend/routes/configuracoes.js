// /backend/routes/configuracoes.js

import express from 'express';
import { query } from '../db.js';
import { isProfessor } from '../authMiddleware.js';

const router = express.Router();

// Middleware para garantir que o usuário é professor
router.use(isProfessor);

/**
 * ROTA: Professor busca suas configurações de avaliação
 * GET /api/configuracoes
 * Filtra por professor logado.
 */
router.get('/', async (req, res) => {
  const id_professor = req.user.id_usuario;

  try {
    const queryText = `
      SELECT cfg.*, t.nome_turma, m.nome_materia
      FROM configuracao_avaliacao cfg
      JOIN turmas t ON cfg.id_turma = t.id_turma
      JOIN materias m ON cfg.id_materia = m.id_materia
      WHERE cfg.id_professor = $1
      ORDER BY t.nome_turma, m.nome_materia, cfg.unidade;
    `;
    const result = await query(queryText, [id_professor]);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

/**
 * ROTA: Professor cria uma nova configuração de avaliação
 * POST /api/configuracoes
 */
router.post('/', async (req, res) => {
  const id_professor = req.user.id_usuario;
  const { id_turma, id_materia, unidade, tipo_avaliacao, peso } = req.body;

  if (!id_turma || !id_materia || !unidade || !tipo_avaliacao || peso === undefined) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
  }

  try {
    // (Opcional) Validar se a soma dos pesos excede 100% (omitido para simplicidade)

    const queryText = `
      INSERT INTO configuracao_avaliacao
      (id_professor, id_turma, id_materia, unidade, tipo_avaliacao, peso, ativo)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const params = [id_professor, id_turma, id_materia, unidade, tipo_avaliacao, peso, true];
    const result = await query(queryText, params);
    
    // Retorna o dado completo com JOINs para o frontend
    const newConfig = await query(`
      SELECT cfg.*, t.nome_turma, m.nome_materia
      FROM configuracao_avaliacao cfg
      JOIN turmas t ON cfg.id_turma = t.id_turma
      JOIN materias m ON cfg.id_materia = m.id_materia
      WHERE cfg.id_config = $1;
    `, [result.rows[0].id_config]);
    
    res.status(201).json(newConfig.rows[0]);

  } catch (error) {
    console.error('Erro ao criar configuração:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

/**
 * ROTA: Professor atualiza o status (ativo/inativo) de uma configuração
 * PUT /api/configuracoes/:id_config/toggle
 */
router.put('/:id_config/toggle', async (req, res) => {
  const { id_config } = req.params;
  const { ativo } = req.body;
  const id_professor = req.user.id_usuario;

  try {
    const queryText = `
      UPDATE configuracao_avaliacao
      SET ativo = $1
      WHERE id_config = $2 AND id_professor = $3
      RETURNING *;
    `;
    const result = await query(queryText, [ativo, id_config, id_professor]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Configuração não encontrada ou não pertence a você.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar status da configuração:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

/**
 * ROTA: Professor exclui uma configuração
 * DELETE /api/configuracoes/:id_config
 */
router.delete('/:id_config', async (req, res) => {
  const { id_config } = req.params;
  const id_professor = req.user.id_usuario;

  try {
    // (Opcional) Adicionar verificação para não excluir se já houver notas lançadas
    
    const queryText = `
      DELETE FROM configuracao_avaliacao
      WHERE id_config = $1 AND id_professor = $2
      RETURNING *;
    `;
    const result = await query(queryText, [id_config, id_professor]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Configuração não encontrada ou não pertence a você.' });
    }
    res.status(200).json({ message: 'Configuração excluída com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir configuração:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});


export default router;