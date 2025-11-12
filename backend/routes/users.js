// /backend/routes/users.js

import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';

const router = express.Router();

/**
 * ROTA: Listar Usuários (com filtro por tipo)
 * GET /api/users  (lista todos)
 * GET /api/users?tipo=professor (lista só professores)
 */
router.get('/', async (req, res) => {
  // Pega o filtro da URL (query string)
  const { tipo } = req.query; 
  
  let usersQuery = `
    SELECT id_usuario, nome_completo, email, tipo_usuario, id_turma 
    FROM usuarios
  `;
  
  const params = [];

  // Se o filtro 'tipo' foi enviado, adiciona ao WHERE
  if (tipo) {
    usersQuery += ' WHERE tipo_usuario = $1';
    params.push(tipo);
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
 * ROTA: Criar Novo Usuário (Admin)
 * POST /api/users/create
 */
router.post('/create', async (req, res) => {
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

    res.status(201).json({
      message: 'Usuário criado com sucesso!',
      usuario: result.rows[0]
    });

  } catch (error) {
    if (error.code === '23505') { 
      return res.status(409).json({ message: 'Este email já está cadastrado.' });
    }
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

/**
 * ROTA: Alocar Aluno em Turma (Admin)
 * PUT /api/users/alocar-turma
 */
router.put('/alocar-turma', async (req, res) => {
  const { id_aluno, id_turma } = req.body; 

  if (!id_aluno) {
    return res.status(400).json({ message: 'O ID do aluno é obrigatório.' });
  }

  try {
    const updateQuery = `
      UPDATE usuarios
      SET id_turma = $1
      WHERE id_usuario = $2 AND tipo_usuario = 'aluno'
      RETURNING id_usuario, id_turma;
    `;
    
    const result = await query(updateQuery, [id_turma, id_aluno]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Aluno não encontrado ou não é um aluno.' });
    }
    
    res.json({ message: 'Aluno alocado com sucesso!', data: result.rows[0] });

  } catch (error) {
    console.error('Erro ao alocar aluno:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

export default router;