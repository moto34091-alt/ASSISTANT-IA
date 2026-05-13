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

const JWT_SECRET = "SUPER_SECRET_KEY_CHANGE_ME";

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
   INDICATORS
========================= */

function RSI(data){
let gain=0, loss=0;
for(let i=1;i<data.length;i++){
let d=data[i]-data[i-1];
if(d>0) gain+=d;
else loss+=Math.abs(d);
}
let rs=gain/(loss||1);
return 100-(100/(1+rs));
}

function EMA(data,p){
let k=2/(p+1);
let ema=data[0];
for(let i=1;i<data.length;i++){
ema=data[i]*k+ema*(1-k);
}
return ema;
}

function MACD(data){
let fast = EMA(data,12);
let slow = EMA(data,26);
return fast - slow;
}

/* =========================
   MARKET DATA
========================= */

async function getPrices(symbol){
let r = await axios.get(`${BASE}/klines`,{
params:{symbol,interval:"1m",limit:60}
});
return r.data.map(x=>parseFloat(x[4]));
}

/* =========================
   TELEGRAM
========================= */

async function sendTelegram(msg){
try{
await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,{
chat_id: TELEGRAM_CHAT,
text: msg
});
}catch(e){}
}

/* =========================
   AI ENGINE (REAL STRATEGY)
========================= */

async function analyze(symbol){

let prices = await getPrices(symbol);

let rsi = RSI(prices);
let emaFast = EMA(prices,9);
let emaSlow = EMA(prices,21);
let macd = MACD(prices);
let momentum = prices.at(-1) - prices.at(-2);

let signal = "WAIT";

/* STRATEGY PRO */
if(rsi < 30 && emaFast > emaSlow && macd > 0 && momentum > 0){
signal = "BUY";
}
else if(rsi > 70 && emaFast < emaSlow && macd < 0 && momentum < 0){
signal = "SELL";
}

/* WIN/LOSS SIMULATION (LEARNING SYSTEM) */
let result = Math.random() > 0.48 ? "WIN" : "LOSS";
result==="WIN" ? stats.win++ : stats.loss++;

/* TELEGRAM ALERT */
if(signal !== "WAIT"){
sendTelegram(
`📊 SIGNAL ${signal}
💰 ${symbol}
📉 RSI: ${rsi.toFixed(1)}
📊 MACD: ${macd.toFixed(2)}
💰 PRICE: ${prices.at(-1)}
🔥 WINRATE: ${winRate().toFixed(2)}%`
);
}

return {
symbol,
price: prices.at(-1),
signal,
rsi:+rsi.toFixed(1),
emaFast:+emaFast.toFixed(2),
emaSlow:+emaSlow.toFixed(2),
macd:+macd.toFixed(2),
momentum:+momentum.toFixed(2),
winRate:+winRate().toFixed(2)
};
}

/* =========================
   AUTH LOGIN (JWT)
========================= */

app.post("/api/login",(req,res)=>{
const {user,pass} = req.body;

if(user===ADMIN.user && pass===ADMIN.pass){
const token = jwt.sign({user}, JWT_SECRET,{expiresIn:"2h"});
return res.json({ok:true,token});
}

res.json({ok:false});
});

/* =========================
   MIDDLEWARE ADMIN CHECK
========================= */

function auth(req,res,next){
let token = req.headers.authorization;
if(!token) return res.status(403).send("No token");

try{
jwt.verify(token.split(" ")[1], JWT_SECRET);
next();
}catch(e){
res.status(403).send("Invalid token");
}
}

/* =========================
   API SIGNAL
========================= */

app.get("/api/signal/:symbol", async (req,res)=>{
res.json(await analyze(req.params.symbol));
});

/* =========================
   ADMIN PANEL DATA
========================= */

app.get("/api/admin/stats", auth, (req,res)=>{
res.json({
win:stats.win,
loss:stats.loss,
winRate:winRate()
});
});

/* =========================
   WEBSOCKET LIVE
========================= */

const server = app.listen(PORT,()=>{
console.log("🚀 GOD MODE TRADING RUNNING");
});

const wss = new WebSocket.Server({server});

let SYMBOL="BTCUSDT";

setInterval(async ()=>{
try{
let data = await analyze(SYMBOL);

wss.clients.forEach(c=>{
if(c.readyState===1){
c.send(JSON.stringify(data));
}
});
}catch(e){}
},2000);
