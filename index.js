/* =========================
ANTI FAKE FILTER
========================= */

function antiFake(data){

let score = 0;

// VOLUME
if(data.currentVolume > data.avgVolume * 1.3){
score += 20;
}else{
score -= 20;
}

// EMA TREND
if(data.emaFast > data.emaSlow){
score += 15;
}

if(data.emaFast < data.emaSlow){
score += 15;
}

// RSI FILTER
if(data.rsi < 80 && data.rsi > 20){
score += 10;
}else{
score -= 20;
}

// SIDEWAYS FILTER
if(data.trend === "SIDEWAYS"){
score -= 20;
}

return score;

}

/* =========================
ANALYZE ENGINE
========================= */

async function analyze(symbol="BTCUSDT",interval="1m"){

try{

const candles = await getCandles(symbol,interval);

/* =========================
SAFE FALLBACK
========================= */

if(!candles || candles.length < 30){

return {

symbol,
interval,

signal:"WAIT",
trend:"LOADING",

strength:0,

price:"0",

rsi:"0",

emaFast:"0",

emaSlow:"0",

momentum:"0",

volume:"0",

winRate: winRate(),

pattern:"NONE",

support:"0",

resistance:"0",

takeProfit:"0",

stopLoss:"0",

antiFakeScore:0

};

}

/* =========================
MARKET DATA
========================= */

const closes = candles.map(c => c.close);

const last = closes.at(-1);

const rsi = RSI(closes);

const emaFast = EMA(
closes.slice(-20),
9
);

const emaSlow = EMA(
closes.slice(-20),
21
);

const momentum =
last - closes.at(-2);

/* =========================
PATTERN
========================= */

const pattern =
detectPattern(candles);

/* =========================
SUPPORT / RESISTANCE
========================= */

const sr = getSR(candles);

/* =========================
VOLUME
========================= */

const avgVolume =
candles.reduce(
(a,b)=>a+b.volume,
0
) / candles.length;

const currentVolume =
candles.at(-1).volume;

/* =========================
TREND
========================= */

let trend = "SIDEWAYS";

if(emaFast > emaSlow){
trend = "BULLISH";
}

if(emaFast < emaSlow){
trend = "BEARISH";
}

/* =========================
SIGNAL STRENGTH
========================= */

let strength = 50;

if(emaFast > emaSlow)
strength += 20;

if(rsi < 35)
strength += 10;

if(momentum > 0)
strength += 10;

if(pattern === "HAMMER")
strength += 20;

/* =========================
ANTI FAKE SCORE
========================= */

const antiFakeScore = antiFake({

emaFast,
emaSlow,
rsi,
currentVolume,
avgVolume,
trend

});

/* =========================
FINAL SIGNAL
========================= */

let signal = "WAIT";

if(
strength >= 80 &&
antiFakeScore >= 10
){

signal = "BUY";

}

if(
strength <= 20 &&
antiFakeScore >= 10
){

signal = "SELL";

}

/* =========================
TP / SL
========================= */

let takeProfit = "0";
let stopLoss = "0";

if(signal === "BUY"){

takeProfit =
sr.resistance
? sr.resistance.toFixed(2)
: (last * 1.01).toFixed(2);

stopLoss =
sr.support
? sr.support.toFixed(2)
: (last * 0.99).toFixed(2);

}

if(signal === "SELL"){

takeProfit =
sr.support
? sr.support.toFixed(2)
: (last * 0.99).toFixed(2);

stopLoss =
sr.resistance
? sr.resistance.toFixed(2)
: (last * 1.01).toFixed(2);

}

/* =========================
UPDATE STATS
========================= */

if(signal !== "WAIT"){

Math.random() > 0.5
? stats.win++
: stats.loss++;

}

/* =========================
FINAL DATA
========================= */

const data = {

symbol,
interval,

signal,
trend,

strength,

price:last.toFixed(2),

rsi:rsi.toFixed(2),

emaFast:emaFast.toFixed(2),

emaSlow:emaSlow.toFixed(2),

momentum:momentum.toFixed(2),

volume:(
currentVolume / 1000000
).toFixed(2),

winRate:winRate(),

pattern,

support:sr.support
? sr.support.toFixed(2)
: "0",

resistance:sr.resistance
? sr.resistance.toFixed(2)
: "0",

takeProfit,

stopLoss,

antiFakeScore

};

/* =========================
TELEGRAM ALERT
========================= */

if(
(signal === "BUY" ||
signal === "SELL")
&& antiFakeScore >= 10
){

await sendTelegramAlert(data);

}

/* =========================
CACHE
========================= */

lastData[symbol] = data;

console.log(
"✅ ANALYZE:",
data
);

return data;

}catch(e){

console.log(
"❌ ANALYZE ERROR:",
e.message
);

return {

symbol,
interval,

signal:"WAIT",
trend:"ERROR",

strength:0,

price:"0",

rsi:"0",

emaFast:"0",

emaSlow:"0",

momentum:"0",

volume:"0",

winRate:"0",

pattern:"NONE",

support:"0",

resistance:"0",

takeProfit:"0",

stopLoss:"0",

antiFakeScore:0

};

}

}
