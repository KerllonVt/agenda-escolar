// /backend/routes/vinculos.js

import express from 'express';
import { query } from '../db.js';
import { isProfessor } from '../authMiddleware.js'; // Importamos o middleware

const router = express.Router();

/**
 * ROTA: Listar todos os vínculos (Admin)
 * GET /api/vinculos
 */
router.get('/', async (req, res) => {
  try {
    const vinculosQuery = `
      SELECT 
        v.id_ptm, 
        v.id_professor, 
        v.id_turma, 
        v.id_materia,
        u.nome_completo AS nome_professor,
        t.nome_turma,
        t.serie,
        m.nome_materia
      FROM professores_turmas_materias v
      JOIN usuarios u ON v.id_professor = u.id_usuario
      JOIN turmas t ON v.id_turma = t.id_turma
      JOIN materias m ON v.id_materia = m.id_materia
      ORDER BY u.nome_completo, t.nome_turma;
    `;
    const result = await query(vinculosQuery);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar vínculos:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

// --- (NOVO) ---
/**
 * ROTA: Listar vínculos do professor LOGADO (para o dropdown de Criar Aula)
 * GET /api/vinculos/meus-vinculos
 * Esta rota é protegida e requer que o usuário seja um professor
 */
router.get('/meus-vinculos', isProfessor, async (req, res) => {
  // O middleware 'isProfessor' já rodou e verificou o token
  // Podemos pegar o id do professor logado diretamente do req.user
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
    
    // Buscar os dados completos do vínculo recém-criado para retornar ao frontend
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
 * ROTA: Excluir um vínculo (Admin)
 * DELETE /api/vinculos/:id
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params; 

  try {
    const deleteQuery = 'DELETE FROM professores_turmas_materias WHERE id_ptm = $1 RETURNING *;';
    const result = await query(deleteQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Vínculo não encontrado.' });
    }
    res.status(200).json({ message: 'Vínculo excluído com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir vínculo:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

export default router;