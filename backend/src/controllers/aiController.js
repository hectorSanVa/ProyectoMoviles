const aiService = require('../services/aiService');

/**
 * Procesa una pregunta del usuario usando IA
 */
async function processQuestion(req, res) {
  try {
    const { question } = req.body;
    const { total, cart, todayStats } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'La pregunta es requerida' });
    }

    const response = await aiService.processAIQuestion(question, {
      total,
      cart,
      todayStats,
    });

    res.json(response);
  } catch (error) {
    console.error('Error procesando pregunta:', error);
    res.status(500).json({ 
      error: 'Error procesando la pregunta',
      details: error.message 
    });
  }
}

module.exports = {
  processQuestion,
};

