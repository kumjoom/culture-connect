// 🌱 Agriculture Real-time Data App (MVP Version)
// Technology: Node.js (Express) + React.js + Firebase (Realtime DB) + Cron Jobs
// Deployment target: Replit (or local)

// -----------------------------
// 1. PROJECT STRUCTURE
// -----------------------------

/*
📁 agriculture-app/
├── 📁 client/              # React frontend
├── 📁 server/              # Express backend
│   ├── 📁 tasks/           # Cron-based update tasks
│   ├── 📁 utils/           # API helpers (weather, market, news, alerts, crops)
│   ├── server.js          # Main backend entry
├── .replit                # Replit config
├── replit.nix             # Node & dependencies
├── README.md
*/

// -----------------------------
// 2. SETUP BACKEND (server/server.js)
// -----------------------------

// Install packages:
// npm install express axios node-cron cors dotenv firebase-admin

const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
require("dotenv").config();

const app = express();
app.use(cors());

const updateWeather = require("./tasks/updateWeather");
const updateMarketPrices = require("./tasks/updateMarketPrices");
const updateAgriNews = require("./tasks/updateAgriNews");
const updateAlerts = require("./tasks/updateAlerts");
const updateCropPlan = require("./tasks/updateCropPlan");

// Cron jobs
cron.schedule("0 */3 * * *", updateWeather);          // Every 3 hours
cron.schedule("0 9,15 * * *", updateMarketPrices);   // 9am and 3pm
cron.schedule("0 */4 * * *", updateAgriNews);        // Every 4 hours
cron.schedule("*/15 * * * *", updateAlerts);         // Every 15 mins
cron.schedule("0 0 * * *", updateCropPlan);          // Daily

// API endpoints
app.get("/api/weather", async (req, res) => {
  const data = await require("./utils/weather").getCachedWeather();
  res.json(data);
});

app.get("/api/market", async (req, res) => {
  const data = await require("./utils/market").getCachedPrices();
  res.json(data);
});

app.get("/api/news", async (req, res) => {
  const data = await require("./utils/news").getCachedNews();
  res.json(data);
});

app.get("/api/alerts", async (req, res) => {
  const data = await require("./utils/alerts").getCachedAlerts();
  res.json(data);
});

app.get("/api/crops", async (req, res) => {
  const data = await require("./utils/crops").getCropPlan();
  res.json(data);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// -----------------------------
// 3. EXAMPLE TASK (server/tasks/updateMarketPrices.js)
// -----------------------------

const { getPricesFromAPI, savePricesToDB } = require("../utils/market");
module.exports = async function () {
  try {
    const prices = await getPricesFromAPI();
    await savePricesToDB(prices);
    console.log("✅ Market prices updated");
  } catch (err) {
    console.error("❌ Failed to update prices", err);
  }
};

// -----------------------------
// 4. EXAMPLE UTILS (server/utils/market.js)
// -----------------------------

const axios = require("axios");
const admin = require("firebase-admin");
const db = admin.firestore();

module.exports.getPricesFromAPI = async function () {
  const url = `https://api.example.com/agriculture/market-prices`;
  const response = await axios.get(url);
  return response.data;
};

module.exports.savePricesToDB = async function (data) {
  await db.collection("market").doc("prices").set({
    ...data,
    updatedAt: new Date().toISOString()
  });
};

module.exports.getCachedPrices = async function () {
  const doc = await db.collection("market").doc("prices").get();
  return doc.data();
};

// (Repeat same pattern for utils/news.js, utils/alerts.js, utils/crops.js)

// -----------------------------
// 5. FIREBASE SETUP
// -----------------------------

const admin = require("firebase-admin");
const serviceAccount = require("../firebaseServiceKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// -----------------------------
// 6. FRONTEND (React - client/src/App.js)
// -----------------------------

import React, { useEffect, useState } from "react";
function App() {
  const [weather, setWeather] = useState(null);
  const [market, setMarket] = useState(null);
  const [news, setNews] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [crops, setCrops] = useState(null);

  useEffect(() => {
    fetch("/api/weather").then(res => res.json()).then(setWeather);
    fetch("/api/market").then(res => res.json()).then(setMarket);
    fetch("/api/news").then(res => res.json()).then(setNews);
    fetch("/api/alerts").then(res => res.json()).then(setAlerts);
    fetch("/api/crops").then(res => res.json()).then(setCrops);
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>🌾 Agriculture Dashboard</h1>
      <h2>🌤️ Weather: {weather?.main?.temp}°C</h2>
      <h2>📈 Market: {market?.rice} THB/kg</h2>
      <h2>📰 News: {news?.articles?.[0]?.title}</h2>
      <h2>⚠️ Alerts: {alerts?.[0]}</h2>
      <h2>📅 Crop Plan: {crops?.nextPlanting}</h2>
    </div>
  );
}
export default App;

// -----------------------------
// 7. REPLIT DEPLOYMENT
// -----------------------------

// .replit
/*
run = "npm install && cd server && node server.js"
*/

// replit.nix
/*
{ pkgs }: {
  deps = [
    pkgs.nodejs-18_x
  ];
}
*/

// -----------------------------
// ✅ NOW THE APP AUTO-UPDATES:
// -----------------------------
// ✅ สภาพอากาศ (ทุก 3 ชม.)
// ✅ ราคาตลาด (9:00 และ 15:00)
// ✅ ข่าวเกษตร (ทุก 4 ชม.)
// ✅ การแจ้งเตือน (ทุก 15 นาที)
// ✅ แผนเพาะปลูก (รายวัน)
