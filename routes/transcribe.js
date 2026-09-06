// ──────────────────────────────────────────────
//  routes/transcribe.js
//  Voice-to-text using Groq Whisper — fallback for
//  browsers/environments where the built-in Web
//  Speech service is unreachable.
// ──────────────────────────────────────────────

const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const os      = require('os');
const path    = require('path');
const Groq    = require('groq-sdk');

let groq;
function getGroq() {
  if (!groq) groq = new Groq({ apiKey: process.env.GROQ_API_KEY, timeout: 60000 });
  return groq;
}

const MODEL = 'whisper-large-v3-turbo';

// Map a BCP-47 code (e.g. 'hi-IN') to the ISO language code Whisper expects
const ISO_MAP = {
  en: 'en', hi: 'hi', bn: 'bn', ta: 'ta', te: 'te',
  mr: 'mr', gu: 'gu', pa: 'pa', kn: 'kn', ml: 'ml', or: 'or', ur: 'ur'
};
function isoLang(code) {
  if (!code) return 'hi';
  const base = String(code).split('-')[0].toLowerCase();
  return ISO_MAP[base] || 'hi';
}

router.post('/', async (req, res) => {
  let tmpPath = null;
  try {
    const { audio, language } = req.body;

    if (!audio) {
      return res.status(400).json({ error: 'No audio provided. Send { audio: base64string }' });
    }
    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: 'GROQ_API_KEY is not set. Add it to your environment settings.' });
    }

    const buf = Buffer.from(audio, 'base64');
    // Safety cap: ~12 MB of audio data
    if (buf.length > 12 * 1024 * 1024) {
      return res.status(413).json({ error: 'Audio too large' });
    }

    // Whisper needs a real file — write the upload to a temp file
    tmpPath = path.join(os.tmpdir(), `krishi_${Date.now()}_${Math.random().toString(36).slice(2)}.webm`);
    fs.writeFileSync(tmpPath, buf);

    const response = await getGroq().audio.transcriptions.create({
      model:    MODEL,
      file:     fs.createReadStream(tmpPath),
      language: isoLang(language)
    });

    res.json({ text: (response.text || '').trim() });
  } catch (err) {
    console.error('❌ /transcribe error:', err.message);
    res.status(500).json({ error: 'Transcription failed', details: err.message });
  } finally {
    if (tmpPath) fs.unlink(tmpPath, () => {});
  }
});

module.exports = router;
