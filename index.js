require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();

const PORT = process.env.PORT || 8080;

console.log("🔥 SNIPER AI V37 STARTING...");
console.log("📡 PORT:", PORT);

app.use(express.json());
app.use(express.static("public"));

/* ================= HEALTH ================= */
app.get("/health", (req,res)=>{
res.json({
status:"OK",
server:"SNIPER AI V37",
time: new Date().toISOString()
});
});

/* ================= CLEAN SYMBOL ================= */
function cleanSymbol(symbol){
if(!symbol) return "EURUSD";
symbol = symbol.toUpperCase().replace("/","");
return symbol;
}

/* ================= SAFE FALLBACK DATA ================= */
function fallbackData(){
let base = 1000;
let data = [];

for(let i=0;i<60;i++){
base += (Math.random()-0.5)*10;
data.push(base);
}

return data;
}

/* ================= RSI ================= */
function RSI(data){
let gain = 0;
let loss = 0;

for(let i=1;i<14;i++){
let diff = data[i] - data[i-1];
diff > 0 ? gain += diff : loss += Math.abs(diff);
}

let rs = gain / (loss || 1);
return 100 - (100 / (1 + rs));
}

/* ================= EMA ================= */
function EMA(data, period){
let k = 2 / (period + 1);
let ema = data[0];

for(let i=1;i<data.length;i++){
ema = data[i] * k + ema * (1 - k);
}

return ema;
}

/* ================= DATA FETCH (SAFE) ================= */
async function getData(symbol, interval){

try {

if(!process.env.TWELVE_API_KEY){
console.log("⚠️ NO API KEY → fallback mode");
return fallbackData();
}

const map = {
"30s":"1min",
"1m":"1min",
"5m":"5min",
"15m":"5min"
};

const url =
`https://api.twelvedata.com/time_series?symbol=${cleanSymbol(symbol)}&interval=${map[interval] || "1min"}&outputsize=100&apikey=${process.env.TWELVE_API_KEY}`;

const res = await axios.get(url,{timeout:5000});

if(!res.data || res.data.status === "error"){
return fallbackData();
}

if(!res.data.values || res.data.values.length < 20){
return fallbackData();
}

return res.data.values
.reverse()
.map(c => Number(c.close))
.filter(v => !isNaN(v));

} catch(err){
console.log("API ERROR → fallback used:", err.message);
return fallbackData();
}

}

/* ================= API ANALYZE ================= */
app.get("/api/analyze/:symbol/:interval", async (req,res)=>{

try{

const symbol = cleanSymbol(req.params.symbol);
const interval = req.params.interval;

const data = await getData(symbol, interval);

const price = data.at(-1);

const rsi = RSI(data);
const emaFast = EMA(data.slice(-30), 9);
const emaSlow = EMA(data.slice(-30), 21);

/* TREND */
let trend =
emaFast > emaSlow ? "BULLISH" :
emaFast < emaSlow ? "BEARISH" : "SIDEWAYS";

/* SCORE */
let score = 0;

if(emaFast > emaSlow) score += 30;
if(emaFast < emaSlow) score -= 30;

if(rsi < 30) score += 25;
if(rsi > 70) score -= 25;

let momentum = price - data.at(-3);
if(momentum > 0) score += 10;
if(momentum < 0) score -= 10;

/* SIGNAL */
let signal = "WAIT";

if(score >= 55) signal = "BUY";
if(score <= -55) signal = "SELL";

if(Math.abs(score) < 20){
signal =
trend === "BULLISH" ? "BUY" :
trend === "BEARISH" ? "SELL" : "WAIT";
}

/* PROBABILITY */
let probability = Math.min(95, Math.abs(score) + 40);

/* RESPONSE */
res.json({
symbol,
interval,
price: Number(price.toFixed(2)),
rsi: Number(rsi.toFixed(2)),
trend,
score: Number(score.toFixed(2)),
signal,
strength: Math.min(100, Math.abs(score)),
probability
});

}catch(err){

console.log("SERVER ERROR:", err.message);

res.json({
symbol:"ERROR",
interval:"ERROR",
price:0,
rsi:50,
trend:"ERROR",
score:0,
signal:"WAIT",
strength:0,
probability:0
});

}

});

/* ================= START ================= */
app.listen(PORT, ()=>{
console.log("🚀 SNIPER AI V37 RUNNING ON", PORT);
});
