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
MARKETS
========================= */

const SYMBOLS = [
"BTCUSDT",
"ETHUSDT",
"SOLUSDT",
"BNBUSDT",
"XRPUSDT",
"DOGEUSDT"
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

return ((stats.win / total) * 100).toFixed(2);

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
GET BINANCE KLINES
========================= */

async function getPrices(symbol, interval){

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

return r.data.map(x => parseFloat(x[4]));

}catch(e){

console.log("KLINES ERROR:", e.message);

return null;

}

}

/* =========================
AI ANALYSIS
========================= */

async function analyze(symbol = "BTCUSDT", interval = "1m"){

try{

const prices = await getPrices(symbol, interval);

if(!prices || prices.length < 30){

return lastData[symbol] || {};

}

let last = prices.at(-1);

let rsi = RSI(prices);

let emaFast = EMA(prices.slice(-20), 9);

let emaSlow = EMA(prices.slice(-20), 21);

let momentum = last - prices.at(-2);

let signal = "WAIT";

let trend = "SIDEWAYS";

let strength = 50;

/* =========================
SIGNAL ENGINE
========================= */

if(
rsi < 35 &&
emaFast > emaSlow &&
momentum > 0
){

signal = "BUY";

strength = 88;

trend = "BULLISH";

}
else if(
rsi > 65 &&
emaFast < emaSlow &&
momentum < 0
){

signal = "SELL";

strength = 90;

trend = "BEARISH";

}

/* =========================
FAKE AI LEARNING
========================= */

Math.random() > 0.4
? stats.win++
: stats.loss++;

const data = {

symbol,

interval,

price: last.toFixed(2),

signal,

rsi: rsi.toFixed(2),

emaFast: emaFast.toFixed(2),

emaSlow: emaSlow.toFixed(2),

momentum: momentum.toFixed(2),

winRate: winRate(),

trend,

strength,

volume: (
Math.random() * 1000
).toFixed(2)

};

lastData[symbol] = data;

return data;

}catch(e){

console.log("ANALYZE ERROR:", e.message);

return {};

}

}

/* =========================
API
========================= */

app.get("/api/signal/:symbol/:interval", async (req,res)=>{

const symbol = req.params.symbol.toUpperCase();

const interval = req.params.interval;

const data = await analyze(symbol, interval);

res.json(data);

});

/* =========================
HOME
========================= */

app.get("/", (req,res)=>{

res.sendFile(
path.join(__dirname,"public","index.html")
);

});

/* =========================
SERVER
========================= */

const server = app.listen(PORT,()=>{

console.log(`🚀 SERVER RUNNING ${PORT}`);

});

/* =========================
WEBSOCKET
========================= */

const wss = new WebSocket.Server({ server });

wss.on("connection",(ws)=>{

console.log("🟢 CLIENT CONNECTED");

ws.on("message", async(msg)=>{

try{

const parsed = JSON.parse(msg);

const symbol = parsed.symbol || "BTCUSDT";

const interval = parsed.interval || "1m";

const data = await analyze(symbol, interval);

ws.send(JSON.stringify(data));

}catch(e){

console.log(e.message);

}

});

});

/* =========================
AUTO PUSH
========================= */

setInterval(async()=>{

wss.clients.forEach(async(client)=>{

if(client.readyState === 1){

const data = await analyze(
"BTCUSDT",
"1m"
);

client.send(JSON.stringify(data));

}

});

},2000);
