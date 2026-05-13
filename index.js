/* =========================================================
   COMPLETE AI ANALYZE ENGINE
   REMPLACE TON ANCIEN analyze()
========================================================= */

/* =========================
CANDLE PATTERNS
========================= */

function isHammer(candle){

const body =
Math.abs(candle.close - candle.open);

const lowerShadow =
Math.min(candle.open,candle.close)
- candle.low;

const upperShadow =
candle.high -
Math.max(candle.open,candle.close);

return (
lowerShadow > body * 2 &&
upperShadow < body
);

}

function isDoji(candle){

return (
Math.abs(candle.close - candle.open)
<
(candle.high - candle.low) * 0.1
);

}

function bullishEngulfing(prev,current){

return (

prev.close < prev.open &&

current.close > current.open &&

current.open < prev.close &&

current.close > prev.open

);

}

function bearishEngulfing(prev,current){

return (

prev.close > prev.open &&

current.close < current.open &&

current.open > prev.open &&

current.close < prev.open

);

}

function morningStar(a,b,c){

return (

a.close < a.open &&

Math.abs(b.close - b.open)
<
(a.open - a.close) * 0.3 &&

c.close > c.open &&

c.close >
(a.open + a.close)/2

);

}

function shootingStar(candle){

const body =
Math.abs(candle.close - candle.open);

const upperShadow =
candle.high -
Math.max(candle.open,candle.close);

const lowerShadow =
Math.min(candle.open,candle.close)
- candle.low;

return (
upperShadow > body * 2 &&
lowerShadow < body
);

}

/* =========================
GET MARKET DATA
========================= */

async function getMarketData(symbol, interval){

try{

const r = await axios.get(
`${BASE}/klines`,
{
params:{
symbol,
interval,
limit:100
},
timeout:15000
}
);

const candles = r.data.map(c => ({

open: parseFloat(c[1]),
high: parseFloat(c[2]),
low: parseFloat(c[3]),
close: parseFloat(c[4]),
volume: parseFloat(c[5])

}));

return candles;

}catch(e){

console.log("MARKET ERROR:",e.message);

return null;

}

}

/* =========================
AI ANALYSIS ENGINE
========================= */

async function analyze(
symbol="BTCUSDT",
interval="1m"
){

try{

const candles =
await getMarketData(symbol,interval);

if(!candles || candles.length < 30){

return lastData[symbol] || {};

}

const prices =
candles.map(c=>c.close);

const volumes =
candles.map(c=>c.volume);

const last =
prices.at(-1);

const rsi =
RSI(prices);

const emaFast =
EMA(prices.slice(-20),9);

const emaSlow =
EMA(prices.slice(-20),21);

const momentum =
last - prices.at(-2);

let scoreBuy = 0;
let scoreSell = 0;

let patterns = [];

/* =========================
RSI
========================= */

if(rsi < 35){

scoreBuy += 20;

patterns.push("RSI OVERSOLD");

}

if(rsi > 65){

scoreSell += 20;

patterns.push("RSI OVERBOUGHT");

}

/* =========================
EMA CROSS
========================= */

if(emaFast > emaSlow){

scoreBuy += 20;

patterns.push("EMA BULLISH");

}else{

scoreSell += 20;

patterns.push("EMA BEARISH");

}

/* =========================
MOMENTUM
========================= */

if(momentum > 0){

scoreBuy += 10;

patterns.push("BULL MOMENTUM");

}else{

scoreSell += 10;

patterns.push("BEAR MOMENTUM");

}

/* =========================
HAMMER
========================= */

if(isHammer(candles.at(-1))){

scoreBuy += 25;

patterns.push("HAMMER");

}

/* =========================
DOJI
========================= */

if(isDoji(candles.at(-1))){

patterns.push("DOJI");

}

/* =========================
BULLISH ENGULFING
========================= */

if(
bullishEngulfing(
candles.at(-2),
candles.at(-1)
)
){

scoreBuy += 30;

patterns.push("BULLISH ENGULFING");

}

/* =========================
BEARISH ENGULFING
========================= */

if(
bearishEngulfing(
candles.at(-2),
candles.at(-1)
)
){

scoreSell += 30;

patterns.push("BEARISH ENGULFING");

}

/* =========================
MORNING STAR
========================= */

if(
morningStar(
candles.at(-3),
candles.at(-2),
candles.at(-1)
)
){

scoreBuy += 35;

patterns.push("MORNING STAR");

}

/* =========================
SHOOTING STAR
========================= */

if(isShootingStar(candles.at(-1))){

scoreSell += 25;

patterns.push("SHOOTING STAR");

}

/* =========================
VOLUME SPIKE
========================= */

const avgVolume =
volumes.reduce((a,b)=>a+b,0)
/
volumes.length;

if(volumes.at(-1) > avgVolume * 1.5){

scoreBuy += 10;

patterns.push("VOLUME SPIKE");

}

/* =========================
TREND
========================= */

let trend = "SIDEWAYS";

if(emaFast > emaSlow){

trend = "BULLISH";

}else{

trend = "BEARISH";

}

/* =========================
FINAL SIGNAL
========================= */

let signal = "WAIT";

let strength = 50;

if(scoreBuy >= 70){

signal = "BUY";

strength = scoreBuy;

}
else if(scoreSell >= 70){

signal = "SELL";

strength = scoreSell;

}

/* =========================
FAKE AI LEARNING
========================= */

Math.random() > 0.4
? stats.win++
: stats.loss++;

/* =========================
SAVE DATA
========================= */

const data = {

symbol,

interval,

price:
last.toFixed(2),

signal,

strength,

trend,

rsi:
rsi.toFixed(2),

emaFast:
emaFast.toFixed(2),

emaSlow:
emaSlow.toFixed(2),

momentum:
momentum.toFixed(2),

volume:
(
avgVolume / 1000
).toFixed(2),

patterns,

winRate:
winRate()

};

lastData[symbol] = data;

console.log("LIVE AI:",data);

return data;

}catch(e){

console.log(
"AI ENGINE ERROR:",
e.message
);

return {};

}

}
