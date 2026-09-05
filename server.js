// ──────────────────────────────────────────────
//  KrishiAI Backend — server.js
//  Main entry point. Starts the Express server.
// ──────────────────────────────────────────────

// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const path    = require('path');

// Import all our route files
const analyzeRoute = require('./routes/analyze');
const weatherRoute = require('./routes/weather');
const chatRoute    = require('./routes/chat');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── MIDDLEWARE ──────────────────────────────────
// Allow requests from your frontend (any origin)
app.use(cors());

// Parse incoming JSON — raised to 10mb to handle base64 image uploads
app.use(express.json({ limit: '10mb' }));

// ── ROUTES ─────────────────────────────────────
// Health check — visit http://localhost:3000/healthz to confirm server is running
app.get('/healthz', (req, res) => {
  res.json({ status: 'KrishiAI backend is running!' });
});

// Crop disease detection — POST /analyze
app.use('/', analyzeRoute);

// Weather data — GET /weather?lat=...&lon=...
app.use('/', weatherRoute);

// AI Chatbot — POST /chat
app.use('/chat', chatRoute);


// ── FRONTEND ───────────────────────────────────
// Serve the actual KrishiAI site (index.html) at the root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── START SERVER ────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('🌿 KrishiAI Backend is running!');
  console.log(`🔗 Server: http://localhost:${PORT}`);
  console.log(`💚 Health: http://localhost:${PORT}/healthz`);
  console.log('');
  console.log('Available endpoints:');
  console.log(`  POST http://localhost:${PORT}/analyze  — Crop disease detection`);
  console.log(`  GET  http://localhost:${PORT}/weather  — Weather + farming advice`);
  console.log(`  POST http://localhost:${PORT}/chat     — AI farming chatbot`);
  console.log('');
});
