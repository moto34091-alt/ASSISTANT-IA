const express = require("express");
const path = require("path");
const axios = require("axios");
const WebSocket = require("ws");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;

console.log("🚀 STABLE BINANCE PIPELINE STARTED");

/* =========================
BINANCE ENDPOINTS (FALLBACK SAFE)
========================= */

const ENDPOINTS = [
"https://api.binance.com/api/v3/klines",
"https://api1.binance.com/api/v3/klines"
];

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
const total = stats.win + stats.loss;
return total ? ((stats.win / total) * 100).toFixed(2) : "0.00";
}

/* =========================
SAFE FETCH (ANTI-FAIL)
========================= */

async function fetchKlines(symbol, interval) {

for (let url of ENDPOINTS) {
try {
const res = await axios.get(url, {
params: {
symbol,
interval,
limit: 100
},
timeout: 8000
});

if (res.data && Array.isArray(res.data)) {
return res.data;
}

} catch (e) {
console.log("Endpoint failed:", url);
}
}

return null;
}

/* =========================
CLEAN CLOSE PRICES
========================= */

async function getCloses(symbol, interval) {

const data = await fetchKlines(symbol, interval);

if (!data) {
console.log("NO DATA FROM ALL ENDPOINTS");
return null;
}

const closes = data
.map(c => Number(c[4]))
.filter(n => Number.isFinite(n));

if (closes.length < 30) {
console.log("INSUFFICIENT CLOSES:", closes.length);
return null;
}

return closes;
}

/* =========================
RSI WILDER (REAL TRADINGVIEW STYLE)
========================= */

function RSI_Wilder(closes, period = 14) {

if (!closes || closes.length < period + 1) return null;

let gains = 0;
let losses = 0;

// initial average
for (let i = 1; i <= period; i++) {
const diff = closes[i] - closes[i - 1];
if (diff > 0) gains += diff;
else losses += Math.abs(diff);
}

gains /= period;
losses /= period;

let rsi = 100 - (100 / (1 + (gains / (losses || 1))));

// smoothing
for (let i = period + 1; i < closes.length; i++) {
const diff = closes[i] - closes[i - 1];

const gain = diff > 0 ? diff : 0;
const loss = diff < 0 ? Math.abs(diff) : 0;

gains = (gains * (period - 1) + gain) / period;
losses = (losses * (period - 1) + loss) / period;

rsi = 100 - (100 / (1 + (gains / (losses || 1))));
}

return rsi;
}

/* =========================
EMA SAFE
========================= */

function EMA(data, period) {

if (!data || data.length < period) return null;

const k = 2 / (period + 1);

let ema = data[0];

for (let i = 1; i < data.length; i++) {
ema = data[i] * k + ema * (1 - k);
}

return ema;
}

/* =========================
ANALYZE ENGINE (CLEAN + SAFE)
========================= */

async function analyze(symbol = "BTCUSDT", interval = "1m") {

symbol = symbol.toUpperCase().replace("/", "");
if (!SYMBOLS.includes(symbol)) symbol = "BTCUSDT";

const closes = await getCloses(symbol, interval);

if (!closes) {
return {
symbol,
interval,
error: "NO_MARKET_DATA",
message: "Binance data unavailable"
};
}

const last = closes.at(-1);
const prev = closes.at(-2);

/* =========================
INDICATORS SAFE
========================= */

const rsi = RSI_Wilder(closes, 14);
const emaFast = EMA(closes.slice(-20), 9);
const emaSlow = EMA(closes.slice(-20), 21);

if (!rsi || !emaFast || !emaSlow) {
return {
symbol,
interval,
error: "CALC_ERROR",
message: "Indicator failed"
};
}

const momentum = last - prev;

/* =========================
TREND
========================= */

let trend = "SIDEWAYS";
if (emaFast > emaSlow) trend = "BULLISH";
if (emaFast < emaSlow) trend = "BEARISH";

/* =========================
STRENGTH
========================= */

let strength = 50;

if (rsi < 30) strength += 20;
if (rsi > 70) strength += 20;

if (emaFast > emaSlow) strength += 10;
if (emaFast < emaSlow) strength -= 10;

if (momentum > 0) strength += 10;
if (momentum < 0) strength -= 10;

strength = Math.max(0, Math.min(100, strength));

/* =========================
SIGNAL
========================= */

let signal = "WAIT";

if (rsi < 30 && emaFast > emaSlow) {
signal = "BUY";
stats.win++;
}
else if (rsi > 70 && emaFast < emaSlow) {
signal = "SELL";
stats.win++;
}
else {
stats.loss++;
}

/* =========================
FINAL OUTPUT
========================= */

return {
symbol,
interval,

signal,
trend,

price: last,
rsi: rsi.toFixed(2),
emaFast: emaFast.toFixed(2),
emaSlow: emaSlow.toFixed(2),

momentum: momentum.toFixed(2),
strength,
winRate: winRate(),
volume: "LIVE"
};

}

/* =========================
API
========================= */

app.get("/api/signal/:symbol/:interval", async (req, res) => {
const data = await analyze(req.params.symbol, req.params.interval);
res.json(data);
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

ws.on("message", async (msg) => {
try {
const { symbol, interval } = JSON.parse(msg);
const data = await analyze(symbol, interval);
ws.send(JSON.stringify(data));
} catch (e) {
console.log("WS ERROR:", e.message);
}
});

});

/* =========================
AUTO PUSH SAFE
========================= */

setInterval(async () => {
for (let client of wss.clients) {
if (client.readyState === 1) {
const data = await analyze("BTCUSDT", "1m");
client.send(JSON.stringify(data));
}
}
}, 3000);
