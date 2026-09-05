// ──────────────────────────────────────────────
//  routes/weather.js
//  Weather data + AI farming advice
// ──────────────────────────────────────────────

const express = require('express');
const router  = express.Router();
const axios   = require('axios');

// Generates farming advice based on weather conditions
function getFarmingAdvice({ temp, humidity, rainChance, wind }) {
  const advice = [];

  if (temp > 38) {
    advice.push('🌡️ Extreme heat — water your crops early morning and evening to reduce stress.');
  } else if (temp > 32) {
    advice.push('☀️ High temperature — ensure adequate irrigation and shade-sensitive seedlings.');
  } else if (temp < 10) {
    advice.push('🥶 Cold conditions — protect frost-sensitive crops with covers or straw mulch.');
  } else {
    advice.push('✅ Temperature is comfortable for most crops.');
  }

  if (rainChance > 70) {
    advice.push('🌧️ High rain chance — delay pesticide/fertilizer application to avoid wash-off.');
  } else if (rainChance > 40) {
    advice.push('🌦️ Possible rain today — check drainage in low-lying fields.');
  }

  if (humidity > 80) {
    advice.push('💧 High humidity — watch for fungal diseases like blight and mildew.');
  } else if (humidity < 30) {
    advice.push('🏜️ Low humidity — increase irrigation frequency.');
  }

  if (wind > 30) {
    advice.push('💨 Strong winds — avoid spraying chemicals today; secure young plants.');
  }

  return advice.join(' ');
}

// Map Open-Meteo weather codes to icons
function weatherIcon(code) {
  if (code === 0) return '☀️';
  if (code <= 2) return '⛅';
  if (code <= 48) return '☁️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '❄️';
  if (code <= 82) return '🌦️';
  if (code <= 99) return '⛈️';
  return '🌡️';
}

router.get('/weather', async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: 'Query params lat and lon are required' });
    }

    const url = `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}&longitude=${lon}` +
      `&current_weather=true` +
      `&hourly=relativehumidity_2m,precipitation_probability,windspeed_10m` +
      `&timezone=auto`;

    const { data } = await axios.get(url, { timeout: 8000 });

    const cw   = data.current_weather;
    const hour = new Date().getHours();

    const temperature  = Math.round(cw.temperature);
    const wind         = Math.round(cw.windspeed);
    const humidity     = data.hourly?.relativehumidity_2m?.[hour]          ?? 68;
    const rainChance   = data.hourly?.precipitation_probability?.[hour]    ?? 20;
    const weatherCode  = cw.weathercode;

    const farmingAdvice = getFarmingAdvice({ temp: temperature, humidity, rainChance, wind });

    res.json({
      temperature,
      humidity,
      wind,
      rainChance,
      description:   'Live Conditions',
      weatherCode,
      icon:          weatherIcon(weatherCode),
      farmingAdvice
    });

  } catch (err) {
    console.error('❌ /weather error:', err.message);
    res.status(500).json({ error: 'Weather fetch failed', details: err.message });
  }
});

module.exports = router;
