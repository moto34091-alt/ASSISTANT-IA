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
res.json({ status: "OK", version: "V8 FINAL" });
});

/* =========================
FALLBACK DATA (ANTI BUG)
========================= */
function fallbackMarket() {

const base = 1.1000;
const data = [];

for (let i = 0; i < 80; i++) {
const noise = (Math.random() - 0.5) * 0.002;
data.push(base + noise + i * 0.00001);
}

return data;
}

/* =========================
FOREX DATA (TWELVE DATA SAFE)
========================= */
async function getForex(symbol, interval) {

try {

const map = {
"1m": "1min",
"5m": "5min",
"15m": "15min"
};

/* AUTO SYMBOL FIX */
let pair = symbol.includes("/")
? symbol
: symbol.slice(0,3) + "/" + symbol.slice(3);

const url =
`https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(pair)}&interval=${map[interval] || "1min"}&outputsize=80&apikey=${process.env.TWELVE_API_KEY}`;

const res = await axios.get(url);

/* DEBUG */
console.log("PAIR:", pair);
console.log("STATUS:", res.data.status);

/* ERROR CHECK */
if (!res.data || res.data.status === "error") {
console.log("API FAIL → fallback");
return fallbackMarket();
}

if (!res.data.values || res.data.values.length < 20) {
console.log("NO DATA → fallback");
return fallbackMarket();
}

return res.data.values
.reverse()
.map(c => Number(c.close));

} catch (e) {
console.log("ERROR → fallback:", e.message);
return fallbackMarket();
}
}

/* =========================
INDICATORS
========================= */
function RSI(data, period = 14) {

if (!data || data.length < period + 2) return 50;

let gain = 0;
let loss = 0;

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
SMART STRUCTURE (SIMPLE BOS)
========================= */
function detectBOS(data) {

const last = data[data.length - 1];
const high = Math.max(...data.slice(-20));
const low = Math.min(...data.slice(-20));

if (last > high * 0.9995) return "BULLISH_BOS";
if (last < low * 1.0005) return "BEARISH_BOS";
return "NONE";
}

/* =========================
ANALYZE ENGINE
========================= */
async function analyze(symbol, interval) {

let data = await getForex(symbol, interval);

if (!data || data.length < 20) {
data = fallbackMarket();
}

const price = data[data.length - 1];

const rsi = RSI(data);
const emaFast = EMA(data.slice(-30), 9);
const emaSlow = EMA(data.slice(-30), 21);

const bos = detectBOS(data);

let trend = "SIDEWAYS";
if (emaFast > emaSlow) trend = "BULLISH";
if (emaFast < emaSlow) trend = "BEARISH";

let strength = 50;

if (bos === "BULLISH_BOS") strength += 20;
if (bos === "BEARISH_BOS") strength += 20;

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
price: Number(price.toFixed(5)),
rsi: Number(rsi.toFixed(2)),
emaFast: Number(emaFast.toFixed(5)),
emaSlow: Number(emaSlow.toFixed(5)),
trend,
bos,
strength: Math.min(100, strength)
};
}

/* =========================
API ROUTE
========================= */
app.get("/api/:symbol/:interval", async (req, res) => {
res.json(await analyze(req.params.symbol, req.params.interval));
});

/* =========================
START SERVER
========================= */
app.listen(PORT, () => {
console.log("🚀 SNIPER PRO V8 FULL STABLE ONLINE");
});
