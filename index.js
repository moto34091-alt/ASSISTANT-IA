require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

/* ================= HOME ================= */
app.get("/", (req, res) => {
res.send("🚀 SNIPER PRO V28 - STABLE FOREX ENGINE");
});

/* ================= SYMBOL FIX ================= */
function cleanSymbol(symbol){
if(symbol.includes("/")){
return symbol.replace("/", "");
}
return symbol;
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

const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${map[interval] || "1min"}&outputsize=100&apikey=${process.env.TWELVE_API_KEY}`;

const res = await axios.get(url);

/* DEBUG */
console.log("SYMBOL:", symbol);
console.log("STATUS:", res.data?.status);

/* SAFE CHECK */
if(!res.data || res.data.status === "error"){
return null;
}

if(!res.data.values || res.data.values.length < 20){
return null;
}

return res.data.values
.reverse()
.map(c => Number(c.close))
.filter(n => !isNaN(n));

} catch(err){
console.log("API ERROR:", err.message);
return null;
}
}

/* ================= RSI ================= */
function RSI(data){
if(!data || data.length < 14) return 50;

let gain=0, loss=0;

for(let i=1;i<14;i++){
const diff = data[i] - data[i-1];
diff > 0 ? gain += diff : loss += Math.abs(diff);
}

const rs = gain / (loss || 1);
return 100 - (100 / (1 + rs));
}

/* ================= EMA ================= */
function EMA(data, period){
if(!data || data.length < period) return data?.at(-1) || 0;

const k = 2 / (period + 1);
let ema = data[0];

for(let i=1;i<data.length;i++){
ema = data[i] * k + ema * (1 - k);
}

return ema;
}

/* ================= API ================= */
app.get("/api/:symbol/:interval", async (req,res)=>{

try {

let symbol = cleanSymbol(req.params.symbol);
let interval = req.params.interval;

if(interval === "30s") interval = "1m";

const data = await getData(symbol, interval);

/* ================= FALLBACK ANTI CRASH ================= */
if(!data || data.length < 20){
return res.json({
symbol,
interval,
signal:"WAIT",
price:0,
rsi:50,
trend:"NO DATA",
score:0,
BOS:{bullish:false,bearish:false},
CHoCH:{bullish:false,bearish:false},
support:0,
resistance:0,
liquidity:{buySweep:false,sellSweep:false}
});
}

/* ================= VALUES ================= */
const price = data.at(-1);

const rsi = RSI(data);
const emaFast = EMA(data.slice(-30), 9);
const emaSlow = EMA(data.slice(-30), 21);

const trend =
emaFast > emaSlow ? "BULLISH" :
emaFast < emaSlow ? "BEARISH" : "SIDEWAYS";

/* ================= STRUCTURE ================= */
const recentHigh = Math.max(...data.slice(-10));
const recentLow = Math.min(...data.slice(-10));
const prevHigh = Math.max(...data.slice(-20, -10));
const prevLow = Math.min(...data.slice(-20, -10));

const BOS = {
bullish: recentHigh > prevHigh,
bearish: recentLow < prevLow
};

const CHoCH = {
bullish: trend === "BULLISH" && BOS.bullish,
bearish: trend === "BEARISH" && BOS.bearish
};

/* ================= SUPPORT / RESISTANCE ================= */
const support = Math.min(...data.slice(-30));
const resistance = Math.max(...data.slice(-30));

/* ================= LIQUIDITY ================= */
const liquidity = {
buySweep: price < support,
sellSweep: price > resistance
};

/* ================= SCORE ================= */
let score = 0;

if (emaFast > emaSlow) score += 30;
if (emaFast < emaSlow) score -= 30;

if (rsi < 30) score += 25;
if (rsi > 70) score -= 25;

if (BOS.bullish) score += 25;
if (BOS.bearish) score -= 25;

if (CHoCH.bullish) score += 35;
if (CHoCH.bearish) score -= 35;

if (liquidity.buySweep) score += 25;
if (liquidity.sellSweep) score -= 25;

const momentum = price - data.at(Math.max(0, data.length - 3));
if (momentum > 0) score += 10;
if (momentum < 0) score -= 10;

/* ================= SIGNAL ================= */
let signal = "WAIT";

if (score >= 55) signal = "BUY";
if (score <= -55) signal = "SELL";

if (Math.abs(score) < 20) {
signal = trend === "BULLISH" ? "BUY"
: trend === "BEARISH" ? "SELL"
: "WAIT";
}

/* ================= RESPONSE ================= */
res.json({
symbol,
interval,
signal,
price,
rsi,
trend,
score,
BOS,
CHoCH,
support,
resistance,
liquidity
});

} catch (err) {

console.log("SERVER ERROR:", err.message);

res.json({
signal:"WAIT",
price:0,
rsi:50,
trend:"ERROR",
score:0,
BOS:{bullish:false,bearish:false},
CHoCH:{bullish:false,bearish:false},
support:0,
resistance:0,
liquidity:{buySweep:false,sellSweep:false}
});
}

});

app.listen(PORT, ()=>{
console.log("🚀 SNIPER PRO V28 STABLE RUNNING");
});
