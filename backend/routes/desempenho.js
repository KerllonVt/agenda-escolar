// /backend/routes/desempenho.js

import express from 'express';
import { query } from '../db.js';

const router = express.Router();

/**
 * ROTA: Aluno busca seu desempenho (somatório de atividades)
 * GET /api/desempenho/meu
 */
router.get('/meu', async (req, res) => {
  const { id_usuario: id_aluno, id_turma } = req.user;

  if (!id_aluno || !id_turma) {
    return res.status(400).json({ message: 'Usuário não é um aluno ou não está alocado em uma turma.' });
  }

  try {
    // 1. Busca todas as matérias da turma do aluno
    const materiasQuery = `
      SELECT DISTINCT m.id_materia, m.nome_materia
      FROM professores_turmas_materias ptm
      JOIN materias m ON ptm.id_materia = m.id_materia
      WHERE ptm.id_turma = $1;
    `;
    const materiasResult = await query(materiasQuery, [id_turma]);
    const materias = materiasResult.rows;

    // 2. Busca todas as atividades e os envios (com notas) do aluno
    const desempenhoQuery = `
      SELECT 
        at.id_atividade,
        at.descricao,
        at.valor_pontos,
        at.unidade,
        a.id_materia,
        env.nota
      FROM envios_atividades env
      JOIN atividades at ON env.id_atividade = at.id_atividade
      LEFT JOIN aulas a ON at.id_aula = a.id_aula
      WHERE env.id_aluno = $1 AND env.nota IS NOT NULL;
    `;
    const desempenhoResult = await query(desempenhoQuery, [id_aluno]);
    const enviosCompletos = desempenhoResult.rows;

    // 3. Processa e agrupa os dados
    const desempenho = materias.map(materia => {
      const unidades = [1, 2, 3, 4].map(unidade => {
        // Filtra os envios para esta matéria e esta unidade
        const enviosDaUnidade = enviosCompletos.filter(
          env => (env.id_materia === materia.id_materia || !env.id_materia) && env.unidade === unidade
        );

        if (enviosDaUnidade.length === 0) {
          return null; // Nenhuma atividade avaliada para esta unidade
        }

        // Calcula o somatório
        const somaNotas = enviosDaUnidade.reduce((sum, env) => sum + parseFloat(env.nota), 0);
        const somaValorMaximo = enviosDaUnidade.reduce((sum, env) => sum + env.valor_pontos, 0);

        return {
          unidade: unidade,
          soma_notas: somaNotas,
          soma_valor_maximo: somaValorMaximo,
          atividades: enviosDaUnidade.map(env => ({
            descricao: env.descricao,
            nota: parseFloat(env.nota),
            valor_maximo: env.valor_pontos
          }))
        };
      }).filter(u => u !== null); // Remove unidades vazias

      return {
        id_materia: materia.id_materia,
        nome_materia: materia.nome_materia,
        unidades: unidades
      };
    });

    res.json(desempenho);

  } catch (error) {
    console.error('Erro ao buscar desempenho:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

export default router;