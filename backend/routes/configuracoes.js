// /backend/routes/configuracoes.js

import express from 'express';
import { query } from '../db.js';
import { isProfessor } from '../authMiddleware.js';

const router = express.Router();

router.use(isProfessor); // Só professor acessa

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
  } catch (error) { res.status(500).json({ message: 'Erro interno no servidor.' }); }
});

router.post('/', async (req, res) => {
  const id_professor = req.user.id_usuario;
  const { id_turma, id_materia, unidade, tipo_avaliacao, peso } = req.body;
  if (!id_turma || !id_materia || !unidade || !tipo_avaliacao || peso === undefined) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
  }
  try {
    const queryText = `
      INSERT INTO configuracao_avaliacao
      (id_professor, id_turma, id_materia, unidade, tipo_avaliacao, peso, ativo)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const params = [id_professor, id_turma, id_materia, unidade, tipo_avaliacao, peso, true];
    const result = await query(queryText, params);
    const newConfig = await query(`
      SELECT cfg.*, t.nome_turma, m.nome_materia
      FROM configuracao_avaliacao cfg
      JOIN turmas t ON cfg.id_turma = t.id_turma
      JOIN materias m ON cfg.id_materia = m.id_materia
      WHERE cfg.id_config = $1;
    `, [result.rows[0].id_config]);
    res.status(201).json(newConfig.rows[0]);
  } catch (error) { res.status(500).json({ message: 'Erro interno no servidor.' }); }
});

router.put('/:id_config/toggle', async (req, res) => {
  const { id_config } = req.params;
  const { ativo } = req.body;
  const id_professor = req.user.id_usuario;
  try {
    const queryText = `
      UPDATE configuracao_avaliacao SET ativo = $1
      WHERE id_config = $2 AND id_professor = $3 RETURNING *;
    `;
    const result = await query(queryText, [ativo, id_config, id_professor]);
    if (result.rows.length === 0) { return res.status(404).json({ message: 'Configuração não encontrada.' }); }
    res.json(result.rows[0]);
  } catch (error) { res.status(500).json({ message: 'Erro interno no servidor.' }); }
});

router.delete('/:id_config', async (req, res) => {
  const { id_config } = req.params;
  const id_professor = req.user.id_usuario;
  try {
    const queryText = `
      DELETE FROM configuracao_avaliacao
      WHERE id_config = $1 AND id_professor = $2 RETURNING *;
    `;
    const result = await query(queryText, [id_config, id_professor]);
    if (result.rows.length === 0) { return res.status(404).json({ message: 'Configuração não encontrada.' }); }
    res.status(200).json({ message: 'Configuração excluída com sucesso.' });
  } catch (error) { res.status(500).json({ message: 'Erro interno no servidor.' }); }
});

export default router;