// /backend/index.js

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { query } from './db.js';

import { verifyToken, isAdmin, isProfessor } from './authMiddleware.js'; 
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import turmasRoutes from './routes/turmas.js';            
import materiasRoutes from './routes/materias.js';
import vinculosRoutes from './routes/vinculos.js';
import aulasRoutes from './routes/aulas.js';
import atividadesRoutes from './routes/atividades.js';
import configuracoesRoutes from './routes/configuracoes.js';
import notasRoutes from './routes/notas.js';
import boletimRoutes from './routes/boletim.js';
import uploadRoutes from './routes/upload.js';
import materiaisRoutes from './routes/materiais.js';
import desempenhoRoutes from './routes/desempenho.js';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' })); 

app.get('/api', (req, res) => { res.json({ message: 'O backend da Agenda Escolar está no ar! 🚀' }); });
app.get('/api/test-db', async (req, res) => { /* ... (código de teste) ... */ });
app.use('/api/auth', authRoutes);

app.use('/api/turmas', verifyToken, isAdmin, turmasRoutes);
app.use('/api/materias', verifyToken, isAdmin, materiasRoutes);

app.use('/api/users', verifyToken, usersRoutes); 
app.use('/api/vinculos', verifyToken, vinculosRoutes); 

app.use('/api/configuracoes', verifyToken, isProfessor, configuracoesRoutes);
app.use('/api/notas', verifyToken, isProfessor, notasRoutes);

app.use('/api/aulas', verifyToken, aulasRoutes);
app.use('/api/atividades', verifyToken, atividadesRoutes);
app.use('/api/boletim', verifyToken, boletimRoutes);
app.use('/api/materiais', verifyToken, materiaisRoutes);
app.use('/api/upload', verifyToken, uploadRoutes);
app.use('/api/desempenho', verifyToken, desempenhoRoutes);

app.listen(port, () => {
  console.log(`🚀 Servidor backend rodando na porta ${port}`);
});