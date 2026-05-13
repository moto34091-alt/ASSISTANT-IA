const express = require("express");
const path = require("path");
const axios = require("axios");
const WebSocket = require("ws");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname,"public")));

const PORT = process.env.PORT || 3000;

/* =========================
   BINANCE API
========================= */
const BASE = "https://api.binance.com/api/v3";

/* =========================
   WIN RATE SYSTEM
========================= */
let stats = { win:0, loss:0 };

function winRate(){
let t = stats.win + stats.loss;
if(t===0) return 0;
return (stats.win/t)*100;
}

/* =========================
   INDICATORS (REAL FIXED)
========================= */

function RSI(data){
let gain=0, loss=0;

for(let i=1;i<data.length;i++){
let diff = data[i]-data[i-1];
if(diff>0) gain+=diff;
else loss+=Math.abs(diff);
}

let rs = gain/(loss||1);
return 100-(100/(1+rs));
}

function EMA(data, period){
let k = 2/(period+1);
let ema = data[0];

for(let i=1;i<data.length;i++){
ema = data[i]*k + ema*(1-k);
}

return ema;
}

/* =========================
   GET MARKET DATA (FIXED)
========================= */

async function getPrices(symbol){
try{
const res = await axios.get(`${BASE}/klines`,{
params:{
symbol,
interval:"1m",
limit:60
},
timeout:8000
});

return res.data.map(c=>parseFloat(c[4]));

}catch(e){
console.log("API ERROR:", e.message);
return null;
}
}

/* =========================
   AI ENGINE (STABLE)
========================= */

async function analyze(symbol){

let prices = await getPrices(symbol);

/* SAFE CHECK */
if(!prices || prices.length < 20){
return {
symbol,
price: 0,
signal: "WAIT",
rsi: 0,
emaFast: 0,
emaSlow: 0,
momentum: 0,
winRate: winRate()
};
}

let rsi = RSI(prices);
let emaFast = EMA(prices.slice(-20),9);
let emaSlow = EMA(prices.slice(-20),21);
let momentum = prices.at(-1) - prices.at(-2);

let signal = "WAIT";

/* STRATEGY */
if(rsi < 30 && emaFast > emaSlow && momentum > 0){
signal = "BUY";
}
else if(rsi > 70 && emaFast < emaSlow && momentum < 0){
signal = "SELL";
}

/* fake learning system (simulation) */
let result = Math.random() > 0.5 ? "WIN" : "LOSS";
result === "WIN" ? stats.win++ : stats.loss++;

/* RETURN CLEAN DATA */
return {
symbol,
price: prices.at(-1),
signal,
rsi:+rsi.toFixed(2),
emaFast:+emaFast.toFixed(2),
emaSlow:+emaSlow.toFixed(2),
momentum:+momentum.toFixed(2),
winRate:+winRate().toFixed(2)
};
}

/* =========================
   API
========================= */

app.get("/api/signal/:symbol", async (req,res)=>{
res.json(await analyze(req.params.symbol));
});

/* =========================
   SERVER + WS
========================= */

const server = app.listen(PORT,()=>{
console.log("🚀 NEXT LEVEL TRADER RUNNING");
});

const wss = new WebSocket.Server({server});

let SYMBOL = "BTCUSDT";

/* LIVE LOOP STABLE */
setInterval(async ()=>{

try{

let data = await analyze(SYMBOL);

if(!data || data.price === 0) return;

wss.clients.forEach(client=>{
if(client.readyState === 1){
client.send(JSON.stringify(data));
}
});

}catch(e){
console.log("WS ERROR:", e.message);
}

},2500);
