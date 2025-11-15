const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authMiddleware } = require('../middleware/auth');
const config = require('../config/config');

// Ruta de diagnóstico (sin autenticación para debugging)
router.get('/status', (req, res) => {
  res.json({
    huggingface_configured: !!config.huggingface.apiKey,
    token_length: config.huggingface.apiKey ? config.huggingface.apiKey.length : 0,
    token_preview: config.huggingface.apiKey ? config.huggingface.apiKey.substring(0, 10) + '...' : 'NO CONFIGURADO',
    model: config.huggingface.model,
    api_url: config.huggingface.apiUrl,
    env_var_exists: !!process.env.HUGGINGFACE_API_KEY,
  });
});

// Ruta para procesar preguntas con IA gratuita
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { question } = req.body;
    const { total, cart, todayStats, products } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'La pregunta es requerida' });
    }

    const aiService = require('../services/aiService');
    const response = await aiService.processAIQuestion(question, {
      total,
      cart,
      todayStats,
      products,
    });

    res.json(response);
  } catch (error) {
    console.error('Error procesando pregunta:', error);
    res.status(500).json({ 
      error: 'Error procesando la pregunta',
      details: error.message 
    });
  }
});

module.exports = router;
