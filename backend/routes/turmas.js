// /backend/routes/turmas.js

import express from 'express';
import { query } from '../db.js';

const router = express.Router();

// --- Listar todas as turmas ---
// GET /api/turmas
router.get('/', async (req, res) => {
  try {
    // Vamos contar quantos alunos estão em cada turma
    const turmasQuery = `
      SELECT t.*, COUNT(u.id_usuario) AS total_alunos
      FROM turmas t
      LEFT JOIN usuarios u ON t.id_turma = u.id_turma AND u.tipo_usuario = 'aluno'
      GROUP BY t.id_turma
      ORDER BY t.nome_turma;
    `;
    const result = await query(turmasQuery);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar turmas:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

// --- Criar nova turma ---
// POST /api/turmas
router.post('/', async (req, res) => {
  const { nome_turma, serie, ano, turno } = req.body;

  if (!nome_turma || !serie || !ano || !turno) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
  }

  try {
    const newTurmaQuery = `
      INSERT INTO turmas (nome_turma, serie, ano, turno)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const result = await query(newTurmaQuery, [nome_turma, serie, ano, turno]);
    // Retorna a nova turma criada (já com o total_alunos = 0)
    res.status(201).json({...result.rows[0], total_alunos: 0});
  } catch (error) {
    console.error('Erro ao criar turma:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

// --- Atualizar turma ---
// PUT /api/turmas/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nome_turma, serie, ano, turno } = req.body;

  if (!nome_turma || !serie || !ano || !turno) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
  }

  try {
    const updateQuery = `
      UPDATE turmas
      SET nome_turma = $1, serie = $2, ano = $3, turno = $4
      WHERE id_turma = $5
      RETURNING *;
    `;
    const result = await query(updateQuery, [nome_turma, serie, ano, turno, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Turma não encontrada.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar turma:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

// --- Excluir turma ---
// DELETE /api/turmas/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Primeiro, verifica se há alunos na turma
    const checkAlunosQuery = 'SELECT 1 FROM usuarios WHERE id_turma = $1 AND tipo_usuario = $2';
    const resultAlunos = await query(checkAlunosQuery, [id, 'aluno']);

    if (resultAlunos.rows.length > 0) {
      return res.status(400).json({ message: 'Não é possível excluir. Existem alunos vinculados a esta turma.' });
    }

    // Se não houver alunos, exclui
    const deleteQuery = 'DELETE FROM turmas WHERE id_turma = $1 RETURNING *;';
    const result = await query(deleteQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Turma não encontrada.' });
    }
    res.status(200).json({ message: 'Turma excluída com sucesso.' });
  } catch (error) {
    // Captura erro se houver outras restrições (ex: professores vinculados)
    if (error.code === '23503') { // Erro de violação de chave estrangeira
       return res.status(400).json({ message: 'Não é possível excluir. Existem professores ou aulas vinculados a esta turma.' });
    }
    console.error('Erro ao excluir turma:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

export default router;