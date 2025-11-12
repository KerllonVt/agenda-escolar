// /backend/routes/aulas.js

import express from 'express';
import { query } from '../db.js';
import { isProfessor } from '../authMiddleware.js'; // Importar o "segurança"

const router = express.Router();

/**
 * ROTA: Listar Aulas (Agenda)
 * GET /api/aulas?data_inicio=YYYY-MM-DD&data_fim=YYYY-MM-DD
 */
router.get('/', async (req, res) => {
  const { id_usuario, tipo, id_turma } = req.user; 
  const { data_inicio, data_fim } = req.query; 

  if (!data_inicio || !data_fim) {
    return res.status(400).json({ message: 'Parâmetros data_inicio e data_fim são obrigatórios.' });
  }

  try {
    let aulasQuery = `
      SELECT 
        a.id_aula, 
        TO_CHAR(a.data, 'YYYY-MM-DD') AS data, -- <-- CORREÇÃO ESTÁ AQUI
        a.hora, 
        a.assunto, 
        a.tipo_aula,
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
        return res.json([]); 
      }
      aulasQuery += ' AND a.id_turma = $3';
      params.push(id_turma);
    } else if (tipo === 'professor') {
      aulasQuery += ' AND a.id_professor = $3';
      params.push(id_usuario);
    }
    
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
 */
router.post('/', isProfessor, async (req, res) => {
  const id_professor = req.user.id_usuario;
  const { id_turma, id_materia, data, hora, assunto, tipo_aula } = req.body;

  if (!id_turma || !id_materia || !data || !hora || !assunto || !tipo_aula) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
  }

  try {
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
    res.status(500).json({ message: 'Erro interno no servidor ao criar aula.' });
  }
});

export default router;