import express from 'express';
import groqService from '../services/groqService.js';

const router = express.Router();

router.post('/chat', async (req, res) => {
  try {
    const { message, location } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const loc = location || { lat: 21.6335, lon: 78.6058 };
    const response = await groqService.chat(message, loc);
    res.json(response);
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ error: 'Failed to process chat message', message: error.message });
  }
});

router.get('/test', (req, res) => {
  res.json({ status: 'Chatbot API running (Groq)', model: 'llama-3.3-70b-versatile' });
});

export default router;
