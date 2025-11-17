// /backend/routes/users.js

import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { isAdmin } from '../authMiddleware.js'; 

const router = express.Router();

/**
 * ROTA: Listar Usuários (Professor e Admin)
 * GET /api/users?tipo=aluno
 * GET /api/users?search=maria
 */
router.get('/', async (req, res) => {
  const { tipo, search } = req.query; 
  
  let usersQuery = `
    SELECT id_usuario, nome_completo, email, tipo_usuario, id_turma 
    FROM usuarios
  `;
  const params = [];
  let whereAdded = false;

  if (tipo) {
    usersQuery += ` WHERE tipo_usuario = $${params.length + 1}`;
    params.push(tipo);
    whereAdded = true;
  }
  
  if (search) {
    usersQuery += whereAdded ? ' AND' : ' WHERE';
    usersQuery += ` nome_completo ILIKE $${params.length + 1}`; // ILIKE é case-insensitive
    params.push(`%${search}%`);
  }

  usersQuery += ' ORDER BY nome_completo';

  try {
    const result = await query(usersQuery, params);
    res.json(result.rows); 
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});


/**
 * ROTA: Criar Novo Usuário (APENAS ADMIN)
 * POST /api/users/create
 */
router.post('/create', isAdmin, async (req, res) => {
  const { nome_completo, email, senha, tipo_usuario, id_turma } = req.body;
  if (!nome_completo || !email || !senha || !tipo_usuario) {
    return res.status(400).json({ message: 'Todos os campos obrigatórios devem ser preenchidos.' });
  }
  try {
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);
    const newUserQuery = `
      INSERT INTO usuarios (nome_completo, email, senha, tipo_usuario, id_turma)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id_usuario, nome_completo, email, tipo_usuario, id_turma
    `;
    const turmaDoUsuario = (tipo_usuario === 'aluno' && id_turma) ? id_turma : null;
    const result = await query(newUserQuery, [nome_completo, email, senhaHash, tipo_usuario, turmaDoUsuario]);
    res.status(201).json(result.rows[0]); // Retorna o usuário criado
  } catch (error) {
    if (error.code === '23505') { return res.status(409).json({ message: 'Este email já está cadastrado.' }); }
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

/**
 * ROTA: Alocar Aluno em Turma (APENAS ADMIN)
 * PUT /api/users/alocar-turma
 */
router.put('/alocar-turma', isAdmin, async (req, res) => {
  const { id_aluno, id_turma } = req.body; 
  if (!id_aluno) {
    return res.status(400).json({ message: 'O ID do aluno é obrigatório.' });
  }
  try {
    const updateQuery = `
      UPDATE usuarios SET id_turma = $1
      WHERE id_usuario = $2 AND tipo_usuario = 'aluno'
      RETURNING id_usuario, id_turma;
    `;
    const result = await query(updateQuery, [id_turma, id_aluno]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Aluno não encontrado.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao alocar aluno:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

/**
 * (NOVO) ROTA: Admin atualiza um usuário
 * PUT /api/users/:id_usuario
 */
router.put('/:id_usuario', isAdmin, async (req, res) => {
  const { id_usuario } = req.params;
  const { nome_completo, email, tipo_usuario } = req.body;

  if (!nome_completo || !email || !tipo_usuario) {
    return res.status(400).json({ message: 'Nome, email e tipo são obrigatórios.' });
  }

  try {
    const queryText = `
      UPDATE usuarios
      SET nome_completo = $1, email = $2, tipo_usuario = $3
      WHERE id_usuario = $4
      RETURNING id_usuario, nome_completo, email, tipo_usuario, id_turma;
    `;
    const result = await query(queryText, [nome_completo, email, tipo_usuario, id_usuario]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { return res.status(409).json({ message: 'Este email já está em uso.' }); }
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

/**
 * (NOVO) ROTA: Admin exclui um usuário
 * DELETE /api/users/:id_usuario
 */
router.delete('/:id_usuario', isAdmin, async (req, res) => {
  const { id_usuario } = req.params;
  // Não permitir que o admin se auto-exclua
  if (req.user.id_usuario == id_usuario) {
    return res.status(400).json({ message: 'Você não pode excluir a si mesmo.' });
  }
  
  try {
    // A exclusão vai falhar (erro 23503) se o usuário tiver vínculos (aulas, notas, etc.)
    // Isso é BOM, é uma proteção de integridade do banco.
    const result = await query('DELETE FROM usuarios WHERE id_usuario = $1 RETURNING *', [id_usuario]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    res.status(200).json({ message: 'Usuário excluído com sucesso.' });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({ message: 'Não é possível excluir. Este usuário já possui aulas, notas ou vínculos no sistema.' });
    }
    console.error('Erro ao excluir usuário:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

export default router;