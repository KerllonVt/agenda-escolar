// /backend/routes/vinculos.js

import express from 'express';
import { query } from '../db.js';
import { isProfessor } from '../authMiddleware.js'; 

const router = express.Router();

/**
 * (NOVO) ROTA: Listar todos os vínculos (com pesquisa)
 * GET /api/vinculos
 * GET /api/vinculos?search=pedro
 */
router.get('/', async (req, res) => {
  const { search } = req.query;

  try {
    let vinculosQuery = `
      SELECT 
        v.id_ptm, v.id_professor, v.id_turma, v.id_materia,
        u.nome_completo AS nome_professor,
        t.nome_turma, t.serie,
        m.nome_materia
      FROM professores_turmas_materias v
      JOIN usuarios u ON v.id_professor = u.id_usuario
      JOIN turmas t ON v.id_turma = t.id_turma
      JOIN materias m ON v.id_materia = m.id_materia
    `;
    const params = [];
    if (search) {
      vinculosQuery += ' WHERE u.nome_completo ILIKE $1 OR t.nome_turma ILIKE $1 OR m.nome_materia ILIKE $1';
      params.push(`%${search}%`);
    }
    
    vinculosQuery += ' ORDER BY u.nome_completo, t.nome_turma;';
    
    const result = await query(vinculosQuery, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar vínculos:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

/**
 * ROTA: Listar vínculos do professor LOGADO
 * GET /api/vinculos/meus-vinculos
 */
router.get('/meus-vinculos', isProfessor, async (req, res) => {
  const id_professor = req.user.id_usuario;
  try {
    const vinculosQuery = `
      SELECT 
        v.id_ptm, v.id_turma, v.id_materia,
        t.nome_turma, t.serie,
        m.nome_materia
      FROM professores_turmas_materias v
      JOIN turmas t ON v.id_turma = t.id_turma
      JOIN materias m ON v.id_materia = m.id_materia
      WHERE v.id_professor = $1
      ORDER BY t.nome_turma, m.nome_materia;
    `;
    const result = await query(vinculosQuery, [id_professor]);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar vínculos do professor:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});


/**
 * ROTA: Criar novo vínculo (Admin)
 * POST /api/vinculos
 */
router.post('/', async (req, res) => {
  const { id_professor, id_turma, id_materia } = req.body;
  if (!id_professor || !id_turma || !id_materia) {
    return res.status(400).json({ message: 'Professor, turma e matéria são obrigatórios.' });
  }
  try {
    const newVinculoQuery = `
      INSERT INTO professores_turmas_materias (id_professor, id_turma, id_materia)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const result = await query(newVinculoQuery, [id_professor, id_turma, id_materia]);
    
    const getNewVinculoQuery = `
      SELECT 
        v.id_ptm, v.id_professor, v.id_turma, v.id_materia,
        u.nome_completo AS nome_professor,
        t.nome_turma, t.serie,
        m.nome_materia
      FROM professores_turmas_materias v
      JOIN usuarios u ON v.id_professor = u.id_usuario
      JOIN turmas t ON v.id_turma = t.id_turma
      JOIN materias m ON v.id_materia = m.id_materia
      WHERE v.id_ptm = $1;
    `;
    const finalResult = await query(getNewVinculoQuery, [result.rows[0].id_ptm]);
    res.status(201).json(finalResult.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Este vínculo (professor + turma + matéria) já existe.' });
    }
    console.error('Erro ao criar vínculo:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

/**
 * (NOVO) ROTA: Admin atualiza um vínculo
 * PUT /api/vinculos/:id_ptm
 */
router.put('/:id_ptm', async (req, res) => {
  const { id_ptm } = req.params;
  const { id_professor, id_turma, id_materia } = req.body;

  if (!id_professor || !id_turma || !id_materia) {
    return res.status(400).json({ message: 'Professor, turma e matéria são obrigatórios.' });
  }

  try {
    const queryText = `
      UPDATE professores_turmas_materias
      SET id_professor = $1, id_turma = $2, id_materia = $3
      WHERE id_ptm = $4
      RETURNING *;
    `;
    const result = await query(queryText, [id_professor, id_turma, id_materia, id_ptm]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Vínculo não encontrado.' });
    }
    
    // Retorna os dados completos
    const getUpdatedVinculoQuery = `
      SELECT 
        v.id_ptm, v.id_professor, v.id_turma, v.id_materia,
        u.nome_completo AS nome_professor,
        t.nome_turma, t.serie,
        m.nome_materia
      FROM professores_turmas_materias v
      JOIN usuarios u ON v.id_professor = u.id_usuario
      JOIN turmas t ON v.id_turma = t.id_turma
      JOIN materias m ON v.id_materia = m.id_materia
      WHERE v.id_ptm = $1;
    `;
    const finalResult = await query(getUpdatedVinculoQuery, [id_ptm]);
    res.json(finalResult.rows[0]);
    
  } catch (error) {
     if (error.code === '23505') {
      return res.status(409).json({ message: 'Este vínculo (professor + turma + matéria) já existe.' });
    }
    console.error('Erro ao atualizar vínculo:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});


/**
 * ROTA: Excluir um vínculo (Admin)
 * DELETE /api/vinculos/:id_ptm
 */
router.delete('/:id_ptm', async (req, res) => {
  const { id_ptm } = req.params; 
  try {
    const deleteQuery = 'DELETE FROM professores_turmas_materias WHERE id_ptm = $1 RETURNING *;';
    const result = await query(deleteQuery, [id_ptm]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Vínculo não encontrado.' });
    }
    res.status(200).json({ message: 'Vínculo excluído com sucesso.' });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({ message: 'Não é possível excluir. Este vínculo já está sendo usado em aulas ou atividades.' });
    }
    console.error('Erro ao excluir vínculo:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

export default router;