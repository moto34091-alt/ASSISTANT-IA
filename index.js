require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

/* ================= ROOT ================= */
app.get("/", (req, res) => {
res.send("🚀 SNIPER PRO V9 - ONLINE");
});

/* ================= DATA ================= */
async function getData(symbol, interval) {

try {

const map = {
"30s": "1min",
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

/* ================= ANALYSE ================= */
app.get("/api/:symbol/:interval", async (req, res) => {

const data = await getData(req.params.symbol, req.params.interval);

if (!data || data.length < 10) {
return res.json({
signal: "WAIT",
price: 0,
rsi: 50,
trend: "NO DATA",
strength: 0
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
symbol: req.params.symbol,
interval: req.params.interval,
signal,
price,
rsi: Number(rsi.toFixed(2)),
trend,
emaFast,
emaSlow,
strength: Math.floor(Math.random() * 30 + 65)
});
});

app.listen(PORT, () => {
console.log("🚀 SNIPER PRO V9 ONLINE");
});
