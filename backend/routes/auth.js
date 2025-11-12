// /backend/routes/auth.js

import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';

const router = express.Router();

/**
 * ROTA DE LOGIN (POST /api/auth/login)
 */
router.post('/login', async (req, res) => {
  const { email, senha, tipo_usuario } = req.body;

  if (!email || !senha || !tipo_usuario) {
    return res.status(400).json({ message: 'Email, senha e tipo são obrigatórios.' });
  }

  try {
    const findUserQuery = 'SELECT * FROM usuarios WHERE email = $1 AND tipo_usuario = $2';
    const userResult = await query(findUserQuery, [email, tipo_usuario]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Credenciais inválidas ou tipo de usuário incorreto.' });
    }

    const usuario = userResult.rows[0];
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

    if (!senhaCorreta) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    // 4. Se a senha estiver correta, criar um Token JWT
    
    // --- (MUDANÇA IMPORTANTE AQUI) ---
    // Criamos o "payload" (carga útil) do token
    const payload = {
      id_usuario: usuario.id_usuario,
      email: usuario.email,
      tipo: usuario.tipo_usuario
    };

    // Se for um aluno E ele tiver uma turma, adicionamos a turma ao token
    if (usuario.tipo_usuario === 'aluno' && usuario.id_turma) {
      payload.id_turma = usuario.id_turma;
    }
    // --- FIM DA MUDANÇA ---

    const token = jwt.sign(
      payload, // Usamos o payload que acabamos de criar
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    delete usuario.senha;
    res.json({ message: 'Login bem-sucedido!', token, usuario });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});


/**
 * ROTA DE REGISTRO (POST /api/auth/register-test)
 */
router.post('/register-test', async (req, res) => {
  const { nome_completo, email, senha, tipo_usuario } = req.body;

  if (!nome_completo || !email || !senha || !tipo_usuario) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    const newUserQuery = `
      INSERT INTO usuarios (nome_completo, email, senha, tipo_usuario)
      VALUES ($1, $2, $3, $4)
      RETURNING id_usuario, nome_completo, email, tipo_usuario, data_cadastro
    `;

    const result = await query(newUserQuery, [nome_completo, email, senhaHash, tipo_usuario]);
    res.status(201).json({ message: 'Usuário de teste criado!', usuario: result.rows[0] });

  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Este email já está cadastrado.' });
    }
    console.error('Erro ao registrar:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

// Exportamos o router para o index.js usar
export default router;