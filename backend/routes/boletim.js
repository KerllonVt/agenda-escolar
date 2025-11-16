// /backend/routes/boletim.js

import express from 'express';
import { query } from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const { id_usuario: id_aluno, id_turma } = req.user;
  if (!id_aluno || !id_turma) {
    return res.status(400).json({ message: 'Usuário não é um aluno ou não está alocado em uma turma.' });
  }
  try {
    const materiasQuery = `
      SELECT DISTINCT m.id_materia, m.nome_materia
      FROM professores_turmas_materias ptm
      JOIN materias m ON ptm.id_materia = m.id_materia
      WHERE ptm.id_turma = $1;
    `;
    const materiasResult = await query(materiasQuery, [id_turma]);
    const materias = materiasResult.rows;

    const configsQuery = `
      SELECT id_materia, unidade, tipo_avaliacao, peso
      FROM configuracao_avaliacao
      WHERE id_turma = $1 AND ativo = TRUE;
    `;
    const configsResult = await query(configsQuery, [id_turma]);
    const configuracoes = configsResult.rows;
    
    const notasQuery = `
      SELECT id_materia, unidade, tipo_avaliacao, nota, observacao, data_lancamento
      FROM notas_avaliacao
      WHERE id_aluno = $1;
    `;
    const notasResult = await query(notasQuery, [id_aluno]);
    const notas = notasResult.rows;

    const boletim = materias.map(materia => {
      const mediasPorUnidade = [1, 2, 3, 4].map(unidade => {
        const configsUnidade = configuracoes.filter(c => c.id_materia === materia.id_materia && c.unidade === unidade);
        const notasUnidade = notas.filter(n => n.id_materia === materia.id_materia && n.unidade === unidade);
        if (configsUnidade.length === 0) return null;
        
        let somaPonderada = 0;
        let somaPesos = 0;
        
        configsUnidade.forEach(config => {
          const nota = notasUnidade.find(n => n.tipo_avaliacao === config.tipo_avaliacao);
          if (nota) { 
            // CORREÇÃO AQUI: Converter nota (string) para número
            somaPonderada += parseFloat(nota.nota) * (config.peso / 100);
          }
          somaPesos += config.peso / 100;
        });

        if (somaPesos === 0) { // Se não houver pesos (ou notas), não há média
            return {
                unidade: unidade,
                media: null,
                notas: notasUnidade.map(n => ({ 
                  tipo: n.tipo_avaliacao, 
                  // CORREÇÃO AQUI: Converter nota (string) para número
                  nota: parseFloat(n.nota).toFixed(2), 
                  observacao: n.observacao, 
                  data: n.data_lancamento 
                })),
                configuracoes: configsUnidade.map(c => ({ tipo: c.tipo_avaliacao, peso: c.peso }))
            };
        }
        
        // Se houver pesos, mas nenhuma nota foi lançada ainda
        if (somaPonderada === 0) {
            const media = 0; // Média é zero se não houver notas
            return {
                unidade: unidade,
                media: media.toFixed(2),
                notas: notasUnidade.map(n => ({ 
                  tipo: n.tipo_avaliacao, 
                  // CORREÇÃO AQUI: Converter nota (string) para número
                  nota: parseFloat(n.nota).toFixed(2), 
                  observacao: n.observacao, 
                  data: n.data_lancamento 
                })),
                configuracoes: configsUnidade.map(c => ({ tipo: c.tipo_avaliacao, peso: c.peso }))
            };
        }

        const media = somaPonderada / somaPesos;

        return {
          unidade: unidade,
          media: media.toFixed(2),
          notas: notasUnidade.map(n => ({ 
            tipo: n.tipo_avaliacao, 
            // CORREÇÃO AQUI: Converter nota (string) para número
            nota: parseFloat(n.nota).toFixed(2), 
            observacao: n.observacao, 
            data: n.data_lancamento 
          })),
          configuracoes: configsUnidade.map(c => ({ tipo: c.tipo_avaliacao, peso: c.peso }))
        };
      }).filter(u => u !== null);
      
      const mediasValidas = mediasPorUnidade.map(u => u.media ? parseFloat(u.media) : NaN).filter(m => !isNaN(m));
      const mediaGeralMateria = mediasValidas.length > 0 ? (mediasValidas.reduce((a, b) => a + b, 0) / mediasValidas.length).toFixed(2) : null;
      
      return {
        id_materia: materia.id_materia,
        nome_materia: materia.nome_materia,
        media_geral: mediaGeralMateria,
        unidades: mediasPorUnidade
      };
    });
    res.json(boletim);
  } catch (error) {
    console.error('Erro ao calcular boletim:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

export default router;