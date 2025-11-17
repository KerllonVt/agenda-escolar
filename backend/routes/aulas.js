// /backend/routes/aulas.js

import express from 'express';
import { query } from '../db.js';
import { isProfessor } from '../authMiddleware.js';

const router = express.Router();

/**
 * ROTA: Listar Aulas (Agenda E Dropdowns)
 */
router.get('/', async (req, res) => {
  const { id_usuario, tipo, id_turma } = req.user; 
  const { data_inicio, data_fim } = req.query; 

  try {
    let aulasQuery = `
      SELECT 
        a.id_aula, 
        TO_CHAR(a.data, 'YYYY-MM-DD') AS data, 
        a.hora, 
        a.assunto, 
        -- a.tipo_aula (REMOVIDO)
        t.nome_turma,
        m.nome_materia,
        u.nome_completo AS nome_professor,
        COUNT(mat.id_material) AS total_materiais 
      FROM aulas a
      JOIN turmas t ON a.id_turma = t.id_turma
      JOIN materias m ON a.id_materia = m.id_materia
      JOIN usuarios u ON a.id_professor = u.id_usuario
      LEFT JOIN materiais mat ON a.id_aula = mat.id_aula
    `;
    const params = [];

    if (tipo === 'aluno') {
      if (!id_turma) { return res.json([]); }
      aulasQuery += ' WHERE a.id_turma = $1';
      params.push(id_turma);
    } else if (tipo === 'professor') {
      aulasQuery += ' WHERE a.id_professor = $1';
      params.push(id_usuario);
    } else {
      aulasQuery += ' WHERE 1=1';
    }

    if (data_inicio && data_fim) {
      const paramIndex = params.length + 1;
      aulasQuery += ` AND a.data BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      params.push(data_inicio, data_fim);
    }
    
    aulasQuery += `
      GROUP BY a.id_aula, t.nome_turma, m.nome_materia, u.nome_completo
      ORDER BY a.data DESC, a.hora;
    `;

    const result = await query(aulasQuery, params);
    res.json(result.rows);

  } catch (error) {
    console.error('Erro ao listar aulas:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

/**
 * ROTA: Criar Nova Aula (Professor)
 */
router.post('/', isProfessor, async (req, res) => {
  const id_professor = req.user.id_usuario;
  // --- TIPO_AULA REMOVIDO ---
  const { id_turma, id_materia, data, hora, assunto } = req.body;

  if (!id_turma || !id_materia || !data || !hora || !assunto) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
  }

  try {
    const checkVinculoQuery = `
      SELECT 1 FROM professores_turmas_materias
      WHERE id_professor = $1 AND id_turma = $2 AND id_materia = $3
    `;
    const vinculoResult = await query(checkVinculoQuery, [id_professor, id_turma, id_materia]);
    if (vinculoResult.rows.length === 0) {
      return res.status(403).json({ message: 'Você não tem permissão para criar esta aula.' });
    }

    // --- TIPO_AULA REMOVIDO DA QUERY ---
    const newAulaQuery = `
      INSERT INTO aulas (id_turma, id_professor, id_materia, data, hora, assunto)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const params = [id_turma, id_professor, id_materia, data, hora, assunto];
    const result = await query(newAulaQuery, params);

    res.status(201).json(result.rows[0]);
    
  } catch (error) {
    console.error('Erro ao criar aula:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

export default router;