require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

/* ================= ROOT ================= */
app.get("/", (req, res) => {
res.send("🚀 SNIPER PRO V20 - SMART STRATEGY ENGINE");
});

/* ================= CLEAN SYMBOL ================= */
function cleanSymbol(symbol){
return symbol.includes("/")
? symbol
: symbol.slice(0,3) + "/" + symbol.slice(3);
}

/* ================= GET MARKET DATA ================= */
async function getData(symbol, interval){

try {

symbol = cleanSymbol(symbol);

const map = {
"30s":"1min",
"1m":"1min",
"5m":"5min",
"15m":"15min"
};

const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${map[interval] || "1min"}&outputsize=200&apikey=${process.env.TWELVE_API_KEY}`;

const res = await axios.get(url);

/* DEBUG */
console.log("SYMBOL:", symbol);
console.log("STATUS:", res.data.status);
console.log("VALUES:", res.data?.values?.length || 0);

/* VALIDATION */
if(!res.data || res.data.status === "error"){
return null;
}

if(!res.data.values || res.data.values.length < 10){
return [];
}

return res.data.values.reverse().map(c => Number(c.close));

} catch(err){
console.log("API ERROR:", err.message);
return [];
}
}

/* ================= RSI ================= */
function RSI(data){
if(!data || data.length < 5) return 50;

let gain=0, loss=0;

for(let i=1;i<Math.min(14,data.length);i++){
const diff = data[i]-data[i-1];
diff>0 ? gain+=diff : loss+=Math.abs(diff);
}

const rs = gain/(loss||1);
return 100 - (100/(1+rs));
}

/* ================= EMA ================= */
function EMA(data, period){
if(!data || data.length===0) return 1.1;

const k = 2/(period+1);
let ema = data[0];

for(let i=1;i<data.length;i++){
ema = data[i]*k + ema*(1-k);
}

return ema;
}

/* ================= STRATEGY ENGINE ================= */
function detectStrategies(data, rsi, emaFast, emaSlow){

let strategies = [];

const last = data.at(-1);
const prev = data[data.length - 5] || last;
const volatility = Math.abs(last - prev);

/* 1️⃣ TREND FOLLOW */
if(emaFast > emaSlow && rsi > 50 && rsi < 70){
strategies.push("TREND_BUY");
}

if(emaFast < emaSlow && rsi < 50 && rsi > 30){
strategies.push("TREND_SELL");
}

/* 2️⃣ PULLBACK */
if(emaFast > emaSlow && rsi < 45){
strategies.push("PULLBACK_BUY");
}

if(emaFast < emaSlow && rsi > 55){
strategies.push("PULLBACK_SELL");
}

/* 3️⃣ BREAKOUT */
if(volatility > 0.0010 && rsi > 60){
strategies.push("BREAKOUT_BUY");
}

if(volatility > 0.0010 && rsi < 40){
strategies.push("BREAKOUT_SELL");
}

/* 4️⃣ REVERSAL ZONE */
if(rsi <= 25) strategies.push("REVERSAL_BUY");
if(rsi >= 75) strategies.push("REVERSAL_SELL");

/* 5️⃣ SMART MONEY FLOW */
if(emaFast > emaSlow && rsi < 60){
strategies.push("SM_BUY_FLOW");
}

if(emaFast < emaSlow && rsi > 40){
strategies.push("SM_SELL_FLOW");
}

/* 6️⃣ RANGE MARKET */
if(Math.abs(emaFast - emaSlow) < 0.0002){
strategies.push("RANGE");
}

/* 7️⃣ STRONG TREND */
if(emaFast > emaSlow && rsi > 60){
strategies.push("STRONG_BULL");
}

if(emaFast < emaSlow && rsi < 40){
strategies.push("STRONG_BEAR");
}

return strategies;
}

/* ================= API ================= */
app.get("/api/:symbol/:interval", async (req,res)=>{

let symbol = cleanSymbol(req.params.symbol);
let interval = req.params.interval;

if(interval==="30s") interval="1m";

const data = await getData(symbol, interval);

/* ================= FALLBACK ================= */
if(!data || data.length < 3){
return res.json({
symbol,
interval,
signal:"WAIT",
price:1.1000,
rsi:50,
trend:"MARKET LIVE",
strength:40,
strategies:[]
});
}

const price = data.at(-1);
const rsi = RSI(data);
const emaFast = EMA(data.slice(-25),9);
const emaSlow = EMA(data.slice(-25),21);

let trend = "SIDEWAYS";
if(emaFast > emaSlow) trend="BULLISH";
if(emaFast < emaSlow) trend="BEARISH";

const strategies = detectStrategies(data,rsi,emaFast,emaSlow);

/* ================= SIGNAL ENGINE ================= */
let signal = "WAIT";

/* PRIORITY SYSTEM */
if(strategies.includes("STRONG_BULL")) signal="BUY";
if(strategies.includes("STRONG_BEAR")) signal="SELL";

if(signal==="WAIT"){
if(strategies.includes("BREAKOUT_BUY")) signal="BUY";
if(strategies.includes("BREAKOUT_SELL")) signal="SELL";
}

if(signal==="WAIT"){
if(strategies.includes("TREND_BUY")) signal="BUY";
if(strategies.includes("TREND_SELL")) signal="SELL";
}

if(signal==="WAIT"){
if(strategies.includes("REVERSAL_BUY")) signal="BUY";
if(strategies.includes("REVERSAL_SELL")) signal="SELL";
}

/* ================= STRENGTH ================= */
let strength = 50;
if(signal!=="WAIT") strength+=30;
if(trend!=="SIDEWAYS") strength+=10;
if(rsi>45 && rsi<70) strength+=10;

strength = Math.min(100,strength);

/* ================= RESPONSE ================= */
res.json({
symbol,
interval,
signal,
price,
rsi:Number(rsi.toFixed(2)),
trend,
strength,
strategies
});

});

app.listen(PORT,()=>{
console.log("🚀 SNIPER PRO V20 FULL ENGINE RUNNING");
});
