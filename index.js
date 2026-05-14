require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

/* ================= HOME ================= */
app.get("/", (req, res) => {
res.send("🚀 SNIPER PRO V22 - SMART MONEY AI ENGINE");
});

/* ================= SYMBOL CLEAN ================= */
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

if(!res.data || res.data.status === "error") return null;
if(!res.data.values || res.data.values.length < 20) return null;

return res.data.values.reverse().map(c => Number(c.close));

} catch(err){
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
const k = 2/(period+1);
let ema = data[0];

for(let i=1;i<data.length;i++){
ema = data[i]*k + ema*(1-k);
}

return ema;
}

/* ================= SMART MONEY LEVELS ================= */
function supportResistance(data){

const min = Math.min(...data.slice(-50));
const max = Math.max(...data.slice(-50));

return { support:min, resistance:max };
}

/* ================= LIQUIDITY SWEEP ================= */
function liquiditySweep(data){

const last = data.at(-1);
const prevHigh = Math.max(...data.slice(-10));
const prevLow = Math.min(...data.slice(-10));

return {
buySweep: last < prevLow,
sellSweep: last > prevHigh
};
}

/* ================= ORDER BLOCK (SIMPLIFIED) ================= */
function orderBlock(data){

const last = data.at(-1);
const prev = data.at(-2);

return {
bullishOB: last > prev,
bearishOB: last < prev
};
}

/* ================= SCORE ENGINE V22 ================= */
function scoringEngine(data, rsi, emaFast, emaSlow, sweeps, ob){

let score = 0;

/* TREND */
if(emaFast > emaSlow) score += 40;
if(emaFast < emaSlow) score -= 40;

/* RSI */
if(rsi < 30) score += 25;
if(rsi > 70) score -= 25;
if(rsi > 45 && rsi < 60) score += 10;

/* LIQUIDITY SWEEP */
if(sweeps.buySweep) score += 35;
if(sweeps.sellSweep) score -= 35;

/* ORDER BLOCK */
if(ob.bullishOB) score += 20;
if(ob.bearishOB) score -= 20;

/* MOMENTUM */
const momentum = data.at(-1) - data.at(-5);
if(momentum > 0) score += 15;
if(momentum < 0) score -= 15;

return score;
}

/* ================= API ================= */
app.get("/api/:symbol/:interval", async (req,res)=>{

let symbol = cleanSymbol(req.params.symbol);
let interval = req.params.interval;

if(interval==="30s") interval="1m";

const data = await getData(symbol, interval);

/* FALLBACK */
if(!data){
return res.json({
symbol,
interval,
signal:"WAIT",
price:1.1000,
rsi:50,
trend:"NO DATA",
strength:40,
support:0,
resistance:0
});
}

const price = data.at(-1);
const rsi = RSI(data);
const emaFast = EMA(data.slice(-30),9);
const emaSlow = EMA(data.slice(-30),21);

const trend = emaFast > emaSlow ? "BULLISH" :
emaFast < emaSlow ? "BEARISH" : "SIDEWAYS";

const sr = supportResistance(data);
const sweeps = liquiditySweep(data);
const ob = orderBlock(data);

const score = scoringEngine(data,rsi,emaFast,emaSlow,sweeps,ob);

/* ================= SIGNAL ================= */
let signal = "WAIT";

if(score >= 60) signal = "BUY";
if(score <= -60) signal = "SELL";

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
support:sr.support,
resistance:sr.resistance,
liquiditySweep:sweeps,
orderBlock:ob
});

});

app.listen(PORT, ()=>{
console.log("🚀 SNIPER PRO V22 SMART MONEY AI RUNNING");
});
