require("dotenv").config();
const express = require("express");
const axios = require("axios");
const crypto = require("crypto");
const WebSocket = require("ws");

const app = express();
app.use(express.json());

const BASE = "https://api.binance.com/api/v3";

const AUTO_TRADE = process.env.AUTO_TRADE === "true";

/* =========================
SECURITY LIMITER
========================= */
let lastTradeTime = 0;
const COOLDOWN = 15000; // 15 sec entre trades

function canTrade() {
return Date.now() - lastTradeTime > COOLDOWN;
}

/* =========================
SIGNATURE BINANCE
========================= */
function sign(query) {
return crypto
.createHmac("sha256", process.env.BINANCE_SECRET)
.update(query)
.digest("hex");
}

/* =========================
PLACE ORDER (REAL)
========================= */
async function placeOrder(symbol, side, qty) {

if (!AUTO_TRADE) {
console.log("🟡 DRY MODE - NO ORDER");
return;
}

if (!canTrade()) {
console.log("⛔ COOLDOWN ACTIVE");
return;
}

const timestamp = Date.now();

const query =
`symbol=${symbol}&side=${side}&type=MARKET&quantity=${qty}&timestamp=${timestamp}`;

const signature = sign(query);

try {
const res = await axios.post(
`${BASE}/order?${query}&signature=${signature}`,
{},
{
headers: {
"X-MBX-APIKEY": process.env.BINANCE_KEY
}
}
);

lastTradeTime = Date.now();

console.log("🔥 ORDER EXECUTED:", side, symbol);

return res.data;

} catch (err) {
console.log("❌ ORDER ERROR:", err.response?.data || err.message);
}
}

/* =========================
DATA
========================= */
async function getCloses(symbol, interval) {
const res = await axios.get(`${BASE}/klines`, {
params: { symbol, interval, limit: 100 }
});
return res.data.map(c => Number(c[4]));
}

/* =========================
INDICATORS
========================= */
function RSI(data) {
let gain = 0, loss = 0;

for (let i = 1; i < 15; i++) {
const diff = data[i] - data[i - 1];
if (diff > 0) gain += diff;
else loss += Math.abs(diff);
}

return 100 - (100 / (1 + gain / (loss || 1)));
}

function EMA(data, p) {
const k = 2 / (p + 1);
let ema = data[0];

for (let i = 1; i < data.length; i++) {
ema = data[i] * k + ema * (1 - k);
}

return ema;
}

/* =========================
STRATEGY (REAL SIGNAL)
========================= */
async function analyze(symbol, interval) {

const data = await getCloses(symbol, interval);

if (!data || data.length < 50) {
return { signal: "WAIT" };
}

const price = data.at(-1);
const prev = data.at(-2);

const rsi = RSI(data);
const emaFast = EMA(data.slice(-20), 9);
const emaSlow = EMA(data.slice(-20), 21);

let signal = "WAIT";

/* STRATEGY */
if (rsi < 30 && emaFast > emaSlow) signal = "BUY";
else if (rsi > 70 && emaFast < emaSlow) signal = "SELL";

/* EXECUTION RÉELLE */
if (signal === "BUY") {
await placeOrder(symbol, "BUY", 0.001);
}

if (signal === "SELL") {
await placeOrder(symbol, "SELL", 0.001);
}

return {
symbol,
signal,
price,
rsi: rsi.toFixed(2),
emaFast: emaFast.toFixed(2),
emaSlow: emaSlow.toFixed(2),
autoTrade: AUTO_TRADE
};
}

/* =========================
API
========================= */
app.get("/api/:symbol/:interval", async (req, res) => {
res.json(await analyze(req.params.symbol, req.params.interval));
});

const server = app.listen(3000, () => {
console.log("🚀 REAL TRADING BOT RUNNING");
});

/* =========================
LIVE ENGINE
========================= */
const wss = new WebSocket.Server({ server });

wss.on("connection", ws => {
ws.on("message", async msg => {
const { symbol, interval } = JSON.parse(msg);
ws.send(JSON.stringify(await analyze(symbol, interval)));
});
});

setInterval(async () => {
for (const c of wss.clients) {
if (c.readyState === 1) {
c.send(JSON.stringify(await analyze("BTCUSDT", "5m")));
}
}
}, 10000);
