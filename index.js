require("dotenv").config();

const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();

/* =========================================
   PORT
========================================= */

const PORT = process.env.PORT || 8080;

/* =========================================
   MIDDLEWARE
========================================= */

app.use(express.json());
app.use(express.static("public"));

/* =========================================
   START LOG
========================================= */

console.log("🔥 SNIPER AI PRO V10 STARTED");

/* =========================================
   HEALTH
========================================= */

app.get("/health",(req,res)=>{

res.json({
status:"OK",
server:"SNIPER AI PRO V10",
time:new Date()
});

});

/* =========================================
   HOME
========================================= */

app.get("/",(req,res)=>{

res.sendFile(
path.join(__dirname,"public","index.html")
);

});

/* =========================================
   CLEAN SYMBOL
========================================= */

function cleanSymbol(symbol){

if(!symbol) return "EUR/USD";

symbol = symbol.toUpperCase().trim();

const map = {

"EURUSD":"EUR/USD",
"GBPUSD":"GBP/USD",
"USDJPY":"USD/JPY",
"USDCHF":"USD/CHF",
"USDCAD":"USD/CAD",

"AUDUSD":"AUD/USD",
"NZDUSD":"NZD/USD",

"EURJPY":"EUR/JPY",
"GBPJPY":"GBP/JPY",

"XAUUSD":"XAU/USD"

};

return map[symbol] || symbol;

}

/* =========================================
   GET MARKET DATA
========================================= */

async function getData(symbol,interval){

try{

if(!process.env.TWELVE_API_KEY){

console.log("❌ API KEY MISSING");

return null;

}

const tfMap = {

"1m":"1min",
"5m":"5min",
"15m":"15min"

};

const tf =
tfMap[interval] || "1min";

const url =
`https://api.twelvedata.com/time_series?symbol=${cleanSymbol(symbol)}&interval=${tf}&outputsize=100&apikey=${process.env.TWELVE_API_KEY}`;

const response =
await axios.get(url);

if(
!response.data ||
response.data.status === "error"
){

console.log("❌ API ERROR");

return null;

}

if(
!response.data.values ||
response.data.values.length < 30
){

console.log("❌ NOT ENOUGH DATA");

return null;

}

/* =========================================
   FORMAT DATA
========================================= */

return response.data.values
.reverse()
.map(c=>({

close:Number(c.close),
high:Number(c.high),
low:Number(c.low),
open:Number(c.open)

}));

}catch(err){

console.log("API ERROR:",err.message);

return null;

}

}

/* =========================================
   RSI
========================================= */

function RSI(data,period=14){

if(!data || data.length < period)
return 50;

let gains = 0;
let losses = 0;

for(let i=1;i<period;i++){

const diff =
data[i].close - data[i-1].close;

if(diff >= 0){

gains += diff;

}else{

losses += Math.abs(diff);

}

}

const rs =
gains / (losses || 1);

return Number(
(
100 - (100 / (1 + rs))
).toFixed(2)
);

}

/* =========================================
   EMA
========================================= */

function EMA(data,period){

if(!data || data.length < period)
return 0;

const k = 2 / (period + 1);

let ema = data[0].close;

for(let i=1;i<data.length;i++){

ema =
data[i].close * k +
ema * (1-k);

}

return Number(ema.toFixed(2));

}

/* =========================================
   CANDLE PATTERNS
========================================= */

function detectPattern(data){

if(!data || data.length < 3)
return "NONE";

const last =
data[data.length - 1];

const prev =
data[data.length - 2];

const body =
Math.abs(last.close - last.open);

const candle =
last.high - last.low;

/* 🔥 HAMMER */

if(

body < candle * 0.3 &&
(last.open - last.low) > body * 2

){

return "HAMMER";

}

/* 🔥 SHOOTING STAR */

if(

body < candle * 0.3 &&
(last.high - last.close) > body * 2

){

return "SHOOTING_STAR";

}

/* 🔥 ENGULFING BUY */

if(

last.close > last.open &&
prev.close < prev.open &&
last.close > prev.open

){

return "BULLISH_ENGULFING";

}

/* 🔥 ENGULFING SELL */

if(

last.close < last.open &&
prev.close > prev.open &&
last.open > prev.close

){

return "BEARISH_ENGULFING";

}

return "NONE";

}

/* =========================================
   SMART API
========================================= */

app.get("/api/:symbol/:interval",async(req,res)=>{

try{

const symbol =
req.params.symbol;

const interval =
req.params.interval;

const data =
await getData(symbol,interval);

if(!data){

return res.json({

signal:"WAIT",
score:0,
probability:0,
trend:"NO DATA"

});

}

/* =========================================
   INDICATORS
========================================= */

const price =
data[data.length - 1].close;

const rsi =
RSI(data);

const emaFast =
EMA(data,9);

const emaSlow =
EMA(data,21);

const momentum =
price -
data[data.length - 5].close;

const pattern =
detectPattern(data);

/* =========================================
   SCORE ENGINE
========================================= */

let score = 0;

/* 🔥 EMA */

if(emaFast > emaSlow){

score += 35;

}else{

score -= 35;

}

/* 🔥 RSI */

if(rsi < 30){

score += 25;

}

if(rsi > 70){

score -= 25;

}

/* 🔥 MOMENTUM */

if(momentum > 0){

score += 20;

}

if(momentum < 0){

score -= 20;

}

/* 🔥 PATTERNS */

if(
pattern === "HAMMER" ||
pattern === "BULLISH_ENGULFING"
){

score += 20;

}

if(
pattern === "SHOOTING_STAR" ||
pattern === "BEARISH_ENGULFING"
){

score -= 20;

}

/* =========================================
   SIGNAL
========================================= */

let signal = "WAIT";

if(score >= 55){

signal = "BUY";

}

if(score <= -55){

signal = "SELL";

}

/* =========================================
   PROBABILITY
========================================= */

let probability =
Math.min(
95,
Math.max(
50,
Math.abs(score)
)
);

/* =========================================
   TREND
========================================= */

const trend =
emaFast > emaSlow
? "BULLISH"
: "BEARISH";

/* =========================================
   RESPONSE
========================================= */

res.json({

symbol,
interval,
signal,

price,

rsi,

emaFast,
emaSlow,

momentum,

pattern,

trend,

score,

probability

});

}catch(err){

console.log("SERVER ERROR:",err.message);

res.json({

signal:"WAIT",
score:0,
probability:0

});

}

});

/* =========================================
   START SERVER
========================================= */

app.listen(PORT,()=>{

console.log(
`🚀 SERVER RUNNING ON ${PORT}`
);

});
