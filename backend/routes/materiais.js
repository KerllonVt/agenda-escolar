// /backend/routes/materiais.js

import express from 'express';
import { query } from '../db.js';
import { isProfessor } from '../authMiddleware.js';
import { del } from '@vercel/blob'; // <-- 1. NOVO IMPORT

const router = express.Router();

/**
 * ROTA: Lista materiais de uma aula específica
 * GET /api/materiais?aulaId=123
 */
router.get('/', async (req, res) => {
  const { aulaId } = req.query;
  if (!aulaId) {
    return res.status(400).json({ message: 'O ID da aula é obrigatório.' });
  }
  
  try {
    const result = await query(
      'SELECT * FROM materiais WHERE id_aula = $1 ORDER BY id_material',
      [aulaId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar materiais:', error);
    res.status(500).json({ message: 'Erro interno no servidor' });
  }
});

/**
 * ROTA: Professor adiciona um novo material (salva a URL do Blob)
 * POST /api/materiais
 */
router.post('/', isProfessor, async (req, res) => {
  const { id_aula, tipo_material, caminho_arquivo, descricao } = req.body;
  
  if (!id_aula || !tipo_material || !caminho_arquivo) {
    return res.status(400).json({ message: 'Campos obrigatórios faltando.' });
  }

  try {
    const result = await query(
      `INSERT INTO materiais (id_aula, tipo_material, caminho_arquivo, descricao)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id_aula, tipo_material, caminho_arquivo, descricao]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao salvar material:', error);
    res.status(500).json({ message: 'Erro interno no servidor' });
  }
});

// --- 2. ROTA DELETE ADICIONADA ---
/**
 * ROTA: Professor exclui um material
 * DELETE /api/materiais/:id_material
 */
router.delete('/:id_material', isProfessor, async (req, res) => {
  const { id_material } = req.params;
  const id_professor = req.user.id_usuario;

  try {
    // 1. Buscar o material e verificar se o professor é o dono
    const matQuery = await query(
      `SELECT m.caminho_arquivo, a.id_professor, m.tipo_material
       FROM materiais m
       JOIN aulas a ON m.id_aula = a.id_aula
       WHERE m.id_material = $1`,
      [id_material]
    );

    if (matQuery.rows.length === 0) {
      return res.status(404).json({ message: 'Material não encontrado.' });
    }

    const material = matQuery.rows[0];
    if (material.id_professor !== id_professor) {
      return res.status(403).json({ message: 'Você não tem permissão para excluir este material.' });
    }

    // 2. Excluir do Vercel Blob (apenas se não for um link)
    if (material.tipo_material !== 'link' && material.caminho_arquivo.includes('blob.vercel-storage.com')) {
      await del(material.caminho_arquivo);
    }

    // 3. Excluir do nosso banco de dados
    await query('DELETE FROM materiais WHERE id_material = $1', [id_material]);

    res.status(200).json({ message: 'Material excluído com sucesso.' });
    
  } catch (error) {
    console.error('Erro ao excluir material:', error);
    res.status(500).json({ message: 'Erro interno no servidor' });
  }
});

export default router;