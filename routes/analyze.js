// ──────────────────────────────────────────────
//  routes/analyze.js
//  Crop disease detection using Groq Vision
// ──────────────────────────────────────────────

const express = require('express');
const router  = express.Router();
const Groq    = require('groq-sdk');

let groq;
function getGroq() {
  if (!groq) groq = new Groq({ apiKey: process.env.GROQ_API_KEY, timeout: 60000 });
  return groq;
}

const DEFAULT_MODEL = 'qwen/qwen3.6-27b';

// Map a BCP-47 code (e.g. 'hi-IN') to a spoken language name
const LANG_MAP = {
  en: 'English', hi: 'Hindi', bn: 'Bengali', ta: 'Tamil', te: 'Telugu',
  mr: 'Marathi', gu: 'Gujarati', pa: 'Punjabi', kn: 'Kannada',
  ml: 'Malayalam', or: 'Odia', ur: 'Urdu'
};
function farmerLangName(code) {
  if (!code) return null;
  const base = String(code).split('-')[0].toLowerCase();
  return LANG_MAP[base] || null;
}

router.post('/analyze', async (req, res) => {
  try {
    const { image, language, model } = req.body;
    const chosenModel = model || DEFAULT_MODEL;
    const langName = farmerLangName(language);

    if (!image) {
      return res.status(400).json({ error: 'No image provided. Send { image: base64string }' });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: 'GROQ_API_KEY is not set. Add it to your .env file or environment settings.' });
    }
    const content = [
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
  "description": "1-2 short sentences on what you observe — symptoms and affected areas",
  "treatment": "Concise treatment: 1) Immediate action, 2) Best chemical/organic option, 3) Prevention. Keep it under 60 words"
}`
      }
    ];

    // If the farmer speaks a regional language, localize the report text
    if (langName && langName !== 'English') {
      content.push({
        type: 'text',
        text: `The farmer speaks ${langName}. Write the "description" and "treatment" fields entirely in ${langName} (in its own script, e.g. Devanagari for Hindi, Bengali script for Bangla, Tamil script for Tamil). Keep the JSON keys, "disease" (English name), "severity", and "confidence" fields in English — only localize the description and treatment values.`
      });
    }

    let response;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        response = await getGroq().chat.completions.create({
          model: chosenModel,
          messages: [
            {
              role: 'user',
              content
            }
          ],
          max_tokens: 600,
          temperature: 0.3,
          reasoning_effort: 'none'
        });
        break;
      } catch (err) {
        const overCapacity = /over capacity|rate_limit_exceeded|503/i.test(err.message || '');
        if (!overCapacity || attempt === 2) throw err;
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      }
    }

    let rawText = response.choices[0].message.content.trim();

    // Some models wrap output in <think>…</think> reasoning blocks — drop them
    rawText = rawText.replace(/^<think>[\s\S]*?<\/think>\s*/i, '').replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

    // Fall back to extracting the outermost JSON object
    const start = rawText.indexOf('{');
    const end   = rawText.lastIndexOf('}');
    const clean = (start !== -1 && end > start) ? rawText.slice(start, end + 1) : rawText;

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