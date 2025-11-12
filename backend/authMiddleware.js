// /backend/authMiddleware.js

import jwt from 'jsonwebtoken';

// Este middleware vai verificar se o token é válido
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ message: 'Acesso negado. Nenhum token fornecido.' });
  }

  try {
    // Tenta verificar o token com o nosso segredo
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // req.user agora terá { id_usuario, email, tipo, e id_turma (se for aluno) }
    req.user = decoded; 
    next(); // Se o token é válido, continua para a próxima rota
  } catch (error) {
    return res.status(403).json({ message: 'Token inválido ou expirado.' });
  }
};

// Este middleware vai verificar SE o usuário é um Admin
export const isAdmin = (req, res, next) => {
  if (req.user.tipo !== 'admin') {
    return res.status(403).json({ message: 'Acesso negado. Requer privilégios de Administrador.' });
  }
  next(); // Se for admin, continua
};

// --- (NOVO) ---
// Este middleware vai verificar SE o usuário é um Professor
export const isProfessor = (req, res, next) => {
  if (req.user.tipo !== 'professor') {
    return res.status(403).json({ message: 'Acesso negado. Requer privilégios de Professor.' });
  }
  next(); // Se for professor, continua
};