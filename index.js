require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static("public"));

console.log("🚀 SNIPER AI V14 FULL ENGINE STARTED");

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

return map[symbol.toUpperCase()] || symbol;

}

/* ================= FETCH DATA ================= */

async function getData(symbol){

try{

if(!process.env.TWELVE_API_KEY){
return null;
}

const url =
`https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1min&outputsize=80&apikey=${process.env.TWELVE_API_KEY}`;

const res = await axios.get(url);

if(!res.data || !res.data.values || res.data.values.length < 25){
return null;
}

return res.data.values
.reverse()
.map(c => Number(c.close))
.filter(v => !isNaN(v));

}catch(err){
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
if(emaFast > emaSlow) score += 40;
if(emaFast < emaSlow) score -= 40;

/* RSI */
if(rsi < 35) score += 30;
if(rsi > 65) score -= 30;

/* MOMENTUM */
const momentum = price - (data.at(-3) || price);
if(momentum > 0) score += 25;
if(momentum < 0) score -= 25;

/* FORCE MIN */
if(Math.abs(score) < 10){
score = score > 0 ? 15 : -15;
}

return score;

}

/* ================= API ================= */

app.get("/api/:symbol", async (req,res)=>{

const symbol = cleanSymbol(req.params.symbol);

const data = await getData(symbol);

/* SAFE MODE */
if(!data){

return res.json({
symbol,
signal:"WAIT",
score:10,
probability:55,
trend:"NO DATA"
});

}

const price = data.at(-1);

const rsi = RSI(data);

const emaFast = EMA(data.slice(-30),9);

const emaSlow = EMA(data.slice(-30),21);

const score =
calculateScore(price,data,rsi,emaFast,emaSlow);

/* PROBABILITY */
const probability =
60 + Math.min(35, Math.abs(score));

/* SIGNAL */
let signal = "WAIT";

if(score >= 45) signal = "BUY";
if(score <= -45) signal = "SELL";

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

});

app.listen(PORT,()=>{

console.log("🔥 SERVER RUNNING ON PORT",PORT);

});
