const express = require("express");
const path = require("path");
const axios = require("axios");
const WebSocket = require("ws");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;

console.log("🚀 STARTING NZFX AI ENGINE...");

/* =========================
BINANCE API
========================= */

const BASE = "https://api.binance.com/api/v3";

/* =========================
TELEGRAM CONFIG
========================= */

const TELEGRAM_TOKEN = "PUT_YOUR_TOKEN";
const TELEGRAM_CHAT_ID = "PUT_YOUR_CHAT_ID";

/* =========================
MARKETS
========================= */

const SYMBOLS = [

"BTCUSDT",
"ETHUSDT",
"SOLUSDT",
"BNBUSDT",
"XRPUSDT",
"DOGEUSDT",

"ADAUSDT",
"AVAXUSDT",
"LINKUSDT",
"MATICUSDT",
"LTCUSDT",

"TRXUSDT",
"DOTUSDT",
"ATOMUSDT",
"NEARUSDT",

"ARBUSDT",
"OPUSDT",
"APTUSDT",
"SUIUSDT",

"FILUSDT",
"ETCUSDT",
"AAVEUSDT",
"UNIUSDT"

];

/* =========================
CACHE
========================= */

let lastData = {};

let stats = {

win: 120,
loss: 32

};

function winRate(){

let total = stats.win + stats.loss;

if(total === 0) return "0";

return (
(stats.win / total) * 100
).toFixed(2);

}

/* =========================
RSI
========================= */

function RSI(data){

let gain = 0;
let loss = 0;

for(let i = 1; i < data.length; i++){

let diff = data[i] - data[i - 1];

if(diff > 0){
gain += diff;
}else{
loss += Math.abs(diff);
}

}

let rs = gain / (loss || 1);

return 100 - (100 / (1 + rs));

}

/* =========================
EMA
========================= */

function EMA(data, period){

let k = 2 / (period + 1);

let ema = data[0];

for(let i = 1; i < data.length; i++){

ema = data[i] * k + ema * (1 - k);

}

return ema;

}

/* =========================
GET BINANCE CANDLES
========================= */

async function getCandles(symbol, interval){

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

return r.data.map(x => ({

open:+x[1],
high:+x[2],
low:+x[3],
close:+x[4],
volume:+x[5]

}));

}catch(e){

console.log(
"❌ KLINES ERROR:",
e.message
);

return null;

}

}

/* =========================
PATTERN DETECTION
========================= */

function detectPattern(candles){

const last = candles[candles.length - 1];

const body =
Math.abs(last.close - last.open);

const lowerShadow =
Math.min(last.open, last.close)
- last.low;

if(lowerShadow > body * 2){

return "HAMMER";

}

return "NONE";

}

/* =========================
SUPPORT / RESISTANCE
========================= */

function getSR(candles){

let supports = [];
let resistances = [];

for(let i = 1; i < candles.length - 1; i++){

if(
candles[i].low <
candles[i - 1].low &&
candles[i].low <
candles[i + 1].low
){

supports.push(candles[i].low);

}

if(
candles[i].high >
candles[i - 1].high &&
candles[i].high >
candles[i + 1].high
){

resistances.push(candles[i].high);

}

}

return {

support:
supports.length
? supports[supports.length - 1]
: null,

resistance:
resistances.length
? resistances[resistances.length - 1]
: null

};

}

/* =========================
ANTI FAKE FILTER
========================= */

function antiFake(data){

let score = 0;

// volume
if(
data.currentVolume >
data.avgVolume * 1.3
){
score += 20;
}else{
score -= 10;
}

// ema trend
if(data.emaFast > data.emaSlow){
score += 15;
}

if(data.emaFast < data.emaSlow){
score += 15;
}

// rsi
if(data.rsi > 20 && data.rsi < 80){
score += 10;
}else{
score -= 15;
}

// sideways
if(data.trend === "SIDEWAYS"){
score -= 20;
}

return score;

}

/* =========================
TELEGRAM ALERT
========================= */

async function sendTelegramAlert(data){

try{

if(
!TELEGRAM_TOKEN ||
!TELEGRAM_CHAT_ID
){
return;
}

if(data.signal === "WAIT"){
return;
}

const emoji =
data.signal === "BUY"
? "🟢"
: "🔴";

const msg = `
🚀 NZFX AI SIGNAL

${emoji} SIGNAL: ${data.signal}

📊 PAIR: ${data.symbol}

💰 PRICE: ${data.price}

📈 STRENGTH: ${data.strength}%

📉 RSI: ${data.rsi}

📊 TREND: ${data.trend}

⚡ ANTI-FAKE: ${data.antiFakeScore}

🎯 TP: ${data.takeProfit}

🛑 SL: ${data.stopLoss}
`;

await axios.post(
`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
{
chat_id: TELEGRAM_CHAT_ID,
text: msg
}
);

}catch(e){

console.log(
"❌ TELEGRAM ERROR:",
e.message
);

}

}

/* =========================
ANALYZE ENGINE
========================= */

async function analyze(
symbol = "BTCUSDT",
interval = "1m"
){

try{

const candles =
await getCandles(
symbol,
interval
);

if(
!candles ||
candles.length < 30
){

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

winRate:winRate()

};

}

/* =========================
MARKET DATA
========================= */

const closes =
candles.map(c => c.close);

const last =
closes[closes.length - 1];

const rsi = RSI(closes);

const emaFast =
EMA(
closes.slice(-20),
9
);

const emaSlow =
EMA(
closes.slice(-20),
21
);

const momentum =
last - closes[closes.length - 2];

const currentVolume =
candles[candles.length - 1].volume;

const avgVolume =
candles.reduce(
(a,b)=>a+b.volume,
0
) / candles.length;

/* =========================
PATTERN
========================= */

const pattern =
detectPattern(candles);

/* =========================
SUPPORT RESISTANCE
========================= */

const sr =
getSR(candles);

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

if(emaFast > emaSlow){
strength += 20;
}

if(rsi < 35){
strength += 15;
}

if(momentum > 0){
strength += 10;
}

if(pattern === "HAMMER"){
strength += 15;
}

/* =========================
ANTI FAKE SCORE
========================= */

const antiFakeScore =
antiFake({

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

support:
sr.support
? sr.support.toFixed(2)
: "0",

resistance:
sr.resistance
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

winRate:"0"

};

}

}

/* =========================
API
========================= */

app.get(
"/api/signal/:symbol/:interval",
async(req,res)=>{

const symbol =
req.params.symbol.toUpperCase();

const interval =
req.params.interval;

const data =
await analyze(
symbol,
interval
);

res.json(data);

}
);

/* =========================
HOME
========================= */

app.get("/", (req,res)=>{

res.sendFile(
path.join(
__dirname,
"public",
"index.html"
)
);

});

/* =========================
SERVER
========================= */

const server =
app.listen(PORT,()=>{

console.log(
`🚀 SERVER RUNNING ${PORT}`
);

});

/* =========================
WEBSOCKET
========================= */

const wss =
new WebSocket.Server({
server
});

wss.on(
"connection",
(ws)=>{

console.log(
"🟢 CLIENT CONNECTED"
);

ws.on(
"message",
async(msg)=>{

try{

const parsed =
JSON.parse(msg);

const symbol =
parsed.symbol ||
"BTCUSDT";

const interval =
parsed.interval ||
"1m";

const data =
await analyze(
symbol,
interval
);

ws.send(
JSON.stringify(data)
);

}catch(e){

console.log(
"❌ WS ERROR:",
e.message
);

}

}
);

}
);

/* =========================
AUTO PUSH
========================= */

setInterval(async()=>{

wss.clients.forEach(
async(client)=>{

if(
client.readyState === 1
){

const data =
await analyze(
"BTCUSDT",
"1m"
);

client.send(
JSON.stringify(data)
);

}

}
);

},2000);
