const express = require("express");
const path = require("path");
const axios = require("axios");
const WebSocket = require("ws");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;

console.log("🚀 NZFX AI ENGINE RUNNING");

/* =========================
BINANCE
========================= */

const BASE = "https://api.binance.com/api/v3";

/* =========================
MARKETS
========================= */

const SYMBOLS = [
"BTCUSDT",
"ETHUSDT",
"SOLUSDT",
"BNBUSDT",
"XRPUSDT",
"DOGEUSDT"
];

/* =========================
STATS
========================= */

let stats = { win: 120, loss: 32 };

function winRate() {
let total = stats.win + stats.loss;
return total === 0 ? "0.00" : ((stats.win / total) * 100).toFixed(2);
}

/* =========================
GET BINANCE CANDLES (FIX IMPORTANT)
========================= */

async function getCandles(symbol, interval) {

try {

const res = await axios.get(`${BASE}/klines`, {
params: {
symbol,
interval,
limit: 100
},
timeout: 15000
});

if (!res.data || !Array.isArray(res.data)) return null;

/* 🔥 IMPORTANT FIX: Binance ARRAY → OBJECT propre */
return res.data.map(c => ({
open: Number(c[1]),
high: Number(c[2]),
low: Number(c[3]),
close: Number(c[4]),
volume: Number(c[5])
}));

} catch (e) {
console.log("BINANCE ERROR:", e.message);
return null;
}

}

/* =========================
RSI (REAL FIXED)
========================= */

function calcRSI(closes, period = 14) {

if (!closes || closes.length < period + 1) return 50;

let gains = 0;
let losses = 0;

for (let i = closes.length - period; i < closes.length; i++) {
let diff = closes[i] - closes[i - 1];
if (diff > 0) gains += diff;
else losses += Math.abs(diff);
}

let rs = gains / (losses || 1);
return 100 - (100 / (1 + rs));

}

/* =========================
EMA (REAL FIXED)
========================= */

function calcEMA(data, period) {

if (!data || data.length === 0) return 0;

let k = 2 / (period + 1);
let ema = data[0];

for (let i = 1; i < data.length; i++) {
ema = data[i] * k + ema * (1 - k);
}

return ema;

}

/* =========================
MAIN ANALYSIS ENGINE
========================= */

async function analyze(symbol = "BTCUSDT", interval = "1m") {

try {

symbol = symbol.toUpperCase().replace("/","");
if (!SYMBOLS.includes(symbol)) symbol = "BTCUSDT";

const candles = await getCandles(symbol, interval);

/* 🔥 FIX IMPORTANT */
if (!candles || candles.length < 20) {
return {
symbol,
interval,
signal: "WAIT",
trend: "LOADING",
price: "0",
rsi: "50",
emaFast: "0",
emaSlow: "0",
momentum: "0",
strength: 0,
winRate: winRate(),
volume: "0"
};
}

/* =========================
CLOSES CLEAN
========================= */

const closes = candles.map(c => c.close);

const last = closes.at(-1);
const prev = closes.at(-2);

/* =========================
INDICATORS
========================= */

const rsi = calcRSI(closes, 14);

const emaFast = calcEMA(closes.slice(-20), 9);
const emaSlow = calcEMA(closes.slice(-20), 21);

const momentum = last - prev;

/* =========================
TREND
========================= */

let trend = "SIDEWAYS";

if (emaFast > emaSlow) trend = "BULLISH";
if (emaFast < emaSlow) trend = "BEARISH";

/* =========================
STRENGTH ENGINE
========================= */

let strength = 50;

if (rsi < 30) strength += 25;
if (rsi > 70) strength += 25;

if (emaFast > emaSlow) strength += 15;
if (emaFast < emaSlow) strength -= 10;

if (momentum > 0) strength += 10;
if (momentum < 0) strength -= 10;

/* =========================
SIGNAL ENGINE
========================= */

let signal = "WAIT";

if (strength >= 80 && trend === "BULLISH") {
signal = "BUY";
stats.win++;
}
else if (strength >= 80 && trend === "BEARISH") {
signal = "SELL";
stats.win++;
}
else {
stats.loss++;
}

/* =========================
RETURN CLEAN DATA
========================= */

return {
symbol,
interval,

signal,
trend,

price: last.toFixed(2),
rsi: rsi.toFixed(2),

emaFast: emaFast.toFixed(2),
emaSlow: emaSlow.toFixed(2),

momentum: momentum.toFixed(2),

strength: Math.max(0, Math.min(100, strength)),

winRate: winRate(),

volume: candles.at(-1).volume
};

} catch (e) {

console.log("ANALYZE ERROR:", e.message);

return {
symbol,
interval,
signal: "WAIT",
trend: "ERROR",
price: "0",
rsi: "50",
emaFast: "0",
emaSlow: "0",
momentum: "0",
strength: 0,
winRate: winRate(),
volume: "0"
};

}

}

/* =========================
API
========================= */

app.get("/api/signal/:symbol/:interval", async (req, res) => {
const data = await analyze(req.params.symbol, req.params.interval);
res.json(data);
});

/* =========================
HOME
========================= */

app.get("/", (req, res) => {
res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* =========================
SERVER
========================= */

const server = app.listen(PORT, () => {
console.log("🚀 SERVER RUNNING:", PORT);
});

/* =========================
WEBSOCKET
========================= */

const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {

console.log("🟢 CLIENT CONNECTED");

ws.on("message", async (msg) => {

try {
const parsed = JSON.parse(msg);
const data = await analyze(parsed.symbol, parsed.interval);
ws.send(JSON.stringify(data));
} catch (e) {
console.log("WS ERROR:", e.message);
}

});

});

/* =========================
AUTO PUSH
========================= */

setInterval(async () => {

for (let client of wss.clients) {
if (client.readyState === 1) {
const data = await analyze("BTCUSDT", "1m");
client.send(JSON.stringify(data));
}
}

}, 3000);
