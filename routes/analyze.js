// ──────────────────────────────────────────────
//  routes/analyze.js
//  Crop disease detection using Groq Vision
// ──────────────────────────────────────────────

const express = require('express');
const router  = express.Router();
const Groq    = require('groq-sdk');

let groq;
function getGroq() {
  if (!groq) groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return groq;
}

router.post('/analyze', async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No image provided. Send { image: base64string }' });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: 'GROQ_API_KEY is not set. Add it to your .env file or environment settings.' });
    }

    const response = await getGroq().chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        {
          role: 'user',
          content: [
            {
              type:      'image_url',
              image_url: { url: `data:image/jpeg;base64,${image}` }
            },
            {
              type: 'text',
              text: `You are a senior agricultural scientist with 20+ years of experience in crop disease diagnosis.

Carefully analyze this crop image and identify any plant diseases, pest damage, or nutrient deficiencies.

Respond ONLY in valid JSON — no markdown fences, no extra text, just raw JSON:
{
  "disease": "Exact disease name, or 'Healthy Plant' if no disease found",
  "severity": "High or Medium or Low or None",
  "confidence": "XX% (your confidence level in the diagnosis)",
  "description": "2-3 sentences describing what you observe in the image — symptoms, affected areas, progression",
  "treatment": "Step-by-step treatment recommendations. Include: 1) Immediate action, 2) Chemical/organic treatment options, 3) Preventive measures for future"
}`
            }
          ]
        }
      ],
      max_tokens: 1024,
      temperature: 0.3
    });

    const rawText = response.choices[0].message.content.trim();
    const clean   = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (parseErr) {
      console.error('JSON parse failed. Raw response:', rawText);
      return res.status(500).json({ error: 'AI returned unexpected format', raw: rawText });
    }

    res.json(parsed);

  } catch (err) {
    console.error('❌ /analyze error:', err.message);
    res.status(500).json({ error: 'Disease analysis failed', details: err.message });
  }
});

module.exports = router;