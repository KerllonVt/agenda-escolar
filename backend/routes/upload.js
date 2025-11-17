// /backend/routes/upload.js

import express from "express";
import { put } from "@vercel/blob";

const router = express.Router();

// Esta rota agora recebe o arquivo como Base64
router.post("/upload", async (req, res) => {
  try {
    const { filename, data, contentType } = req.body;

    if (!filename || !data) {
      return res.status(400).json({ error: "Arquivo ou nome ausente." });
    }

    // Remove o prefixo (ex: "data:image/png;base64,") se ele existir
    const buffer = Buffer.from(data.split(',')[1] || data, "base64");

    const blob = await put(filename, buffer, {
      access: "public",
      contentType: contentType, // Adiciona o tipo de conteúdo (MUITO IMPORTANTE)
    });

    res.json({
      url: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType,
    });

  } catch (err) {
    console.error("Erro ao fazer upload:", err);
    res.status(500).json({ error: "Erro ao enviar arquivo." });
  }
});

export default router;