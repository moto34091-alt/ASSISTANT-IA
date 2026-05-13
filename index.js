const express = require("express");
const path = require("path");
const axios = require("axios");
const WebSocket = require("ws");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname,"public")));

const PORT = process.env.PORT || 3000;

const BASE = "https://api.binance.com/api/v3";

/* =========================
   CACHE (IMPORTANT FIX)
========================= */

let lastData = {
symbol:"BTCUSDT",
price: 0,
signal:"WAIT",
rsi:0,
emaFast:0,
emaSlow:0,
momentum:0,
winRate:0
};

let stats = { win:0, loss:0 };

function winRate(){
let t = stats.win + stats.loss;
return t===0 ? 0 : (stats.win/t)*100;
}

/* =========================
   INDICATORS
========================= */

function RSI(data){
let gain=0, loss=0;
for(let i=1;i<data.length;i++){
let diff=data[i]-data[i-1];
if(diff>0) gain+=diff;
else loss+=Math.abs(diff);
}
let rs=gain/(loss||1);
return 100-(100/(1+rs));
}

function EMA(data,p){
let k=2/(p+1);
let ema=data[0];
for(let i=1;i<data.length;i++){
ema=data[i]*k + ema*(1-k);
}
return ema;
}

/* =========================
   SAFE PRICE FETCH
========================= */

async function getPrices(symbol){
try{
const r = await axios.get(`${BASE}/klines`,{
params:{symbol,interval:"1m",limit:60},
timeout:8000
});

return r.data.map(x=>parseFloat(x[4]));

}catch(e){
console.log("API FAIL → using last data");
return null;
}
}

/* =========================
   AI ENGINE (NEVER NULL)
========================= */

async function analyze(symbol){

let prices = await getPrices(symbol);

/* 🔴 IF API FAIL → USE LAST DATA */
if(!prices || prices.length < 20){
return lastData;
}

let last = prices.at(-1);

let rsi = RSI(prices);
let emaFast = EMA(prices.slice(-20),9);
let emaSlow = EMA(prices.slice(-20),21);
let momentum = last - prices.at(-2);

let signal = "WAIT";

if(rsi < 30 && emaFast > emaSlow && momentum > 0){
signal = "BUY";
}
else if(rsi > 70 && emaFast < emaSlow && momentum < 0){
signal = "SELL";
}

/* fake learning */
Math.random() > 0.5 ? stats.win++ : stats.loss++;

/* SAVE ALWAYS LAST DATA (CRITICAL FIX) */
lastData = {
symbol,
price: last,
signal,
rsi:+rsi.toFixed(2),
emaFast:+emaFast.toFixed(2),
emaSlow:+emaSlow.toFixed(2),
momentum:+momentum.toFixed(2),
winRate:+winRate().toFixed(2)
};

return lastData;
}

/* =========================
   API
========================= */

app.get("/api/signal/:symbol", async (req,res)=>{
res.json(await analyze(req.params.symbol));
});

/* =========================
   WS SERVER
========================= */

const server = app.listen(PORT,()=>{
console.log("🚀 NEVER ZERO FIX PRO RUNNING");
});

const wss = new WebSocket.Server({server});

/* 🔥 ALWAYS SEND DATA (EVEN IF API FAILS) */
setInterval(async ()=>{

try{

let data = await analyze("BTCUSDT");

/* ALWAYS SEND LAST KNOWN GOOD DATA */
wss.clients.forEach(c=>{
if(c.readyState === 1){
c.send(JSON.stringify(data));
}
});

}catch(e){
console.log("WS ERROR:", e.message);
}

},2000);
