require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

/* ================= ROOT ================= */
app.get("/", (req, res) => {
res.send("🚀 SNIPER PRO V23 - SMART MONEY ENGINE");
});

/* ================= CLEAN SYMBOL ================= */
function cleanSymbol(symbol){
return symbol.includes("/")
? symbol
: symbol.slice(0,3) + "/" + symbol.slice(3);
}

/* ================= FETCH DATA ================= */
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

if(!res.data || res.data.status === "error") return null;
if(!res.data.values || res.data.values.length < 15) return null;

return res.data.values.reverse().map(c => Number(c.close));

} catch(err){
console.log("API ERROR:", err.message);
return null;
}
}

/* ================= RSI ================= */
function RSI(data){
if(!data || data.length < 10) return 50;

let gain=0, loss=0;

for(let i=1;i<14;i++){
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

/* ================= STRUCTURE ENGINE ================= */
function marketStructure(data){

const last = data.at(-1);
const prevHigh = Math.max(...data.slice(-10));
const prevLow = Math.min(...data.slice(-10));

return {
breakHigh: last > prevHigh,
breakLow: last < prevLow
};
}

/* ================= LIQUIDITY ================= */
function liquidity(data){

const last = data.at(-1);
const high = Math.max(...data.slice(-20));
const low = Math.min(...data.slice(-20));

return {
sweepBuy: last < low,
sweepSell: last > high
};
}

/* ================= SMART SCORING V23 ================= */
function scoringEngine(data, rsi, emaFast, emaSlow, liq, structure){

let score = 0;

/* TREND */
if(emaFast > emaSlow) score += 30;
if(emaFast < emaSlow) score -= 30;

/* RSI */
if(rsi < 35) score += 20;
if(rsi > 65) score -= 20;

/* RANGE BOOST (IMPORTANT) */
if(rsi >= 40 && rsi <= 60) score += 10;

/* LIQUIDITY */
if(liq.sweepBuy) score += 35;
if(liq.sweepSell) score -= 35;

/* STRUCTURE BREAK */
if(structure.breakHigh) score += 20;
if(structure.breakLow) score -= 20;

/* MOMENTUM */
const momentum = data.at(-1) - data.at(Math.max(0,data.length-3));
if(momentum > 0) score += 10;
if(momentum < 0) score -= 10;

/* FORCE MODE (ANTI-WAIT) */
if(Math.abs(score) < 25){
score += emaFast > emaSlow ? 8 : -8;
}

return score;
}

/* ================= API ================= */
app.get("/api/:symbol/:interval", async (req,res)=>{

let symbol = cleanSymbol(req.params.symbol);
let interval = req.params.interval;

if(interval==="30s") interval="1m";

const data = await getData(symbol, interval);

/* ================= FALLBACK ================= */
if(!data){
return res.json({
symbol,
interval,
signal:"WAIT",
price:1.1000,
rsi:50,
trend:"NO DATA",
strength:40,
score:0
});
}

const price = data.at(-1);
const rsi = RSI(data);
const emaFast = EMA(data.slice(-30),9);
const emaSlow = EMA(data.slice(-30),21);

const trend =
emaFast > emaSlow ? "BULLISH" :
emaFast < emaSlow ? "BEARISH" : "SIDEWAYS";

const liq = liquidity(data);
const structure = marketStructure(data);

const score = scoringEngine(data,rsi,emaFast,emaSlow,liq,structure);

/* ================= SIGNAL ================= */
let signal = "WAIT";

if(score >= 55) signal = "BUY";
if(score <= -55) signal = "SELL";

/* ================= STRENGTH ================= */
let strength = Math.min(100, Math.abs(score));

/* ================= RESPONSE ================= */
res.json({
symbol,
interval,
signal,
price,
rsi:Number(rsi.toFixed(2)),
trend,
strength,
score,
liquidity:liq,
structure
});

});

app.listen(PORT, ()=>{
console.log("🚀 SNIPER PRO V23 SMART MONEY RUNNING");
});
