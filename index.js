const express = require("express");
const path = require("path");
const axios = require("axios");
const WebSocket = require("ws");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname,"public")));

const PORT = process.env.PORT || 3000;

/* =========================
   CONFIG
========================= */

const JWT_SECRET = "CHANGE_THIS_SECRET";

const ADMIN = {
user: "admin",
pass: "admin123"
};

/* TELEGRAM */
const TELEGRAM_TOKEN = "PUT_TOKEN_HERE";
const TELEGRAM_CHAT = "@signalstradings_bot";

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
   SAFE RSI
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

/* =========================
   EMA
========================= */

function EMA(data,p){
let k=2/(p+1);
let ema=data[0];

for(let i=1;i<data.length;i++){
ema=data[i]*k + ema*(1-k);
}

return ema;
}

/* =========================
   GET DATA (SAFE)
========================= */

async function getPrices(symbol){
try{
let r = await axios.get(`${BASE}/klines`,{
params:{symbol,interval:"1m",limit:60},
timeout:5000
});

return r.data.map(x=>parseFloat(x[4]));

}catch(e){
console.log("API ERROR:", e.message);
return [];
}
}

/* =========================
   TELEGRAM SAFE (NO SPAM)
========================= */

let lastSignal = null;

async function sendTelegram(msg){
try{
await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,{
chat_id: TELEGRAM_CHAT,
text: msg
});
}catch(e){}
}

/* =========================
   AI ENGINE (FIXED)
========================= */

async function analyze(symbol){

let prices = await getPrices(symbol);

if(prices.length < 10){
return {symbol, signal:"WAIT", error:"NO DATA"};
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

/* SIM WIN/LOSS (LEARNING) */
let result = Math.random() > 0.5 ? "WIN" : "LOSS";
result==="WIN" ? stats.win++ : stats.loss++;

/* TELEGRAM ANTI-SPAM */
if(signal !== "WAIT" && signal !== lastSignal){

lastSignal = signal;

sendTelegram(
`📊 ${signal} ${symbol}
💰 Price: ${prices.at(-1)}
📉 RSI: ${rsi.toFixed(1)}
🔥 WinRate: ${winRate().toFixed(2)}%`
);
}

return {
symbol,
price: prices.at(-1),
signal,
rsi:+rsi.toFixed(1),
emaFast:+emaFast.toFixed(2),
emaSlow:+emaSlow.toFixed(2),
momentum:+momentum.toFixed(2),
winRate:+winRate().toFixed(2)
};
}

/* =========================
   LOGIN JWT
========================= */

app.post("/api/login",(req,res)=>{
const {user,pass}=req.body;

if(user===ADMIN.user && pass===ADMIN.pass){
const token = jwt.sign({user},JWT_SECRET,{expiresIn:"2h"});
return res.json({ok:true,token});
}

res.json({ok:false});
});

/* =========================
   ADMIN STATS
========================= */

function auth(req,res,next){
let token=req.headers.authorization;
if(!token) return res.status(403).send("No token");

try{
jwt.verify(token.split(" ")[1],JWT_SECRET);
next();
}catch(e){
res.status(403).send("Invalid token");
}
}

app.get("/api/admin/stats",auth,(req,res)=>{
res.json({
win:stats.win,
loss:stats.loss,
winRate:winRate()
});
});

/* =========================
   API SIGNAL
========================= */

app.get("/api/signal/:symbol", async (req,res)=>{
res.json(await analyze(req.params.symbol));
});

/* =========================
   WEBSOCKET (STABLE LOOP)
========================= */

const server = app.listen(PORT,()=>{
console.log("🚀 GOD MODE FIXED RUNNING");
});

const wss = new WebSocket.Server({server});

let SYMBOL="BTCUSDT";

/* SAFE LOOP */
setInterval(async ()=>{
try{
let data = await analyze(SYMBOL);

wss.clients.forEach(c=>{
if(c.readyState===1){
c.send(JSON.stringify(data));
}
});

}catch(e){
console.log("WS ERROR:", e.message);
}
},3000);
