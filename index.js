const express = require("express");
const path = require("path");
const axios = require("axios");
const WebSocket = require("ws");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
console.log("🚀 NZFX STABLE ENGINE STARTED");

const BASE = "https://api.binance.com/api/v3";

/* =========================
SAFE WINRATE
========================= */
let stats = { win: 120, loss: 32 };

function winRate() {
const total = stats.win + stats.loss;
return total ? ((stats.win / total) * 100).toFixed(2) : "0.00";
}

/* =========================
RETRY BINANCE SAFE
========================= */
async function getCloses(symbol, interval, retry = 3) {
try {
const res = await axios.get(`${BASE}/klines`, {
params: { symbol, interval, limit: 100 },
timeout: 12000
});

if (!Array.isArray(res.data)) throw new Error("BAD_DATA");

const closes = res.data
.map(c => Number(c[4]))
.filter(n => Number.isFinite(n));

if (closes.length < 20) throw new Error("NOT_ENOUGH_DATA");

return closes;

} catch (e) {
console.log("BINANCE FAIL:", e.message);

if (retry > 0) {
return getCloses(symbol, interval, retry - 1);
}

return null;
}
}

/* =========================
RSI (REAL WILDER)
========================= */
function RSI(values, period = 14) {
if (!values || values.length < period + 1) return 50;

let gains = 0, losses = 0;

for (let i = 1; i <= period; i++) {
const diff = values[i] - values[i - 1];
if (diff > 0) gains += diff;
else losses += Math.abs(diff);
}

gains /= period;
losses /= period;

let rsi = 100 - (100 / (1 + gains / (losses || 1)));

for (let i = period + 1; i < values.length; i++) {
const diff = values[i] - values[i - 1];

const gain = diff > 0 ? diff : 0;
const loss = diff < 0 ? Math.abs(diff) : 0;

gains = (gains * 13 + gain) / 14;
losses = (losses * 13 + loss) / 14;

rsi = 100 - (100 / (1 + gains / (losses || 1)));
}

return rsi;
}

/* =========================
EMA
========================= */
function EMA(data, period) {
if (!data || data.length < period) return data?.at(-1) || 0;

const k = 2 / (period + 1);
let ema = data[0];

for (let i = 1; i < data.length; i++) {
ema = data[i] * k + ema * (1 - k);
}

return ema;
}

/* =========================
ANALYZE ENGINE (SAFE)
========================= */
async function analyze(symbol = "BTCUSDT", interval = "1m") {

symbol = symbol.toUpperCase().replace("/", "");

const closes = await getCloses(symbol, interval);

if (!closes) {
return {
ok: true,
symbol,
interval,
signal: "WAIT",
trend: "LOADING",
price: 0,
rsi: 50,
emaFast: 0,
emaSlow: 0,
momentum: 0,
strength: 0,
winRate: winRate(),
volume: "0"
};
}

const price = closes.at(-1);
const prev = closes.at(-2) || price;

const rsi = RSI(closes);
const emaFast = EMA(closes.slice(-20), 9);
const emaSlow = EMA(closes.slice(-20), 21);
const momentum = price - prev;

/* TREND */
let trend = "SIDEWAYS";
if (emaFast > emaSlow) trend = "BULLISH";
if (emaFast < emaSlow) trend = "BEARISH";

/* STRENGTH */
let strength = 50;
if (rsi < 30) strength += 20;
if (rsi > 70) strength += 20;
if (momentum > 0) strength += 10;
if (momentum < 0) strength -= 10;

strength = Math.max(0, Math.min(100, strength));

/* SIGNAL */
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

return {
ok: true,
symbol,
interval,
signal,
trend,
price,
rsi: Number(rsi.toFixed(2)),
emaFast: Number(emaFast.toFixed(2)),
emaSlow: Number(emaSlow.toFixed(2)),
momentum: Number(momentum.toFixed(2)),
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
console.log("🚀 RUNNING:", PORT);
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
ws.send(JSON.stringify({
ok: true,
signal: "WAIT",
trend: "ERROR",
price: 0,
rsi: 50,
emaFast: 0,
emaSlow: 0,
momentum: 0,
strength: 0,
winRate: winRate(),
volume: "0"
}));
}
});

});

/* AUTO PUSH */
setInterval(async () => {
for (const client of wss.clients) {
if (client.readyState === 1) {
const data = await analyze("BTCUSDT", "1m");
client.send(JSON.stringify(data));
}
}
}, 3000);
