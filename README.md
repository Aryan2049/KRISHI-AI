<div align="center">

# 🌾 KrishiAI — Intelligent Farming Assistant

**AI-powered crop disease detection, real-time weather insights, and an expert farming chatbot — built for Indian farmers.**

![Node](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-LLM%20%2B%20Vision-f55036)
![License](https://img.shields.io/badge/license-MIT-green)

</div>

---

## 📖 What is KrishiAI?

KrishiAI is a full-stack AI assistant for agriculture that helps farmers:

- **📷 Detect crop diseases** — upload a photo of a leaf or crop and get an instant diagnosis with severity, confidence score, and a step-by-step treatment plan.
- **🌦️ Get farm-specific weather intelligence** — live temperature, humidity, wind, and rain chance with AI-generated farming advice (when to irrigate, spray, or protect your crops).
- **🤖 Chat with a farming expert** — ask anything about crops, pests, fertilizers, irrigation, market prices, and government schemes in plain language.

The backend is a lightweight Node.js/Express API that calls **Groq** (vision model for image analysis, LLM for chat) and **Open-Meteo** (free weather API — no key required). The frontend is a single, self-contained static page (`index.html`) with a dark, agriculture-themed UI.

Built for **Hack-O-NiT · AI Summit 2026** at Narula Institute of Technology.

---

## ✨ Features

| Feature | Description |
| --- | --- |
| 🔬 **Instant Disease Diagnosis** | Upload any crop/leaf photo — the AI identifies diseases with severity and confidence in seconds |
| 💊 **Treatment Suggestions** | Actionable step-by-step plans: immediate action, chemical/organic options, and prevention |
| 🌦️ **Weather Intelligence** | Live weather via Open-Meteo + rule-based farming advice tailored to current conditions |
| 🤖 **Farming Chatbot** | Context-aware chat with session memory, tuned for Indian farming (Kharif/Rabi seasons, monsoon climate, PM-KISAN schemes) |
| 📱 **Mobile-Friendly UI** | Responsive dark-themed interface with smooth animations and quick-prompt chips |

---

## 🧰 Tech Stack

| Layer | Technology |
| --- | --- |
| Backend | Node.js, Express 4 |
| AI / Vision | Groq (`meta-llama/llama-4-scout-17b-16e-instruct` — vision) |
| AI / Chat | Groq (`llama-3.3-70b-versatile`) |
| Weather | Open-Meteo API (no API key required) |
| Frontend | Vanilla HTML / CSS / JavaScript (single page, no build step) |

---

## 🚀 Getting Started

### Prerequisites

- **[Node.js](https://nodejs.org/) 18 or newer** (npm comes with it)
- A **free Groq API key** from [console.groq.com](https://console.groq.com/keys) — required for disease detection and chat

### 1. Clone & install

```bash
git clone <your-repo-url>
cd <project-folder>
npm install
```

### 2. Set up environment variables

Create a `.env` file in the project root (copy the template):

```bash
cp .env.example .env
```

Then open `.env` and add your key:

```env
# Required — get one at https://console.groq.com/keys
GROQ_API_KEY=your_groq_api_key_here

# Optional — defaults to 3000
PORT=3000
```

> ⚠️ `.env` is gitignored — never commit your API key.

### 3. Start the app

The Express server serves **both** the API and the frontend (`index.html`):

```bash
npm run dev      # development (auto-restarts on changes via nodemon)
# or
npm start        # production
```

You should see:

```
🌿 KrishiAI Backend is running!
🔗 Server: http://localhost:3000
💚 Health: http://localhost:3000/healthz
```

### 4. Open the app

Visit **http://localhost:3000** in your browser — you'll see the full KrishiAI site (crop scanner, weather, and chatbot).

> Tip: you can also open `index.html` directly as a local file — the frontend automatically falls back to `http://localhost:3000` for the API when opened that way.

### ✅ Verify everything works

```bash
curl http://localhost:3000/healthz
# → { "status": "KrishiAI backend is running!" }
```

Then in the UI: upload a leaf photo → **🔍 Analyze Crop**, and try the chat panel. 🎉

---

## 📡 API Reference

Base URL: `http://localhost:3000`

### `GET /healthz`
Health check.

```bash
curl http://localhost:3000/healthz
```

### `POST /analyze`
Crop disease detection from a base64-encoded image.

**Request body:**
```json
{
  "image": "<base64-encoded JPEG/PNG — no data: prefix>"
}
```

**Response:**
```json
{
  "disease": "Rice Blast",
  "severity": "High",
  "confidence": "92%",
  "description": "Spindle-shaped lesions with grey centers...",
  "treatment": "1) Immediate action: ... 2) Chemical options: ... 3) Prevention: ..."
}
```

### `GET /weather?lat={lat}&lon={lon}`
Live weather + farming advice for a location.

```bash
curl "http://localhost:3000/weather?lat=22.57&lon=88.36"
```

**Response:**
```json
{
  "temperature": 32,
  "humidity": 74,
  "wind": 12,
  "rainChance": 20,
  "description": "Live Conditions",
  "weatherCode": 2,
  "icon": "⛅",
  "farmingAdvice": "☀️ High temperature — ensure adequate irrigation..."
}
```

### `POST /chat`
Farming chatbot with session memory (last 20 messages kept per session).

**Request body:**
```json
{
  "message": "How to prevent leaf blight in rice?",
  "sessionId": "optional — omit to start a new session"
}
```

**Response:**
```json
{
  "reply": "Leaf blight is a fungal disease...",
  "sessionId": "session_1712..."
}
```

---

## 📁 Project Structure

```
├── index.html          # Frontend — single-page UI (vanilla HTML/CSS/JS)
├── server.js           # Express entry point — middleware, routes, server startup
├── routes/
│   ├── analyze.js      # POST /analyze — Groq Vision disease detection
│   ├── chat.js         # POST /chat — Groq LLM chatbot with session memory
│   └── weather.js      # GET /weather — Open-Meteo + farming advice rules
├── package.json        # Scripts & dependencies
└── .env.example        # Environment variable template
```

## 📜 npm Scripts

| Script | Command | Description |
| --- | --- | --- |
| `dev` | `nodemon server.js` | Start backend with auto-reload (use while developing) |
| `start` | `node server.js` | Start backend normally (use for production) |

---

## 🛠️ Troubleshooting

| Problem | Fix |
| --- | --- |
| `❌ Backend error. Make sure your server is running.` in the UI | The backend isn't running — start it with `npm run dev` and check `http://localhost:3000/healthz` |
| `GROQ_API_KEY is not set` error on Analyze/Chat | Add your Groq API key to `.env` (or your hosting environment settings) and restart |
| `Disease analysis failed` / `Chat failed` in server logs | Your `GROQ_API_KEY` is missing or invalid — check `.env` and regenerate the key at [console.groq.com](https://console.groq.com/keys) |
| CORS / network errors in the browser | Make sure the frontend's `BACKEND_URL` in `index.html` points at `http://localhost:3000` |
| Weather shows fallback data | Your browser blocked geolocation or you're offline — the app falls back to sample data |

---

## 🗺️ Roadmap Ideas

- 📊 Crop health history & trend tracking
- 🌍 Multi-language support (Hindi, Bengali, Tamil, +10 more)
- 📈 Market price alerts
- 🗺️ Pest & disease outbreak heatmaps by region

---

## 📄 License

MIT — free to use, modify, and share.

---

<p align="center">Made with 💚 for farmers · Hack-O-NiT · AI Summit 2026</p>