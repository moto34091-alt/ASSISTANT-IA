require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

/* ================= ROOT ================= */
app.get("/", (req, res) => {
res.send("🚀 SNIPER PRO V11 - ONLINE");
});

/* ================= FETCH DATA ================= */
async function getData(symbol, interval) {

try {

const map = {
"30s": "1min",
"1m": "1min",
"5m": "5min",
"15m": "15min"
};

if (!symbol.includes("/")) {
symbol = symbol.slice(0,3) + "/" + symbol.slice(3);
}

const url =
`https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${map[interval] || "1min"}&outputsize=100&apikey=${process.env.TWELVE_API_KEY}`;

const res = await axios.get(url);

const values = res.data?.values;

if (!values || values.length < 15) {
return null;
}

return values.reverse().map(c => Number(c.close));

} catch (e) {
console.log("API ERROR:", e.message);
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

const rs = gain / (loss || 1);
return 100 - (100 / (1 + rs));
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

/* ================= API ================= */
app.get("/api/:symbol/:interval", async (req, res) => {

let symbol = req.params.symbol;
let interval = req.params.interval;

if (!symbol.includes("/")) {
symbol = symbol.slice(0,3) + "/" + symbol.slice(3);
}

if (interval === "30s") interval = "1m";

const data = await getData(symbol, interval);

/* ================= FALLBACK INTELLIGENT ================= */
if (!data) {

const fakePrice = 1.1000;

return res.json({
symbol,
interval,
signal: "WAIT",
price: fakePrice,
rsi: 50,
trend: "MARKET LOADING",
strength: 35
});
}

const price = data.at(-1);
const rsi = RSI(data);
const emaFast = EMA(data.slice(-20), 9);
const emaSlow = EMA(data.slice(-20), 21);

/* ================= TREND ================= */
let trend = "SIDEWAYS";
if (emaFast > emaSlow) trend = "BULLISH";
if (emaFast < emaSlow) trend = "BEARISH";

/* ================= SIGNAL ================= */
let signal = "WAIT";

if (trend === "BULLISH" && rsi < 65) signal = "BUY";
if (trend === "BEARISH" && rsi > 35) signal = "SELL";

/* ================= STRENGTH ================= */
let strength = 50;

if (signal !== "WAIT") strength += 25;
if (rsi > 50 && rsi < 70) strength += 10;

/* ================= RESPONSE ================= */
res.json({
symbol,
interval,
signal,
price,
rsi: Number(rsi.toFixed(2)),
trend,
strength: Math.min(100, strength)
});
});

app.listen(PORT, () => {
console.log("🚀 SNIPER PRO V11 ONLINE");
});
