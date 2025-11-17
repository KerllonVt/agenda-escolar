// /backend/routes/atividades.js

import express from 'express';
import { query } from '../db.js';
import { isProfessor } from '../authMiddleware.js';
import { del } from '@vercel/blob';

const router = express.Router();

// --- Rota para Professor ---
/**
 * ROTA: Professor cria uma nova atividade
 * POST /api/atividades
 */
router.post('/', isProfessor, async (req, res) => {
  const id_professor = req.user.id_usuario;
  const { id_aula, descricao, data_entrega, valor_pontos, permite_reenvio, data_limite_acesso, unidade, id_turma_avulsa } = req.body;
  
  if (!descricao || !data_entrega || !unidade) {
    return res.status(400).json({ message: 'Descrição, Data de Entrega e Unidade são obrigatórios.' });
  }
  
  let id_turma_final = id_turma_avulsa || null;

  // Se estiver vinculado a uma aula, pega a turma da aula
  if (id_aula) {
    try {
      const aulaQuery = await query('SELECT id_turma FROM aulas WHERE id_aula = $1 AND id_professor = $2', [id_aula, id_professor]);
      if (aulaQuery.rows.length === 0) {
        return res.status(403).json({ message: 'Aula não encontrada ou não pertence a você.' });
      }
      id_turma_final = aulaQuery.rows[0].id_turma;
    } catch (error) {
      return res.status(500).json({ message: 'Erro ao verificar aula.' });
    }
  }

  // Se for avulsa, a turma avulsa deve ser fornecida
  if (!id_aula && !id_turma_final) {
    return res.status(400).json({ message: 'Para atividades avulsas, a Turma é obrigatória.' });
  }

  try {
    const newAtividadeQuery = `
      INSERT INTO atividades (id_aula, id_turma, descricao, data_entrega, valor_pontos, permite_reenvio, data_limite_acesso, unidade)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const params = [
      id_aula || null,
      id_turma_final,
      descricao,
      data_entrega,
      valor_pontos || 100,
      permite_reenvio,
      data_limite_acesso || null,
      unidade
    ];
    
    const result = await query(newAtividadeQuery, params);
    
    // Retorna os dados completos para a lista
    const newAtividade = await query(
      `SELECT at.*, m.nome_materia, t.nome_turma, 
              TO_CHAR(a.data, 'YYYY-MM-DD') AS data_aula,
              (SELECT COUNT(*) FROM envios_atividades env WHERE env.id_atividade = at.id_atividade) AS total_envios
       FROM atividades at
       LEFT JOIN aulas a ON at.id_aula = a.id_aula
       LEFT JOIN materias m ON a.id_materia = m.id_materia
       LEFT JOIN turmas t ON at.id_turma = t.id_turma
       WHERE at.id_atividade = $1`,
      [result.rows[0].id_atividade]
    );

    res.status(201).json(newAtividade.rows[0]);
  } catch (error) {
    console.error('Erro ao criar atividade:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

// --- Rota para Professor ---
/**
 * ROTA: Professor lista os envios pendentes (para AvaliarAtividades.tsx)
 */
router.get('/envios-pendentes', isProfessor, async (req, res) => {
  const id_professor = req.user.id_usuario;
  try {
    const enviosQuery = `
      SELECT 
        env.id_envio, env.data_envio, env.resposta, aluno.nome_completo AS nome_aluno,
        at.descricao AS nome_atividade, at.valor_pontos,
        a.id_aula, m.nome_materia, t.nome_turma,
        env.arquivo_enviado, (SELECT COUNT(*) FROM envio_anexo anexo WHERE anexo.id_envio = env.id_envio) AS total_anexos
      FROM envios_atividades env
      JOIN usuarios aluno ON env.id_aluno = aluno.id_usuario
      JOIN atividades at ON env.id_atividade = at.id_atividade
      LEFT JOIN aulas a ON at.id_aula = a.id_aula
      LEFT JOIN materias m ON a.id_materia = m.id_materia
      -- Corrigido: Junta com a turma da atividade (avulsa) ou da aula (vinculada)
      LEFT JOIN turmas t ON t.id_turma = COALESCE(at.id_turma, a.id_turma)
      -- Corrigido: Garante que o professor veja apenas envios de suas turmas/aulas
      WHERE (a.id_professor = $1 OR at.id_turma IN (SELECT id_turma FROM professores_turmas_materias WHERE id_professor = $1))
      AND env.nota IS NULL
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
 */
router.put('/envios/:id_envio/avaliar', isProfessor, async (req, res) => {
  const { id_envio } = req.params;
  const { nota, comentario_professor } = req.body;
  const id_professor = req.user.id_usuario;

  if (nota === undefined || nota === null) {
    return res.status(400).json({ message: 'A nota é obrigatória.' });
  }
  
  try {
    const envioQuery = `
      SELECT env.id_aluno, at.valor_pontos
      FROM envios_atividades env
      JOIN atividades at ON env.id_atividade = at.id_atividade
      LEFT JOIN aulas a ON at.id_aula = a.id_aula
      WHERE env.id_envio = $1 
      -- Corrigido: Verifica se o professor dá aula na turma da atividade
      AND (a.id_professor = $2 OR at.id_turma IN (SELECT id_turma FROM professores_turmas_materias WHERE id_professor = $2));
    `;
    const envioResult = await query(envioQuery, [id_envio, id_professor]);
    
    if (envioResult.rows.length === 0) {
      return res.status(403).json({ message: 'Você não tem permissão para avaliar esta atividade.' });
    }

    const { id_aluno, valor_pontos } = envioResult.rows[0];
    const notaFloat = parseFloat(nota);
    
    if (isNaN(notaFloat) || notaFloat < 0 || notaFloat > valor_pontos) {
       return res.status(400).json({ message: `A nota deve ser entre 0 e ${valor_pontos}.` });
    }

    const updateQuery = `
      UPDATE envios_atividades
      SET nota = $1, comentario_professor = $2, data_atualizacao = CURRENT_TIMESTAMP
      WHERE id_envio = $3
      RETURNING *;
    `;
    const result = await query(updateQuery, [notaFloat, comentario_professor, id_envio]);
    
    const pontuacaoQuery = `
      INSERT INTO pontuacao (id_aluno, pontos_totais)
      VALUES ($1, $2)
      ON CONFLICT (id_aluno)
      DO UPDATE SET
        pontos_totais = pontuacao.pontos_totais + $2;
    `;
    await query(pontuacaoQuery, [id_aluno, Math.round(notaFloat)]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao avaliar atividade:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});


// --- Rotas de Aluno e Gerenciamento ---
/**
 * ROTA: Lista atividades (para Aluno ou Professor)
 */
router.get('/', async (req, res) => {
  const { id_usuario, tipo, id_turma } = req.user;
  try {
    if (tipo === 'professor') {
       const profQuery = `
        SELECT at.*, m.nome_materia, t.nome_turma, 
              TO_CHAR(a.data, 'YYYY-MM-DD') AS data_aula,
              (SELECT COUNT(*) FROM envios_atividades env WHERE env.id_atividade = at.id_atividade) AS total_envios
        FROM atividades at
        LEFT JOIN aulas a ON at.id_aula = a.id_aula
        LEFT JOIN materias m ON a.id_materia = m.id_materia
        -- Corrigido: Junta com a turma da atividade (avulsa) ou da aula (vinculada)
        LEFT JOIN turmas t ON t.id_turma = COALESCE(at.id_turma, a.id_turma)
        -- Corrigido: Professor vê atividades que ele criou (por aula) OU atividades que ele criou (avulsas, por turma)
        WHERE a.id_professor = $1 OR at.id_turma IN (SELECT id_turma FROM professores_turmas_materias WHERE id_professor = $1)
        ORDER BY at.data_entrega DESC;
      `;
      const result = await query(profQuery, [id_usuario]);
      return res.json(result.rows);
    }
    
    if (tipo === 'aluno') {
      if (!id_turma) return res.json([]);
      const alunoQuery = `
        SELECT 
          at.*, m.nome_materia,
          env.id_envio, env.nota, env.data_envio, env.comentario_professor
        FROM atividades at
        LEFT JOIN aulas a ON at.id_aula = a.id_aula
        LEFT JOIN materias m ON a.id_materia = m.id_materia
        LEFT JOIN envios_atividades env ON at.id_atividade = env.id_atividade AND env.id_aluno = $1
        -- Corrigido: Aluno vê atividades da turma (vinculadas ou avulsas)
        WHERE (a.id_turma = $2 OR at.id_turma = $2)
        AND (at.data_limite_acesso IS NULL OR at.data_limite_acesso >= CURRENT_TIMESTAMP)
        ORDER BY at.data_entrega DESC;
      `;
      const result = await query(alunoQuery, [id_usuario, id_turma]);
      return res.json(result.rows);
    }
    
    const adminQuery = `SELECT * FROM atividades ORDER BY data_entrega DESC;`;
    const result = await query(adminQuery);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar atividades:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

/**
 * ROTA: Aluno envia uma atividade
 */
router.post('/envios', async (req, res) => {
  const { id_usuario: id_aluno } = req.user;
  const { id_atividade, resposta_texto, arquivo_url } = req.body; 
  if (!id_atividade) {
    return res.status(400).json({ message: 'ID da atividade é obrigatório.' });
  }
  try {
    const atividadeQuery = 'SELECT * FROM atividades WHERE id_atividade = $1';
    const atResult = await query(atividadeQuery, [id_atividade]);
    const atividade = atResult.rows[0];
    const envioQuery = 'SELECT * FROM envios_atividades WHERE id_atividade = $1 AND id_aluno = $2';
    const envioResult = await query(envioQuery, [id_atividade, id_aluno]);
    const envioExistente = envioResult.rows[0];
    if (envioExistente && !atividade.permite_reenvio) {
      return res.status(403).json({ message: 'Esta atividade não permite reenvio.' });
    }
    if (envioExistente) {
      const updateQuery = `
        UPDATE envios_atividades
        SET resposta = $1, arquivo_enviado = $2, data_atualizacao = CURRENT_TIMESTAMP, nota = NULL, comentario_professor = NULL
        WHERE id_envio = $3 RETURNING *;
      `;
      const urlFinal = arquivo_url || envioExistente.arquivo_enviado;
      const result = await query(updateQuery, [resposta_texto, urlFinal, envioExistente.id_envio]);
      return res.json(result.rows[0]);
    }
    const insertQuery = `
      INSERT INTO envios_atividades (id_atividade, id_aluno, resposta, arquivo_enviado)
      VALUES ($1, $2, $3, $4) RETURNING *;
    `;
    const result = await query(insertQuery, [id_atividade, id_aluno, resposta_texto, arquivo_url]);
    res.status(201).json(result.rows[0]);
  } catch (error) { 
    console.error('Erro ao enviar atividade:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' }); 
  }
});

/**
 * ROTA: Professor atualiza uma atividade
 */
router.put('/:id_atividade', isProfessor, async (req, res) => {
  const { id_atividade } = req.params;
  const { id_aula, descricao, data_entrega, valor_pontos, permite_reenvio, data_limite_acesso, unidade, id_turma_avulsa } = req.body;
  const id_professor = req.user.id_usuario;
  
  if (!descricao || !data_entrega || !unidade) {
    return res.status(400).json({ message: 'Descrição, Data de Entrega e Unidade são obrigatórios.' });
  }

  let id_turma_final = id_turma_avulsa || null;
  if (id_aula) {
    try {
      const aulaQuery = await query('SELECT id_turma FROM aulas WHERE id_aula = $1 AND id_professor = $2', [id_aula, id_professor]);
      if (aulaQuery.rows.length === 0) { return res.status(403).json({ message: 'Aula não encontrada.' }); }
      id_turma_final = aulaQuery.rows[0].id_turma;
    } catch (error) { return res.status(500).json({ message: 'Erro ao verificar aula.' }); }
  }
  if (!id_aula && !id_turma_final) {
    return res.status(400).json({ message: 'Para atividades avulsas, a Turma é obrigatória.' });
  }

  try {
    const queryText = `
      UPDATE atividades
      SET id_aula = $1, id_turma = $2, descricao = $3, data_entrega = $4, valor_pontos = $5, 
          permite_reenvio = $6, data_limite_acesso = $7, unidade = $8
      WHERE id_atividade = $9
      RETURNING *;
    `;
    const params = [ id_aula || null, id_turma_final, descricao, data_entrega, valor_pontos || 100, permite_reenvio, data_limite_acesso || null, unidade, id_atividade ];
    const result = await query(queryText, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Atividade não encontrada.' });
    }
    
    const updatedAtividade = await query(
      `SELECT at.*, m.nome_materia, t.nome_turma, 
              TO_CHAR(a.data, 'YYYY-MM-DD') AS data_aula,
              (SELECT COUNT(*) FROM envios_atividades env WHERE env.id_atividade = at.id_atividade) AS total_envios
       FROM atividades at
       LEFT JOIN aulas a ON at.id_aula = a.id_aula
       LEFT JOIN materias m ON a.id_materia = m.id_materia
       LEFT JOIN turmas t ON t.id_turma = COALESCE(at.id_turma, a.id_turma)
       WHERE at.id_atividade = $1`,
      [result.rows[0].id_atividade]
    );
    
    res.json(updatedAtividade.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar atividade:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

/**
 * ROTA: Professor exclui uma atividade
 */
router.delete('/:id_atividade', isProfessor, async (req, res) => {
  const { id_atividade } = req.params;
  try {
    const enviosQuery = await query(
      'SELECT arquivo_enviado FROM envios_atividades WHERE id_atividade = $1 AND arquivo_enviado IS NOT NULL',
      [id_atividade]
    );
    const urlsParaDeletar = enviosQuery.rows
      .map(e => e.arquivo_enviado)
      .filter(url => url && url.includes('blob.vercel-storage.com'));
    
    if (urlsParaDeletar.length > 0) {
      await del(urlsParaDeletar);
    }
    
    const deleteResult = await query('DELETE FROM atividades WHERE id_atividade = $1 RETURNING *', [id_atividade]);
    
    if (deleteResult.rows.length === 0) {
      return res.status(404).json({ message: 'Atividade não encontrada.' });
    }
    
    res.status(200).json({ message: 'Atividade e todos os envios relacionados foram excluídos.' });
  } catch (error) {
    console.error('Erro ao excluir atividade:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

export default router;