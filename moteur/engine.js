const fetch = (...args) =>
import("node-fetch").then(({ default: fetch }) => fetch(...args));

const API_KEY = process.env.TWELVE_API_KEY;

/* ─────────────────────────────
   GET CANDLES (REAL DATA)
───────────────────────────── */
async function getCandles(symbol) {

try {

let fixed = symbol;

if (symbol.length === 6) {
fixed = symbol.slice(0, 3) + "/" + symbol.slice(3);
}

if (symbol === "XAUUSD") fixed = "XAU/USD";
if (symbol === "BTCUSD") fixed = "BTC/USD";
if (symbol === "ETHUSD") fixed = "ETH/USD";

const url = `https://api.twelvedata.com/time_series?symbol=${fixed}&interval=1min&outputsize=50&apikey=${API_KEY}`;

const res = await fetch(url);
const data = await res.json();

if (!data || !data.values) return null;

/* convert to numbers */
return data.values.map(c => Number(c.close)).reverse();

} catch (err) {
console.log("CANDLES ERROR:", err);
return null;
}

}

/* ─────────────────────────────
   RSI (FIXED REAL VERSION)
───────────────────────────── */
function calculateRSI(closes, period = 14) {

if (!closes || closes.length < period + 1) return 50;

let gains = 0;
let losses = 0;

for (let i = 1; i <= period; i++) {

let diff = closes[i] - closes[i - 1];

if (diff > 0) gains += diff;
else losses += Math.abs(diff);

}

if (losses === 0) return 100;

let rs = gains / losses;

return 100 - (100 / (1 + rs));

}

/* ─────────────────────────────
   MACD SIMPLE
───────────────────────────── */
function calculateMACD(closes) {

if (!closes || closes.length < 26) return 0;

let short = closes.slice(-12).reduce((a, b) => a + b, 0) / 12;
let long = closes.slice(-26).reduce((a, b) => a + b, 0) / 26;

return short - long;

}

/* ─────────────────────────────
   ENGINE CORE
───────────────────────────── */
async function analyzeMarket(symbol, tf) {

try {

const candles = await getCandles(symbol);

if (!candles) {
return {
price: null,
rsi: 50,
macd: 0,
structure: "NEUTRAL",
confidence: 0,
signal: "WAIT",
quality: "LOW"
};
}

const price = candles[candles.length - 1];

const rsi = calculateRSI(candles);
const macd = calculateMACD(candles);

/* STRUCTURE FIXED */
let structure = "NEUTRAL";

if (rsi > 55 && macd > 0) structure = "BULLISH";
if (rsi < 45 && macd < 0) structure = "BEARISH";

/* CONFIDENCE REAL */
let confidence = 50;

if (rsi > 55) confidence += 20;
if (rsi < 45) confidence += 20;

if (macd > 0) confidence += 15;
if (macd < 0) confidence += 15;

confidence = Math.min(100, Math.max(0, confidence));

/* SIGNAL */
let signal = "WAIT";

if (confidence >= 70) signal = "BUY";
if (confidence <= 35) signal = "SELL";

/* QUALITY */
let quality = confidence > 75 ? "HIGH" : "LOW";

return {
price: Number(price),
rsi: Number(rsi.toFixed(2)),
macd: Number(macd.toFixed(4)),
structure,
confidence,
signal,
quality,
timeframe: tf || "1min"
};

} catch (err) {

console.log("ENGINE ERROR:", err);

return {
price: null,
rsi: 50,
macd: 0,
structure: "NEUTRAL",
confidence: 0,
signal: "WAIT",
quality: "LOW"
};

}

}

module.exports = { analyzeMarket };
