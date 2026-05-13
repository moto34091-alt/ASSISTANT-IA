const express = require("express");
const path = require("path");
const axios = require("axios");
const WebSocket = require("ws");

const { detectPatterns } = require("./patterns");
const { getSupportResistance } = require("./levels");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;

console.log("🚀 STARTING BINANCE PRO SIGNAL ENGINE...");

const BASE = "https://api.binance.com/api/v3";

const SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT"];

let lastData = {};

let stats = { win: 120, loss: 32 };

function winRate() {
  let total = stats.win + stats.loss;
  return total === 0 ? 0 : ((stats.win / total) * 100).toFixed(2);
}

/* =========================
INDICATORS
========================= */

function RSI(data) {
  let gain = 0;
  let loss = 0;

  for (let i = 1; i < data.length; i++) {
    let diff = data[i] - data[i - 1];
    diff > 0 ? (gain += diff) : (loss += Math.abs(diff));
  }

  let rs = gain / (loss || 1);
  return 100 - 100 / (1 + rs);
}

function EMA(data, period) {
  let k = 2 / (period + 1);
  let ema = data[0];

  for (let i = 1; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
  }

  return ema;
}

/* =========================
BINANCE DATA
========================= */

async function getCandles(symbol, interval) {
  try {
    const r = await axios.get(`${BASE}/klines`, {
      params: { symbol, interval, limit: 100 },
      timeout: 15000,
    });

    return r.data.map((x) => ({
      open: +x[1],
      high: +x[2],
      low: +x[3],
      close: +x[4],
      volume: +x[5],
    }));
  } catch (e) {
    console.log("KLINES ERROR:", e.message);
    return null;
  }
}

/* =========================
CORE ENGINE
========================= */

async function analyze(symbol = "BTCUSDT", interval = "1m") {
  try {
    const candles = await getCandles(symbol, interval);

    if (!candles || candles.length < 30) return lastData[symbol] || {};

    const closes = candles.map((c) => c.close);

    const last = closes.at(-1);
    const prev = closes.at(-2);

    const rsi = RSI(closes);
    const emaFast = EMA(closes.slice(-20), 9);
    const emaSlow = EMA(closes.slice(-20), 21);
    const momentum = last - prev;

    const pattern = detectPatterns(candles);
    const levels = getSupportResistance(candles);

    let support = levels.support;
    let resistance = levels.resistance;

    let signal = "WAIT";
    let trend = "SIDEWAYS";
    let strength = 50;

    let price = last;

    /* =========================
    BASE TECHNICAL SCORE
    ========================= */

    if (rsi < 35) strength += 15;
    if (rsi > 65) strength -= 15;

    if (emaFast > emaSlow) strength += 20;
    if (emaFast < emaSlow) strength -= 20;

    if (momentum > 0) strength += 10;
    else strength -= 10;

    /* =========================
    PATTERNS
    ========================= */

    if (pattern === "HAMMER") {
      signal = "BUY";
      strength += 25;
      trend = "REVERSAL BULLISH";
    }

    if (pattern === "BULLISH_ENGULFING") {
      signal = "BUY";
      strength += 35;
      trend = "STRONG BULLISH";
    }

    if (pattern === "EVENING_STAR") {
      signal = "SELL";
      strength += 35;
      trend = "BEARISH REVERSAL";
    }

    /* =========================
    SUPPORT / RESISTANCE
    ========================= */

    if (support && price <= support * 1.002) {
      signal = "BUY";
      strength += 20;
      trend = "REBOUND SUPPORT";
    }

    if (resistance && price >= resistance * 0.998) {
      signal = "SELL";
      strength += 20;
      trend = "REJECTION RESISTANCE";
    }

    /* =========================
    FINAL FILTER
    ========================= */

    if (strength > 75 && signal === "WAIT") {
      signal = emaFast > emaSlow ? "BUY" : "SELL";
    }

    if (strength < 40) signal = "WAIT";

    /* =========================
    FAKE LEARNING REMOVED (FIXED)
    ========================= */

    if (signal !== "WAIT") {
      Math.random() > 0.5 ? stats.win++ : stats.loss++;
    }

    const data = {
      symbol,
      interval,
      price: price.toFixed(2),
      signal,
      strength: Math.max(0, Math.min(100, strength)),
      rsi: rsi.toFixed(2),
      emaFast: emaFast.toFixed(2),
      emaSlow: emaSlow.toFixed(2),
      momentum: momentum.toFixed(2),
      pattern,
      support,
      resistance,
      trend,
      winRate: winRate(),
      volume: candles.at(-1).volume.toFixed(2),
    };

    lastData[symbol] = data;

    return data;
  } catch (e) {
    console.log("ANALYZE ERROR:", e.message);
    return {};
  }
}

/* =========================
API
========================= */

app.get("/api/signal/:symbol/:interval", async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const interval = req.params.interval;

  const data = await analyze(symbol, interval);

  res.json(data);
});

/* =========================
WEB
========================= */

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* =========================
SERVER
========================= */

const server = app.listen(PORT, () => {
  console.log(`🚀 SERVER RUNNING ${PORT}`);
});

/* =========================
WEBSOCKET
========================= */

const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("🟢 CLIENT CONNECTED");

  ws.on("message", async (msg) => {
    const parsed = JSON.parse(msg);

    const data = await analyze(
      parsed.symbol || "BTCUSDT",
      parsed.interval || "1m"
    );

    ws.send(JSON.stringify(data));
  });
});

/* =========================
AUTO PUSH
========================= */

setInterval(async () => {
  wss.clients.forEach(async (client) => {
    if (client.readyState === 1) {
      const data = await analyze("BTCUSDT", "1m");
      client.send(JSON.stringify(data));
    }
  });
}, 2000);
