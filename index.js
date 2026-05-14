require("dotenv").config();

const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

/* ================= ROOT ================= */
app.get("/", (req, res) => {
res.send("🚀 SNIPER PRO V9 ULTRA TRADING - ONLINE");
});

/* ================= DATA ================= */
async function getData(symbol, interval) {

try {

const map = {
"1m": "1min",
"5m": "5min",
"15m": "15min"
};

const pair = symbol.includes("/")
? symbol
: symbol.slice(0,3) + "/" + symbol.slice(3);

const url =
`https://api.twelvedata.com/time_series?symbol=${pair}&interval=${map[interval] || "1min"}&outputsize=80&apikey=${process.env.TWELVE_API_KEY}`;

const res = await axios.get(url);

if (!res.data?.values) return null;

return res.data.values.reverse().map(c => Number(c.close));

} catch (e) {
return null;
}
}

/* ================= RSI ================= */
function RSI(data) {
if (!data || data.length < 14) return 50;

let gain = 0, loss = 0;

for (let i = 1; i < 14; i++) {
const diff = data[i] - data[i - 1];
diff > 0 ? gain += diff : loss += Math.abs(diff);
}

return 100 - (100 / (1 + (gain / (loss || 1))));
}

/* ================= EMA ================= */
function EMA(data, period) {
const k = 2 / (period + 1);
let ema = data[0];

for (let i = 1; i < data.length; i++) {
ema = data[i] * k + ema * (1 - k);
}

return ema;
}

/* ================= SMART MONEY V9 ================= */

/* BOS + CHoCH */
function structure(data) {

const last = data.at(-1);
const high = Math.max(...data.slice(-20));
const low = Math.min(...data.slice(-20));

if (last > high * 0.9995) return "BULLISH_BOS";
if (last < low * 1.0005) return "BEARISH_BOS";
return "NONE";
}

/* liquidity sweep (simple) */
function liquidity(data) {

const high = Math.max(...data.slice(-20));
const low = Math.min(...data.slice(-20));
const last = data.at(-1);

if (last > high) return "BUY_SWEEP";
if (last < low) return "SELL_SWEEP";
return "NONE";
}

/* ================= ANALYSE ================= */
app.get("/api/:symbol/:interval", async (req, res) => {

let data = await getData(req.params.symbol, req.params.interval);

if (!data) {
return res.json({
signal: "WAIT",
trend: "NO DATA",
strength: 0
});
}

const price = data.at(-1);
const rsi = RSI(data);
const emaFast = EMA(data.slice(-25), 9);
const emaSlow = EMA(data.slice(-25), 21);

const bos = structure(data);
const sweep = liquidity(data);

let trend = "SIDEWAYS";
if (emaFast > emaSlow) trend = "BULLISH";
if (emaFast < emaSlow) trend = "BEARISH";

let strength = 50;

/* SMART MONEY BOOST */
if (bos === "BULLISH_BOS") strength += 20;
if (bos === "BEARISH_BOS") strength += 20;

if (sweep === "BUY_SWEEP") strength += 15;
if (sweep === "SELL_SWEEP") strength += 15;

if (rsi < 30) strength += 10;
if (rsi > 70) strength += 10;

/* SIGNAL FILTER */
let signal = "WAIT";

if (strength > 75 && trend === "BULLISH") signal = "BUY";
if (strength > 75 && trend === "BEARISH") signal = "SELL";

res.json({
symbol: req.params.symbol,
interval: req.params.interval,
signal,
price,
rsi: Number(rsi.toFixed(2)),
trend,
bos,
sweep,
strength: Math.min(100, strength)
});
});

app.listen(PORT, () => {
console.log("🚀 V9 SMART MONEY ONLINE");
});
