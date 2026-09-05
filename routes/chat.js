// ──────────────────────────────────────────────
//  routes/chat.js
//  AI Farming Chatbot using Groq
// ──────────────────────────────────────────────

const express = require('express');
const router  = express.Router();
const Groq    = require('groq-sdk');

let groq;
function getGroq() {
  if (!groq) groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return groq;
}

// In-memory session store
const sessions = {};

setInterval(() => {
  const cutoff = Date.now() - 2 * 60 * 60 * 1000;
  for (const id in sessions) {
    if (sessions[id].lastUsed < cutoff) delete sessions[id];
  }
}, 30 * 60 * 1000);

const SYSTEM_PROMPT = `You are Krishi, a friendly and expert AI farming assistant built for Indian farmers.

Your expertise covers:
- Crop diseases, symptoms, and treatments
- Pest identification and organic/chemical control
- Fertilizers, soil health, and nutrient management
- Irrigation scheduling and water management
- Seasonal farming advice and weather impacts
- Market prices and crop selection tips
- Government schemes for farmers (PM-KISAN, etc.)

Guidelines:
- Be warm, helpful, and practical — farmers need actionable advice
- Keep responses concise but complete (3-5 sentences for simple questions, more for complex ones)
- Use simple language; avoid unnecessary jargon
- When relevant, mention both organic and chemical options
- If asked about local crops, assume Indian farming context (Kharif/Rabi seasons, monsoon climate)
- Always end with an encouraging note when the farmer seems worried

LANGUAGE RULE (very important):
- Always reply in the EXACT same language the farmer writes in — Hindi → reply in हिन्दी, Bangla → বাংলা, Tamil → தமிழ், Telugu → తెలుగు, Marathi → मराठी, Gujarati → ગુજરાતી, Punjabi → ਪੰਜਾਬੀ, Kannada → ಕನ್ನಡ, Malayalam → മലയാളം, English → English.
- Match their script too (e.g. Devanagari for Hindi, Bengali script for Bangla).
- Voice messages arrive as transcribed text in the farmer's own language — treat it the same and reply in that language.
- If the farmer mixes languages, reply in the dominant one.
- Keep crop names, pesticide/fertilizer names, and scientific terms in English where that is more useful, but write the surrounding explanation in the farmer's language.`;

router.post('/', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: 'GROQ_API_KEY is not set. Add it to your .env file or environment settings.' });
    }

    const sid = sessionId || `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    if (!sessions[sid]) {
      sessions[sid] = { history: [], lastUsed: Date.now() };
    }
    sessions[sid].lastUsed = Date.now();

    const history = sessions[sid].history;
    history.push({ role: 'user', content: message.trim() });

    const recentHistory = history.slice(-20);

    const response = await getGroq().chat.completions.create({
      model:    'qwen/qwen3.8-27b',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...recentHistory
      ],
      max_tokens: 700,
      temperature: 0.7
    });

    const reply = response.choices[0].message.content;
    history.push({ role: 'assistant', content: reply });

    res.json({ reply, sessionId: sid });

  } catch (err) {
    console.error('❌ /chat error:', err.message);
    res.status(500).json({ error: 'Chat failed', details: err.message });
  }
});

module.exports = router;