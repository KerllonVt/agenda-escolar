// /backend/db.js

import 'dotenv/config'; // Carrega as variáveis do .env
import pg from 'pg';

// O 'pg' vai ler automaticamente a variável POSTGRES_URL
// que está no seu .env e se conectar
const pool = new pg.Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false // Necessário para conexões com o Neon/Vercel
  }
});

// Exportamos uma função 'query' simples para usarmos no resto da aplicação
export const query = (text, params) => pool.query(text, params);