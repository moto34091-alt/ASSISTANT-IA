require("dotenv").config();

const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

/* =========================
ROOT
========================= */
app.get("/", (req, res) => {
res.send("🚀 SNIPER PRO V8 SMART MONEY - ONLINE");
});

/* =========================
TEST
========================= */
app.get("/test", (req, res) => {
res.json({ status: "OK", version: "V8 SMART MONEY" });
});

/* =========================
FETCH DATA (TWELVE DATA FIX)
========================= */
async function getForex(symbol, interval) {

try {

const map = {
"1m": "1min",
"5m": "5min",
"15m": "15min"
};

let pair = symbol.includes("/")
? symbol
: symbol.slice(0,3) + "/" + symbol.slice(3);

const url =
`https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(pair)}&interval=${map[interval] || "1min"}&outputsize=120&apikey=${process.env.TWELVE_API_KEY}`;

const res = await axios.get(url);

if (!res.data || res.data.status === "error") return null;
if (!res.data.values || res.data.values.length < 50) return null;

return res.data.values
.reverse()
.map(c => Number(c.close));

} catch (e) {
console.log("API ERROR:", e.message);
return null;
}
}

/* =========================
INDICATORS
========================= */
function RSI(data, period = 14) {

if (!data || data.length < period + 2) return 50;

let gain = 0, loss = 0;

for (let i = 1; i <= period; i++) {
const diff = data[i] - data[i - 1];
diff > 0 ? gain += diff : loss += Math.abs(diff);
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

function EMA(data, period) {
const k = 2 / (period + 1);
let ema = data[0];
for (let i = 1; i < data.length; i++) {
ema = data[i] * k + ema * (1 - k);
}
return ema;
}

/* =========================
SMART MONEY LOGIC (SIMPLIFIED)
========================= */

/* BOS = Break of Structure */
function detectBOS(data) {
const last = data[data.length - 1];
const prevHigh = Math.max(...data.slice(-20));
const prevLow = Math.min(...data.slice(-20));

if (last > prevHigh * 0.999) return "BULLISH_BOS";
if (last < prevLow * 1.001) return "BEARISH_BOS";
return "NONE";
}

/* LIQUIDITY ZONES (simple proxy) */
function liquidityZones(data) {
const highs = Math.max(...data.slice(-20));
const lows = Math.min(...data.slice(-20));
return { highs, lows };
}

/* =========================
ANALYZE ENGINE V8
========================= */
async function analyze(symbol, interval) {

const data = await getForex(symbol, interval);

if (!data) {
return {
signal: "WAIT",
trend: "NO DATA",
price: 0,
rsi: 50,
emaFast: 0,
emaSlow: 0,
bos: "NONE",
strength: 0
};
}

const price = data[data.length - 1];

const rsi = RSI(data);
const emaFast = EMA(data.slice(-30), 9);
const emaSlow = EMA(data.slice(-30), 21);

const bos = detectBOS(data);
const liq = liquidityZones(data);

let trend = "SIDEWAYS";
if (emaFast > emaSlow) trend = "BULLISH";
if (emaFast < emaSlow) trend = "BEARISH";

let strength = 50;

/* SMART MONEY LOGIC */
if (bos === "BULLISH_BOS") strength += 25;
if (bos === "BEARISH_BOS") strength += 25;

if (rsi < 30) strength += 15;
if (rsi > 70) strength += 15;

if (emaFast > emaSlow) strength += 10;

let signal = "WAIT";

if (strength > 75 && trend === "BULLISH") signal = "BUY";
if (strength > 75 && trend === "BEARISH") signal = "SELL";

return {
symbol,
interval,
signal,
price,
rsi: Number(rsi.toFixed(2)),
emaFast: Number(emaFast.toFixed(5)),
emaSlow: Number(emaSlow.toFixed(5)),
trend,
bos,
liquidity: liq,
strength: Math.min(100, strength)
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
console.log("🚀 SNIPER PRO V8 SMART MONEY RUNNING");
});
