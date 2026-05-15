require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static("public"));

console.log("🚀 V15 ENGINE STARTED");

/* ================= CLEAN SYMBOL ================= */

function cleanSymbol(symbol){

if(!symbol) return "EUR/USD";

const map = {
EURUSD:"EUR/USD",
GBPUSD:"GBP/USD",
USDJPY:"USD/JPY",
USDCHF:"USD/CHF",
USDCAD:"USD/CAD",
AUDUSD:"AUD/USD",
NZDUSD:"NZD/USD",
EURGBP:"EUR/GBP",
EURJPY:"EUR/JPY",
GBPJPY:"GBP/JPY",
XAUUSD:"XAU/USD"
};

return map[symbol.toUpperCase()] || "EUR/USD";

}

/* ================= SAFE FETCH ================= */

async function getData(symbol){

try{

if(!process.env.TWELVE_API_KEY){
console.log("NO API KEY");
return null;
}

const url =
`https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1min&outputsize=50&apikey=${process.env.TWELVE_API_KEY}`;

const res = await axios.get(url);

/* SAFE CHECK */
if(!res.data || !res.data.values){
return null;
}

const values = res.data.values
.reverse()
.map(x => Number(x.close))
.filter(x => !isNaN(x));

if(values.length < 20){
return null;
}

return values;

}catch(err){
console.log("FETCH ERROR:", err.message);
return null;
}

}

/* ================= INDICATORS ================= */

function RSI(data){

if(!data || data.length < 14) return 50;

let gain = 0;
let loss = 0;

for(let i=1;i<14;i++){
const diff = data[i] - data[i-1];
diff > 0 ? gain += diff : loss += Math.abs(diff);
}

const rs = gain / (loss || 1);

return 100 - (100 / (1 + rs));

}

function EMA(data,period){

if(!data || data.length < period){
return data?.at(-1) || 0;
}

const k = 2 / (period + 1);

let ema = data[0];

for(let i=1;i<data.length;i++){
ema = data[i] * k + ema * (1 - k);
}

return ema;

}

/* ================= SCORE ENGINE ================= */

function calculateScore(price,data,rsi,emaFast,emaSlow){

let score = 0;

/* TREND */
if(emaFast > emaSlow) score += 35;
if(emaFast < emaSlow) score -= 35;

/* RSI */
if(rsi < 35) score += 25;
if(rsi > 65) score -= 25;

/* MOMENTUM */
const momentum = price - (data.at(-2) || price);

if(momentum > 0) score += 20;
if(momentum < 0) score -= 20;

/* MIN FORCE */
if(Math.abs(score) < 8){
score = score > 0 ? 10 : -10;
}

return score;

}

/* ================= API (FULL SAFE) ================= */

app.get("/api/:symbol", async (req,res)=>{

try{

const symbol = cleanSymbol(req.params.symbol);

const data = await getData(symbol);

/* FALLBACK SAFE MODE */
if(!data){

return res.json({
symbol,
signal:"WAIT",
score:10,
probability:55,
trend:"NO DATA",
price:0
});

}

const price = data.at(-1);

const rsi = RSI(data);

const emaFast = EMA(data.slice(-30),9);

const emaSlow = EMA(data.slice(-30),21);

const score = calculateScore(price,data,rsi,emaFast,emaSlow);

/* PROBABILITY */
const probability = Math.min(95, 50 + Math.abs(score));

/* SIGNAL */
let signal = "WAIT";

if(score >= 40) signal = "BUY";
if(score <= -40) signal = "SELL";

/* RESPONSE SAFE */
res.json({
symbol,
price,
rsi,
emaFast,
emaSlow,
score,
probability,
signal,
trend: emaFast > emaSlow ? "BULLISH" : "BEARISH"
});

}catch(err){

console.log("SERVER CRASH SAFE FIX:", err.message);

res.json({
signal:"WAIT",
score:0,
probability:50,
trend:"ERROR",
price:0
});

}

});

/* ================= START SERVER ================= */

app.listen(PORT, () => {
console.log("🔥 V15 RUNNING ON PORT", PORT);
});
