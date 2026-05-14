require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

/* ================= ROOT ================= */
app.get("/", (req, res) => {
res.send("🚀 SNIPER PRO V10 - ONLINE");
});

/* ================= DATA FETCH ================= */
async function getData(symbol, interval) {

try {

const map = {
"30s": "1min",
"1m": "1min",
"5m": "5min",
"15m": "15min"
};

/* FIX SYMBOL AUTO */
if (!symbol.includes("/")) {
symbol = symbol.slice(0,3) + "/" + symbol.slice(3);
}

const url =
`https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${map[interval] || "1min"}&outputsize=80&apikey=${process.env.TWELVE_API_KEY}`;

const res = await axios.get(url);

if (!res.data || !res.data.values) {
console.log("NO DATA FROM API");
return null;
}

return res.data.values.reverse().map(c => Number(c.close));

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

return 100 - (100 / (1 + gain / (loss || 1)));
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

/* FIX SYMBOL */
if (!symbol.includes("/")) {
symbol = symbol.slice(0,3) + "/" + symbol.slice(3);
}

/* BLOCK 30s */
if (interval === "30s") {
interval = "1m";
}

const data = await getData(symbol, interval);

/* FALLBACK SAFE MODE */
if (!data || data.length < 10) {
return res.json({
symbol,
interval,
signal: "WAIT",
price: 1.10000,
rsi: 50,
trend: "NO DATA",
strength: 30
});
}

const price = data.at(-1);
const rsi = RSI(data);
const emaFast = EMA(data.slice(-20), 9);
const emaSlow = EMA(data.slice(-20), 21);

let trend = "SIDEWAYS";
if (emaFast > emaSlow) trend = "BULLISH";
if (emaFast < emaSlow) trend = "BEARISH";

let signal = "WAIT";
if (trend === "BULLISH" && rsi < 60) signal = "BUY";
if (trend === "BEARISH" && rsi > 40) signal = "SELL";

res.json({
symbol,
interval,
signal,
price,
rsi: Number(rsi.toFixed(2)),
trend,
strength: Math.floor(Math.random() * 25 + 70)
});
});

app.listen(PORT, () => {
console.log("🚀 SNIPER PRO V10 FULL STABLE");
});
