// /backend/routes/materias.js

import express from 'express';
import { query } from '../db.js';

const router = express.Router();

/**
 * (NOVO) ROTA: Listar todas as matérias (com pesquisa)
 * GET /api/materias
 * GET /api/materias?search=mat
 */
router.get('/', async (req, res) => {
  const { search } = req.query;

  try {
    let queryText = 'SELECT * FROM materias';
    const params = [];
    if (search) {
      queryText += ' WHERE nome_materia ILIKE $1';
      params.push(`%${search}%`);
    }
    queryText += ' ORDER BY nome_materia;';
    
    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar matérias:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

/**
 * ROTA: Criar nova matéria
 * POST /api/materias
 */
router.post('/', async (req, res) => {
  const { nome_materia } = req.body;
  if (!nome_materia) {
    return res.status(400).json({ message: 'O nome da matéria é obrigatório.' });
  }
  try {
    const newMateriaQuery = 'INSERT INTO materias (nome_materia) VALUES ($1) RETURNING *;';
    const result = await query(newMateriaQuery, [nome_materia]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
     if (error.code === '23505') { 
      return res.status(409).json({ message: 'Esta matéria já está cadastrada.' });
    }
    console.error('Erro ao criar matéria:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

/**
 * (NOVO) ROTA: Admin atualiza uma matéria
 * PUT /api/materias/:id_materia
 */
router.put('/:id_materia', async (req, res) => {
  const { id_materia } = req.params;
  const { nome_materia } = req.body;

  if (!nome_materia) {
    return res.status(400).json({ message: 'O nome da matéria é obrigatório.' });
  }

  try {
    const result = await query(
      'UPDATE materias SET nome_materia = $1 WHERE id_materia = $2 RETURNING *',
      [nome_materia, id_materia]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Matéria não encontrada.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { return res.status(409).json({ message: 'Este nome de matéria já existe.' }); }
    console.error('Erro ao atualizar matéria:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

/**
 * (NOVO) ROTA: Admin exclui uma matéria
 * DELETE /api/materias/:id_materia
 */
router.delete('/:id_materia', async (req, res) => {
  const { id_materia } = req.params;
  try {
    const result = await query('DELETE FROM materias WHERE id_materia = $1 RETURNING *', [id_materia]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Matéria não encontrada.' });
    }
    res.status(200).json({ message: 'Matéria excluída com sucesso.' });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({ message: 'Não é possível excluir. Esta matéria já está vinculada a professores ou turmas.' });
    }
    console.error('Erro ao excluir matéria:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

export default router;