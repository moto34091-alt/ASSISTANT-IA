const fetch = (...args) =>
import("node-fetch").then(({ default: fetch }) => fetch(...args));

const API_KEY = process.env.TWELVE_API_KEY;

/* ─────────────────────────────
   FETCH CANDLES (REAL DATA)
───────────────────────────── */
async function getCandles(symbol) {
try {

let fixed = symbol;

if (symbol.length === 6) {
fixed = symbol.slice(0, 3) + "/" + symbol.slice(3);
}

if (symbol === "XAUUSD") fixed = "XAU/USD";
if (symbol === "BTCUSD") fixed = "BTC/USD";

const url = `https://api.twelvedata.com/time_series?symbol=${fixed}&interval=1min&outputsize=50&apikey=${API_KEY}`;

const res = await fetch(url);
const data = await res.json();

if (!data || !data.values) return null;

return data.values.map(c => Number(c.close)).reverse();

} catch (err) {
console.log("CANDLES ERROR:", err);
return null;
}
}

/* ─────────────────────────────
   RSI CALCULATION (REAL)
───────────────────────────── */
function calculateRSI(closes, period = 14) {
if (!closes || closes.length < period + 1) return 50;

let gains = 0;
let losses = 0;

for (let i = 1; i <= period; i++) {
let diff = closes[i] - closes[i - 1];
if (diff >= 0) gains += diff;
else losses -= diff;
}

let rs = gains / (losses || 1);
let rsi = 100 - (100 / (1 + rs));

return rsi;
}

/* ─────────────────────────────
   SIMPLE MACD
───────────────────────────── */
function calculateMACD(closes) {
if (!closes || closes.length < 26) return 0;

let short = closes.slice(-12).reduce((a,b)=>a+b,0)/12;
let long = closes.slice(-26).reduce((a,b)=>a+b,0)/26;

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

/* STRUCTURE */
let structure = "NEUTRAL";

if (rsi > 60 && macd > 0) structure = "BULLISH";
if (rsi < 40 && macd < 0) structure = "BEARISH";

/* CONFIDENCE */
let confidence = 50;

if (structure === "BULLISH") confidence += 25;
if (structure === "BEARISH") confidence += 25;

if (Math.abs(macd) > 0.5) confidence += 10;

confidence = Math.min(100, Math.max(0, confidence));

/* SIGNAL */
let signal = "WAIT";

if (confidence >= 70) signal = "BUY";
if (confidence <= 35) signal = "SELL";

/* QUALITY */
let quality = confidence > 75 ? "HIGH" : "LOW";

return {
price: Number(price.toFixed(5)),
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
