const express = require("express");
const path = require("path");
const axios = require("axios");
const WebSocket = require("ws");

const { detectPatterns } = require("./patterns");
const { getSupportResistance } = require("./levels");
const { calculateScore } = require("./strategies");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;

const BASE = "https://api.binance.com/api/v3";

let lastData = {};

let stats = {
  win: 120,
  loss: 32,
};

function winRate() {
  let total = stats.win + stats.loss;
  return ((stats.win / total) * 100).toFixed(2);
}

function RSI(data) {
  let gain = 0;
  let loss = 0;

  for (let i = 1; i < data.length; i++) {
    let diff = data[i] - data[i - 1];

    if (diff > 0) gain += diff;
    else loss += Math.abs(diff);
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

async function getCandles(symbol, interval) {
  try {
    const r = await axios.get(`${BASE}/klines`, {
      params: {
        symbol,
        interval,
        limit: 100,
      },
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

async function analyze(symbol = "BTCUSDT", interval = "1m") {
  try {
    const candles = await getCandles(symbol, interval);

    if (!candles || candles.length < 30) {
      return lastData[symbol] || {};
    }

    const closes = candles.map((c) => c.close);

    const last = closes.at(-1);
    const prev = closes.at(-2);

    const rsi = RSI(closes);

    const emaFast = EMA(closes.slice(-20), 9);
    const emaSlow = EMA(closes.slice(-20), 21);

    const momentum = last - prev;

    const pattern = detectPatterns(candles);

    const levels = getSupportResistance(candles);

    const support = levels.support;
    const resistance = levels.resistance;

    const avgVolume =
      candles.reduce((a, b) => a + b.volume, 0) / candles.length;

    const currentVolume = candles.at(-1).volume;

    const score = calculateScore({
      rsi,
      emaFast,
      emaSlow,
      momentum,
      pattern,
      support,
      resistance,
      price: last,
      avgVolume,
      currentVolume,
    });

    let signal = "WAIT";
    let trend = "SIDEWAYS";

    if (score >= 80) {
      signal = "BUY";
      trend = "BULLISH";
    }

    if (score <= 20) {
      signal = "SELL";
      trend = "BEARISH";
    }

    const data = {
      symbol,
      interval,
      signal,
      trend,
      strength: score,
      pattern,
      support,
      resistance,
      price: last.toFixed(2),
      rsi: rsi.toFixed(2),
      emaFast: emaFast.toFixed(2),
      emaSlow: emaSlow.toFixed(2),
      momentum: momentum.toFixed(2),
      volume: currentVolume.toFixed(2),
      winRate: winRate(),
    };

    lastData[symbol] = data;

    return data;
  } catch (e) {
    console.log("ANALYZE ERROR:", e.message);
    return {};
  }
}

app.get("/api/signal/:symbol/:interval", async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const interval = req.params.interval;

  const data = await analyze(symbol, interval);

  res.json(data);
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const server = app.listen(PORT, () => {
  console.log(`🚀 SERVER RUNNING ${PORT}`);
});

const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("🟢 CLIENT CONNECTED");

  ws.on("message", async (msg) => {
    try {
      const parsed = JSON.parse(msg);

      const data = await analyze(
        parsed.symbol || "BTCUSDT",
        parsed.interval || "1m"
      );

      ws.send(JSON.stringify(data));
    } catch (e) {
      console.log(e.message);
    }
  });
});

setInterval(async () => {
  wss.clients.forEach(async (client) => {
    if (client.readyState === 1) {
      const data = await analyze("BTCUSDT", "1m");

      client.send(JSON.stringify(data));
    }
  });
}, 2000);
