// /backend/routes/materias.js

import express from 'express';
import { query } from '../db.js';

const router = express.Router();

// --- Listar todas as matérias ---
// GET /api/materias
router.get('/', async (req, res) => {
  try {
    const materiasQuery = 'SELECT * FROM materias ORDER BY nome_materia;';
    const result = await query(materiasQuery);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar matérias:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

// --- Criar nova matéria ---
// POST /api/materias
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
     if (error.code === '23505') { // Erro de nome duplicado
      return res.status(409).json({ message: 'Esta matéria já está cadastrada.' });
    }
    console.error('Erro ao criar matéria:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

// (Rotas de PUT e DELETE podem ser adicionadas aqui depois, se necessário)

export default router;