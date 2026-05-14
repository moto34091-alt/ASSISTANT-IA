require("dotenv").config();

const express = require("express");
const axios = require("axios");
const WebSocket = require("ws");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

/* =========================
ROOT
========================= */
app.get("/", (req, res) => {
res.send("🚀 SNIPER PRO V7 - ONLINE");
});

app.get("/test", (req, res) => {
res.json({ status: "OK", server: "RUNNING" });
});

/* =========================
TWELVE DATA FOREX FIX
========================= */
async function getForex(symbol, interval) {

try {

const map = {
"1m": "1min",
"5m": "5min",
"15m": "15min"
};

/* FIX PAIRE */
const pair =
symbol.includes("/")
? symbol
: symbol.slice(0, 3) + "/" + symbol.slice(3);

const url = `https://api.twelvedata.com/time_series?symbol=${pair}&interval=${map[interval] || "1min"}&outputsize=100&apikey=${process.env.TWELVE_API_KEY}`;

const res = await axios.get(url);

/* DEBUG IMPORTANT */
console.log("TWELVE RESPONSE STATUS:", res.status);
console.log("TWELVE RESPONSE:", JSON.stringify(res.data).slice(0, 300));

/* ERROR HANDLING CLEAN */
if (!res.data || res.data.status === "error") {
console.log("API ERROR:", res.data);
return null;
}

if (!res.data.values || res.data.values.length < 20) {
console.log("NO VALUES OR TOO SMALL DATASET");
return null;
}

return res.data.values
.reverse()
.map(c => Number(c.close));

} catch (e) {
console.log("FOREX ERROR:", e.message);
return null;
}
}

/* =========================
RSI
========================= */
function RSI(data, period = 14) {

if (!data || data.length < period + 2) return 50;

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
ANALYSIS ENGINE FIXED
========================= */
async function analyze(symbol, interval) {

const data = await getForex(symbol, interval);

if (!data) {
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

if (trend === "BULLISH" && rsi < 55) signal = "BUY";
if (trend === "BEARISH" && rsi > 45) signal = "SELL";

return {
symbol,
interval,
signal,
price,
rsi: Number(rsi.toFixed(2)),
emaFast: Number(emaFast.toFixed(5)),
emaSlow: Number(emaSlow.toFixed(5)),
trend,
support: sup,
resistance: res,
strength
};
}

/* =========================
API
========================= */
app.get("/api/:symbol/:interval", async (req, res) => {
res.json(await analyze(req.params.symbol, req.params.interval));
});

/* =========================
START
========================= */
app.listen(PORT, () => {
console.log("🚀 SNIPER PRO V7 RUNNING ON", PORT);
});
