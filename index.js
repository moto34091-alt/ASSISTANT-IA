require("dotenv").config();

const express = require("express");
const axios = require("axios");
const WebSocket = require("ws");

const app = express();
app.use(express.json());

/* =========================
PORT RAILWAY SAFE
========================= */
const PORT = process.env.PORT || 3000;

/* =========================
ROOT (FIX NOT FOUND)
========================= */
app.get("/", (req, res) => {
res.send("🚀 SNIPER PRO V7 - ONLINE");
});

/* =========================
TEST
========================= */
app.get("/test", (req, res) => {
res.json({ status: "OK", server: "RUNNING" });
});

/* =========================
FOREX API (TWELVE DATA)
========================= */
async function getForex(symbol, interval) {

try {

const map = {
"30s":"1min",
"1m":"1min",
"5m":"5min",
"15m":"15min"
};

const pair = symbol.slice(0,3) + "/" + symbol.slice(3);

const url =
`https://api.twelvedata.com/time_series?symbol=${pair}&interval=${map[interval]}&outputsize=100&apikey=${process.env.TWELVE_API_KEY}`;

const res = await axios.get(url);

if (!res.data.values) return null;

return res.data.values
.reverse()
.map(c => Number(c.close));

} catch (e) {
console.log("API ERROR:", e.message);
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

const rs = avgGain / (avgLoss || 1);
return 100 - (100 / (1 + rs));
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
SUPPORT / RESISTANCE
========================= */
function support(data) {
return Math.min(...data.slice(-20));
}

function resistance(data) {
return Math.max(...data.slice(-20));
}

/* =========================
ANALYSIS ENGINE
========================= */
async function analyze(symbol, interval) {

const data = await getForex(symbol, interval);

if (!data || data.length < 30) {
return {
signal: "WAIT",
price: 0,
rsi: 50,
emaFast: 0,
emaSlow: 0,
trend: "NO DATA",
support: 0,
resistance: 0,
strength: 0
};
}

const price = data[data.length - 1];

const rsi = RSI(data);
const emaFast = EMA(data.slice(-20), 9);
const emaSlow = EMA(data.slice(-20), 21);

const sup = support(data);
const res = resistance(data);

let trend = "SIDEWAYS";
if (emaFast > emaSlow) trend = "BULLISH";
if (emaFast < emaSlow) trend = "BEARISH";

let strength = 50;

if (emaFast > emaSlow) strength += 20;
if (rsi < 30) strength += 20;
if (rsi > 70) strength += 20;

let signal = "WAIT";

if (trend === "BULLISH" && rsi < 50) signal = "BUY";
if (trend === "BEARISH" && rsi > 50) signal = "SELL";

return {
symbol,
interval,
signal,
price,
rsi: Number(rsi.toFixed(2)),
emaFast: Number(emaFast.toFixed(5)),
emaSlow: Number(emaSlow.toFixed(5)),
trend,
strength,
support: sup,
resistance: res
};
}

/* =========================
API ROUTE
========================= */
app.get("/api/:symbol/:interval", async (req, res) => {
res.json(await analyze(req.params.symbol, req.params.interval));
});

/* =========================
START SERVER (IMPORTANT)
========================= */
const server = app.listen(PORT, () => {
console.log("🚀 SNIPER PRO V7 RUNNING ON PORT", PORT);
});

/* =========================
WS LIVE
========================= */
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {

ws.on("message", async (msg) => {
try {
const { symbol, interval } = JSON.parse(msg.toString());

const result = await analyze(symbol, interval);

ws.send(JSON.stringify(result));

} catch (e) {
ws.send(JSON.stringify({ signal: "WAIT" }));
}
});

});
