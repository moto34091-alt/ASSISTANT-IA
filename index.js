require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static("public"));

console.log("🚀 V15 UPGRADED ENGINE START");

/* ================= CLEAN SYMBOL ================= */

function cleanSymbol(symbol){
return symbol || "EUR/USD";
}

/* ================= FETCH DATA ================= */

async function getData(symbol, interval){

try{

if(!process.env.TWELVE_API_KEY){
return null;
}

const url =
`https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${interval}&outputsize=80&apikey=${process.env.TWELVE_API_KEY}`;

const res = await axios.get(url);

if(!res.data?.values) return null;

return res.data.values
.reverse()
.map(c => Number(c.close))
.filter(v => !isNaN(v));

}catch(e){
return null;
}

}

/* ================= RSI ================= */

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

/* ================= EMA ================= */

function EMA(data, period){

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

/* ================= ENGINE ================= */

function engine(price,data,rsi,emaFast,emaSlow){

let score = 0;

/* TREND */
if(emaFast > emaSlow) score += 35;
if(emaFast < emaSlow) score -= 35;

/* RSI */
if(rsi < 30) score += 30;
if(rsi > 70) score -= 30;

/* MOMENTUM */
const momentum = price - (data.at(-3) || price);

if(momentum > 0) score += 20;
if(momentum < 0) score -= 20;

/* STABILIZE */
if(Math.abs(score) < 10){
score = score > 0 ? 12 : -12;
}

return score;

}

/* ================= API ================= */

app.get("/api/:symbol/:interval", async (req,res)=>{

const symbol = cleanSymbol(req.params.symbol);
const interval = req.params.interval;

const data = await getData(symbol, interval);

if(!data){

return res.json({
symbol,
signal:"WAIT",
score:0,
probability:50,
rsi:50,
momentum:0,
trend:"NO DATA"
});

}

const price = data.at(-1);

const rsi = RSI(data);

const emaFast = EMA(data.slice(-30),9);

const emaSlow = EMA(data.slice(-30),21);

const score = engine(price,data,rsi,emaFast,emaSlow);

/* PROBABILITY */
const probability = Math.min(95, 55 + Math.abs(score));

/* MOMENTUM */
const momentum = price - (data.at(-2) || price);

/* SIGNAL */
let signal = "WAIT";

if(score >= 40) signal = "BUY";
if(score <= -40) signal = "SELL";

res.json({
symbol,
price,
rsi: Number(rsi.toFixed(2)),
momentum: Number(momentum.toFixed(5)),
score,
probability,
signal,
trend: emaFast > emaSlow ? "BULLISH" : "BEARISH"
});

});

app.listen(PORT,()=>{
console.log("🔥 V15 UPGRADED RUNNING");
});
