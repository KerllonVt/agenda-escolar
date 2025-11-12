// /backend/routes/atividades.js

import express from 'express';
import { query } from '../db.js';
import { isProfessor } from '../authMiddleware.js'; // Nosso "segurança"

const router = express.Router();

// --- Rota para Professor ---
/**
 * ROTA: Professor cria uma nova atividade
 * POST /api/atividades
 */
router.post('/', isProfessor, async (req, res) => {
  const { id_aula, descricao, data_entrega, valor_pontos, permite_reenvio, data_limite_acesso } = req.body;

  if (!id_aula || !descricao || !data_entrega || !valor_pontos) {
    return res.status(400).json({ message: 'Campos obrigatórios estão faltando.' });
  }

  try {
    const newAtividadeQuery = `
      INSERT INTO atividades (id_aula, descricao, data_entrega, valor_pontos, permite_reenvio, data_limite_acesso)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const params = [
      id_aula,
      descricao,
      data_entrega,
      valor_pontos,
      permite_reenvio,
      data_limite_acesso || null // Permite que data_limite_acesso seja nulo
    ];
    
    const result = await query(newAtividadeQuery, params);
    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('Erro ao criar atividade:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

// --- Rota para Professor ---
/**
 * ROTA: Professor lista os envios pendentes (para AvaliarAtividades.tsx)
 * GET /api/atividades/envios-pendentes
 */
router.get('/envios-pendentes', isProfessor, async (req, res) => {
  const id_professor = req.user.id_usuario;

  try {
    const enviosQuery = `
      SELECT 
        env.id_envio,
        env.data_envio,
        aluno.nome_completo AS nome_aluno,
        at.descricao AS nome_atividade,
        a.id_aula,
        m.nome_materia,
        t.nome_turma,
        env.arquivo_enviado,
        (SELECT COUNT(*) FROM envio_anexo anexo WHERE anexo.id_envio = env.id_envio) AS total_anexos
      FROM envios_atividades env
      JOIN usuarios aluno ON env.id_aluno = aluno.id_usuario
      JOIN atividades at ON env.id_atividade = at.id_atividade
      JOIN aulas a ON at.id_aula = a.id_aula
      JOIN materias m ON a.id_materia = m.id_materia
      JOIN turmas t ON a.id_turma = t.id_turma
      WHERE a.id_professor = $1 AND env.nota IS NULL -- Filtra por professor E por nota pendente
      ORDER BY env.data_envio ASC;
    `;
    const result = await query(enviosQuery, [id_professor]);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar envios pendentes:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

// --- Rota para Professor ---
/**
 * ROTA: Professor avalia (dá nota) um envio
 * PUT /api/atividades/envios/:id_envio/avaliar
 */
router.put('/envios/:id_envio/avaliar', isProfessor, async (req, res) => {
  const { id_envio } = req.params;
  const { nota, comentario_professor } = req.body;
  const id_professor = req.user.id_usuario;

  if (nota === undefined || nota === null) {
    return res.status(400).json({ message: 'A nota é obrigatória.' });
  }
  
  if (parseFloat(nota) < 0 || parseFloat(nota) > 100) {
     return res.status(400).json({ message: 'A nota deve ser entre 0 e 100.' });
  }

  try {
    // Primeiro, verifica se o professor que está avaliando é o mesmo que criou a aula
    const checkOwnerQuery = `
      SELECT 1
      FROM envios_atividades env
      JOIN atividades at ON env.id_atividade = at.id_atividade
      JOIN aulas a ON at.id_aula = a.id_aula
      WHERE env.id_envio = $1 AND a.id_professor = $2;
    `;
    const ownerResult = await query(checkOwnerQuery, [id_envio, id_professor]);

    if (ownerResult.rows.length === 0) {
      return res.status(403).json({ message: 'Você não tem permissão para avaliar esta atividade.' });
    }

    // Se ele for o "dono", atualiza a nota
    const updateQuery = `
      UPDATE envios_atividades
      SET nota = $1, comentario_professor = $2, data_atualizacao = CURRENT_TIMESTAMP
      WHERE id_envio = $3
      RETURNING *;
    `;
    const result = await query(updateQuery, [nota, comentario_professor, id_envio]);
    
    // (Lógica de Pontuação - a ser adicionada depois)
    // Aqui você adicionaria os pontos ao aluno na tabela 'pontuacao'
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao avaliar atividade:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

export default router;