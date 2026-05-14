require("dotenv").config();

const express = require("express");
const axios = require("axios");
const WebSocket = require("ws");

const app = express();
app.use(express.json());

/* =========================
SAFE CRASH HANDLING
========================= */
process.on("uncaughtException", (err) => {
console.log("CRASH:", err.message);
});

process.on("unhandledRejection", (err) => {
console.log("PROMISE ERROR:", err.message);
});

/* =========================
HOME PAGE (RAILWAY CHECK)
========================= */
app.get("/", (req, res) => {
res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>SNIPER PRO V7</title>
<style>
body{
margin:0;
height:100vh;
display:flex;
justify-content:center;
align-items:center;
background:white;
font-family:Arial;
}
h1{color:#111;font-size:28px;}
p{color:#666;}
</style>
</head>
<body>
<div style="text-align:center">
<h1>🚀 SNIPER PRO V7 - ONLINE</h1>
<p>System running on Railway</p>
</div>
</body>
</html>
`);
});

/* =========================
TEST ROUTE
========================= */
app.get("/test", (req, res) => {
res.json({ status: "OK", message: "SERVER WORKING" });
});

/* =========================
BINANCE DATA
========================= */
const BASE = "https://api.binance.com/api/v3";

async function getCloses(symbol, interval) {
try {
const res = await axios.get(`${BASE}/klines`, {
params: { symbol, interval, limit: 100 }
});

return res.data.map(c => Number(c[4]));

} catch (e) {
console.log("BINANCE ERROR:", e.message);
return null;
}
}

/* =========================
RSI
========================= */
function RSI(data, period = 14) {
if (!data || data.length < period + 1) return 50;

let gain = 0;
let loss = 0;

for (let i = 1; i <= period; i++) {
const diff = data[i] - data[i - 1];
if (diff > 0) gain += diff;
else loss += Math.abs(diff);
}

let avgGain = gain / period;
let avgLoss = loss / period;

for (let i = period + 1; i < data.length; i++) {
const diff = data[i] - data[i - 1];
const g = diff > 0 ? diff : 0;
const l = diff < 0 ? Math.abs(diff) : 0;

avgGain = (avgGain * 13 + g) / 14;
avgLoss = (avgLoss * 13 + l) / 14;
}

return 100 - (100 / (1 + avgGain / (avgLoss || 1)));
}

/* =========================
EMA
========================= */
function EMA(data, period) {
const k = 2 / (period + 1);
let ema = data[0];

for (let i = 1; i < data.length; i++) {
ema = data[i] * k + ema * (1 - k);
}

return ema;
}

/* =========================
ANALYZE ENGINE
========================= */
async function analyze(symbol, interval) {

const data = await getCloses(symbol, interval);

if (!data || data.length < 50) {
return {
symbol,
interval,
signal: "WAIT",
price: 0,
rsi: 50,
emaFast: 0,
emaSlow: 0,
momentum: 0,
trend: "LOADING",
strength: 0
};
}

const price = data.at(-1);
const prev = data.at(-2) || price;

const rsi = RSI(data);
const emaFast = EMA(data.slice(-20), 9);
const emaSlow = EMA(data.slice(-20), 21);
const momentum = price - prev;

/* SIGNAL */
let strength = 50;

if (emaFast > emaSlow) strength += 25;
if (emaFast < emaSlow) strength -= 25;

if (rsi < 30) strength += 20;
if (rsi > 70) strength += 20;

if (momentum > 0) strength += 10;
if (momentum < 0) strength -= 10;

strength = Math.max(0, Math.min(100, strength));

let signal = "WAIT";
if (strength >= 75 && rsi < 45) signal = "BUY";
else if (strength >= 75 && rsi > 55) signal = "SELL";

return {
symbol,
interval,
signal,
price,
rsi: Number(rsi.toFixed(2)),
emaFast: Number(emaFast.toFixed(2)),
emaSlow: Number(emaSlow.toFixed(2)),
momentum: Number(momentum.toFixed(2)),
trend: emaFast > emaSlow ? "BULLISH" : "BEARISH",
strength
};
}

/* =========================
API ROUTE (IMPORTANT)
========================= */
app.get("/api/:symbol/:interval", async (req, res) => {
try {
const result = await analyze(req.params.symbol, req.params.interval);
res.json(result);
} catch (e) {
res.status(500).json({ error: "SERVER ERROR" });
}
});

/* =========================
PORT RAILWAY FIX
========================= */
const PORT = process.env.PORT || 3000;

/* =========================
START SERVER
========================= */
const server = app.listen(PORT, () => {
console.log("🚀 SNIPER PRO V7 RUNNING ON PORT", PORT);
});

/* =========================
WEBSOCKET
========================= */
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {

ws.on("message", async (msg) => {
try {
const { symbol, interval } = JSON.parse(msg.toString());
const data = await analyze(symbol, interval);
ws.send(JSON.stringify(data));
} catch (e) {
ws.send(JSON.stringify({ signal: "WAIT" }));
}
});

});

/* =========================
LIVE UPDATE LOOP
========================= */
setInterval(async () => {
for (const client of wss.clients) {
if (client.readyState === 1) {
const data = await analyze("BTCUSDT", "5m");
client.send(JSON.stringify(data));
}
}
}, 10000);
