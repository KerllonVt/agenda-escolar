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

  if (!id_aula || !descricao || !data_entrega || valor_pontos === undefined) {
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
      valor_pontos, // 0-100 para gamificação
      permite_reenvio,
      data_limite_acesso || null 
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
        env.resposta, -- (NOVO) Resposta em texto
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
  
  // Padronizando a nota para 0-10, como no Boletim
  const notaFloat = parseFloat(nota);
  if (isNaN(notaFloat) || notaFloat < 0 || notaFloat > 10) {
     return res.status(400).json({ message: 'A nota deve ser entre 0 e 10.' });
  }

  try {
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

    const updateQuery = `
      UPDATE envios_atividades
      SET nota = $1, comentario_professor = $2, data_atualizacao = CURRENT_TIMESTAMP
      WHERE id_envio = $3
      RETURNING *;
    `;
    const result = await query(updateQuery, [notaFloat, comentario_professor, id_envio]);
    
    // (TODO: Adicionar lógica de Pontuação (gamificação) aqui)
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao avaliar atividade:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});


// --- Rotas para Aluno ---

/**
 * ROTA: Aluno lista suas atividades
 * GET /api/atividades
 */
router.get('/', async (req, res) => {
  const { id_usuario, tipo, id_turma } = req.user;

  // Se for professor, retorna as atividades que ele criou
  if (tipo === 'professor') {
     const profQuery = `
      SELECT at.*, m.nome_materia, t.nome_turma
      FROM atividades at
      JOIN aulas a ON at.id_aula = a.id_aula
      JOIN materias m ON a.id_materia = m.id_materia
      JOIN turmas t ON a.id_turma = t.id_turma
      WHERE a.id_professor = $1
      ORDER BY at.data_entrega DESC;
    `;
    const result = await query(profQuery, [id_usuario]);
    return res.json(result.rows);
  }
  
  // Se for aluno, retorna atividades da sua turma
  if (tipo === 'aluno') {
    if (!id_turma) return res.json([]); // Aluno sem turma
    
    const alunoQuery = `
      SELECT 
        at.*, 
        m.nome_materia,
        env.id_envio,
        env.nota,
        env.data_envio,
        env.comentario_professor
      FROM atividades at
      JOIN aulas a ON at.id_aula = a.id_aula
      JOIN materias m ON a.id_materia = m.id_materia
      -- LEFT JOIN para pegar o envio DESTE aluno
      LEFT JOIN envios_atividades env ON at.id_atividade = env.id_atividade AND env.id_aluno = $1
      WHERE a.id_turma = $2
      AND (at.data_limite_acesso IS NULL OR at.data_limite_acesso >= CURRENT_TIMESTAMP)
      ORDER BY at.data_entrega DESC;
    `;
    const result = await query(alunoQuery, [id_usuario, id_turma]);
    return res.json(result.rows);
  }
  
  // Se for Admin, retorna tudo
  const adminQuery = `SELECT * FROM atividades ORDER BY data_entrega DESC;`;
  const result = await query(adminQuery);
  res.json(result.rows);
});

/**
 * ROTA: Aluno envia uma atividade
 * POST /api/atividades/envios
 */
router.post('/envios', async (req, res) => {
  const { id_aluno } = req.user;
  const { id_atividade, resposta_texto, arquivos } = req.body; // 'arquivos' é um array de nomes

  if (!id_atividade) {
    return res.status(400).json({ message: 'ID da atividade é obrigatório.' });
  }

  try {
    // 1. Verificar se a atividade permite reenvio
    const atividadeQuery = 'SELECT * FROM atividades WHERE id_atividade = $1';
    const atResult = await query(atividadeQuery, [id_atividade]);
    const atividade = atResult.rows[0];

    // 2. Verificar se já existe um envio
    const envioQuery = 'SELECT * FROM envios_atividades WHERE id_atividade = $1 AND id_aluno = $2';
    const envioResult = await query(envioQuery, [id_atividade, id_aluno]);
    const envioExistente = envioResult.rows[0];

    // 3. Se já existe E não permite reenvio
    if (envioExistente && !atividade.permite_reenvio) {
      return res.status(403).json({ message: 'Esta atividade não permite reenvio.' });
    }
    
    // 4. Se já existe E permite reenvio (UPDATE)
    if (envioExistente) {
      const updateQuery = `
        UPDATE envios_atividades
        SET resposta = $1, arquivo_enviado = $2, data_atualizacao = CURRENT_TIMESTAMP, nota = NULL, comentario_professor = NULL
        WHERE id_envio = $3
        RETURNING *;
      `;
      // TODO: Simulação de upload. Apenas salvamos o nome do primeiro arquivo.
      const arquivoNome = arquivos.length > 0 ? arquivos[0].nome : null;
      const result = await query(updateQuery, [resposta_texto, arquivoNome, envioExistente.id_envio]);
      
      // (TODO: Aqui limparia os 'envio_anexo' antigos e salvaria os novos)
      
      return res.json(result.rows[0]);
    }

    // 5. Se não existe (INSERT)
    const insertQuery = `
      INSERT INTO envios_atividades (id_atividade, id_aluno, resposta, arquivo_enviado)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    // TODO: Simulação de upload. Apenas salvamos o nome do primeiro arquivo.
    const arquivoNome = arquivos.length > 0 ? arquivos[0].nome : null;
    const result = await query(insertQuery, [id_atividade, id_aluno, resposta_texto, arquivoNome]);
    const novoEnvio = result.rows[0];
    
    // (TODO: Aqui salvaria os múltiplos 'envio_anexo')

    res.status(201).json(novoEnvio);

  } catch (error) {
    console.error('Erro ao enviar atividade:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

export default router;