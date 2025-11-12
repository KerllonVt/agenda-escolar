// /backend/routes/aulas.js

import express from 'express';
import { query } from '../db.js';
import { isProfessor } from '../authMiddleware.js'; // Importar o "segurança"

const router = express.Router();

/**
 * ROTA: Listar Aulas (Agenda)
 * GET /api/aulas?data_inicio=YYYY-MM-DD&data_fim=YYYY-MM-DD
 * Rota inteligente:
 * - Se ALUNO: Retorna aulas da sua turma (id_turma vem do token).
 * - Se PROFESSOR: Retorna aulas que ele leciona (id_professor vem do token).
 */
router.get('/', async (req, res) => {
  // req.user é injetado pelo middleware verifyToken
  const { id_usuario, tipo, id_turma } = req.user; 
  
  const { data_inicio, data_fim } = req.query; 

  if (!data_inicio || !data_fim) {
    return res.status(400).json({ message: 'Parâmetros data_inicio e data_fim são obrigatórios.' });
  }

  try {
    let aulasQuery = `
      SELECT 
        a.id_aula, a.data, a.hora, a.assunto, a.tipo_aula,
        t.nome_turma,
        m.nome_materia,
        u.nome_completo AS nome_professor
      FROM aulas a
      JOIN turmas t ON a.id_turma = t.id_turma
      JOIN materias m ON a.id_materia = m.id_materia
      JOIN usuarios u ON a.id_professor = u.id_usuario
      WHERE a.data BETWEEN $1 AND $2
    `;
    const params = [data_inicio, data_fim];

    if (tipo === 'aluno') {
      if (!id_turma) {
        // Aluno sem turma não vê aulas
        return res.json([]); 
      }
      aulasQuery += ' AND a.id_turma = $3';
      params.push(id_turma);
    } else if (tipo === 'professor') {
      aulasQuery += ' AND a.id_professor = $3';
      params.push(id_usuario);
    }
    // Admin (se chegar aqui) vê tudo
    
    aulasQuery += ' ORDER BY a.data, a.hora;';

    const result = await query(aulasQuery, params);
    res.json(result.rows);

  } catch (error) {
    console.error('Erro ao listar aulas:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

/**
 * ROTA: Criar Nova Aula (Professor)
 * POST /api/aulas
 * Protegida pelo middleware 'isProfessor'
 */
router.post('/', isProfessor, async (req, res) => {
  // req.user.id_usuario é o ID do professor logado
  const id_professor = req.user.id_usuario;
  
  const { id_turma, id_materia, data, hora, assunto, tipo_aula } = req.body;

  if (!id_turma || !id_materia || !data || !hora || !assunto || !tipo_aula) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
  }

  try {
    // Verifica se este professor PODE dar esta matéria nesta turma
    const checkVinculoQuery = `
      SELECT 1 FROM professores_turmas_materias
      WHERE id_professor = $1 AND id_turma = $2 AND id_materia = $3
    `;
    const vinculoResult = await query(checkVinculoQuery, [id_professor, id_turma, id_materia]);
    
    if (vinculoResult.rows.length === 0) {
      return res.status(403).json({ message: 'Você não tem permissão para criar esta aula (vínculo professor-turma-matéria não encontrado).' });
    }

    // Se o vínculo existe, cria a aula
    const newAulaQuery = `
      INSERT INTO aulas (id_turma, id_professor, id_materia, data, hora, assunto, tipo_aula)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const params = [id_turma, id_professor, id_materia, data, hora, assunto, tipo_aula];
    const result = await query(newAulaQuery, params);

    res.status(201).json(result.rows[0]);
    
  } catch (error) {
    console.error('Erro ao criar aula:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

export default router;