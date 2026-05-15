require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();

/* ================= PORT ================= */
const PORT = process.env.PORT || 3000;

/* ================= MIDDLEWARE ================= */
app.use(express.json());
app.use(express.static("public"));

/* ================= HOME (FIX SCREEN WHITE) ================= */
app.get("/", (req, res) => {
res.send(`
<!DOCTYPE html>
<html>
<head>
<title>SNIPER PRO V30</title>

<style>
body{
margin:0;
background:#050816;
color:white;
font-family:Arial;
display:flex;
justify-content:center;
align-items:center;
height:100vh;
}

.card{
background:#0c1224;
padding:30px;
border-radius:20px;
border:1px solid #00ff9d;
text-align:center;
box-shadow:0 0 20px #00ff9d33;
animation: glow 2s infinite alternate;
}

h1{
color:#00ff9d;
margin-bottom:10px;
}

p{
color:#aaa;
}

button{
margin-top:20px;
padding:12px 18px;
border:none;
border-radius:10px;
background:#00ff9d;
color:black;
font-weight:bold;
cursor:pointer;
transition:0.3s;
}

button:hover{
transform:scale(1.05);
box-shadow:0 0 15px #00ff9d;
}

@keyframes glow{
from{box-shadow:0 0 10px #00ff9d33;}
to{box-shadow:0 0 25px #00ff9d;}
}
</style>

</head>

<body>

<div class="card">
<h1>🚀 SNIPER PRO V30</h1>
<p>SMART ENGINE LIVE ACTIVE</p>

<button onclick="window.location.href='/api/BTCUSD/1m'">
📊 TEST SIGNAL API
</button>

</div>

</body>
</html>
`);
});

/* ================= CLEAN SYMBOL ================= */
function cleanSymbol(symbol){

if(!symbol) return "EUR/USD";

symbol = symbol.toUpperCase().trim();

if(symbol.includes("/")) return symbol;

return symbol.slice(0,3) + "/" + symbol.slice(3);

}

/* ================= DATA FETCH ================= */
async function getData(symbol, interval){

try {

symbol = cleanSymbol(symbol);

const map = {
"30s":"1min",
"1m":"1min",
"5m":"5min",
"15m":"5min"
};

const url =
`https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${map[interval] || "1min"}&outputsize=100&apikey=${process.env.TWELVE_API_KEY}`;

const res = await axios.get(url);

if(!res.data || res.data.status === "error") return null;
if(!res.data.values || res.data.values.length < 20) return null;

return res.data.values
.reverse()
.map(c => Number(c.close))
.filter(v => !isNaN(v));

} catch(err){
console.log("API ERROR:", err.message);
return null;
}

}

/* ================= RSI ================= */
function RSI(data){

if(!data || data.length < 14) return 50;

let gain = 0;
let loss = 0;

for(let i=1;i<14;i++){

const diff = data[i] - data[i-1];

if(diff > 0) gain += diff;
else loss += Math.abs(diff);

}

const rs = gain / (loss || 1);

return Number((100 - (100 / (1 + rs))).toFixed(2));

}

/* ================= EMA ================= */
function EMA(data, period){

if(!data || data.length < period)
return data.at(-1) || 0;

const k = 2 / (period + 1);

let ema = data[0] || 0;

for(let i=1;i<data.length;i++){
ema = data[i] * k + ema * (1 - k);
}

return ema;

}

/* ================= API ================= */
app.get("/api/:symbol/:interval", async (req,res)=>{

try {

const symbol = cleanSymbol(req.params.symbol);
const interval = req.params.interval;

const data = await getData(symbol, interval);

if(!data || data.length < 20){

return res.json({
symbol,
interval,
signal:"WAIT",
price:0,
rsi:50,
trend:"NO DATA",
score:0,
strength:0,
BOS:{bullish:false,bearish:false},
CHoCH:{bullish:false,bearish:false},
support:0,
resistance:0,
liquidity:{buySweep:false,sellSweep:false}
});

}

const price = data.at(-1) || 0;

const rsi = RSI(data);
const emaFast = EMA(data.slice(-30), 9);
const emaSlow = EMA(data.slice(-30), 21);

const trend =
emaFast > emaSlow ? "BULLISH" :
emaFast < emaSlow ? "BEARISH" : "SIDEWAYS";

const recentHigh = Math.max(...data.slice(-10));
const recentLow = Math.min(...data.slice(-10));
const prevHigh = Math.max(...data.slice(-20,-10));
const prevLow = Math.min(...data.slice(-20,-10));

const BOS = {
bullish: recentHigh > prevHigh,
bearish: recentLow < prevLow
};

const CHoCH = {
bullish: trend === "BULLISH" && BOS.bullish,
bearish: trend === "BEARISH" && BOS.bearish
};

const support = Math.min(...data.slice(-30));
const resistance = Math.max(...data.slice(-30));

const liquidity = {
buySweep: price < support,
sellSweep: price > resistance
};

let score = 0;

if (emaFast > emaSlow) score += 30;
if (emaFast < emaSlow) score -= 30;

if (rsi < 30) score += 25;
if (rsi > 70) score -= 25;

if (BOS.bullish) score += 20;
if (BOS.bearish) score -= 20;

if (CHoCH.bullish) score += 30;
if (CHoCH.bearish) score -= 30;

if (liquidity.buySweep) score += 20;
if (liquidity.sellSweep) score -= 20;

const momentum = price - (data.at(data.length - 3) || price);
if (momentum > 0) score += 10;
if (momentum < 0) score -= 10;

let signal = "WAIT";

if (score >= 55) signal = "BUY";
if (score <= -55) signal = "SELL";

if (Math.abs(score) < 20){
signal =
trend === "BULLISH"
? "BUY"
: trend === "BEARISH"
? "SELL"
: "WAIT";
}

res.json({
symbol,
interval,
signal,
price,
rsi,
trend,
score,
strength: Math.min(100, Math.abs(score)),
BOS,
CHoCH,
support,
resistance,
liquidity
});

} catch(err){

console.log("SERVER ERROR:", err.message);

res.json({
signal:"WAIT",
price:0,
rsi:50,
trend:"ERROR",
score:0,
strength:0,
BOS:{bullish:false,bearish:false},
CHoCH:{bullish:false,bearish:false},
support:0,
resistance:0,
liquidity:{buySweep:false,sellSweep:false}
});

}

});

/* ================= START ================= */
app.listen(PORT, () => {
console.log("🚀 SNIPER PRO V30 RUNNING ON PORT", PORT);
});
