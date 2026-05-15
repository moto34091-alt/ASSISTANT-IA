require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();

/* ================= PORT ================= */
const PORT = process.env.PORT || 8080;

console.log("🔥 SNIPER AI V37 STARTING...");
console.log("📡 PORT:", PORT);

/* ================= MIDDLEWARE ================= */
app.use(express.json());
app.use(express.static("public"));

/* ================= HEALTH ================= */
app.get("/health", (req,res)=>{
res.json({
status:"OK",
server:"SNIPER AI V37",
time:new Date()
});
});

/* ================= HOME ================= */
app.get("/", (req,res)=>{
res.send(`
<!DOCTYPE html>
<html>
<head>
<title>SNIPER AI V37</title>
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
box-shadow:0 0 25px #00ff9d33;
}

h1{color:#00ff9d;}
p{color:#aaa;}

button{
margin-top:20px;
padding:12px 18px;
border:none;
border-radius:10px;
background:#00ff9d;
font-weight:bold;
cursor:pointer;
}
</style>
</head>

<body>

<div class="card">
<h1>🚀 SNIPER AI V37</h1>
<p>SMART ENGINE ACTIVE</p>

<button onclick="window.location.href='/health'">
CHECK SERVER
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

return symbol.includes("/")
? symbol
: symbol.slice(0,3)+"/"+symbol.slice(3);
}

/* ================= DATA ================= */
async function getData(symbol, interval){

try{

if(!process.env.TWELVE_API_KEY){
console.log("❌ NO API KEY");
return null;
}

const map={
"30s":"1min",
"1m":"1min",
"5m":"5min",
"15m":"5min"
};

const url = `https://api.twelvedata.com/time_series?symbol=${cleanSymbol(symbol)}&interval=${map[interval] || "1min"}&outputsize=100&apikey=${process.env.TWELVE_API_KEY}`;

const res = await axios.get(url);

if(!res.data || res.data.status==="error") return null;
if(!res.data.values || res.data.values.length<20) return null;

return res.data.values
.reverse()
.map(c=>Number(c.close))
.filter(v=>!isNaN(v));

}catch(err){
console.log("API ERROR:",err.message);
return null;
}
}

/* ================= RSI ================= */
function RSI(data){

if(!data || data.length<14) return 50;

let gain=0, loss=0;

for(let i=1;i<14;i++){
const diff=data[i]-data[i-1];
diff>0 ? gain+=diff : loss+=Math.abs(diff);
}

const rs=gain/(loss||1);

return Number((100-(100/(1+rs))).toFixed(2));
}

/* ================= EMA ================= */
function EMA(data,period){

if(!data || data.length<period)
return data.at(-1)||0;

const k=2/(period+1);

let ema=data[0];

for(let i=1;i<data.length;i++){
ema=data[i]*k+ema*(1-k);
}

return ema;
}

/* ================= API ================= */
app.get("/api/:symbol/:interval", async (req,res)=>{

try{

const symbol=cleanSymbol(req.params.symbol);
const interval=req.params.interval;

const data=await getData(symbol,interval);

if(!data || data.length<20){
return res.json({
signal:"WAIT",
price:0,
rsi:50,
trend:"NO DATA",
score:0,
strength:0
});
}

const price=data.at(-1);
const rsi=RSI(data);
const emaFast=EMA(data.slice(-30),9);
const emaSlow=EMA(data.slice(-30),21);

const trend =
emaFast>emaSlow ? "BULLISH" :
emaFast<emaSlow ? "BEARISH" : "SIDEWAYS";

let score=0;

if(emaFast>emaSlow) score+=30;
if(emaFast<emaSlow) score-=30;

if(rsi<30) score+=25;
if(rsi>70) score-=25;

const momentum = price-(data.at(data.length-3)||price);
if(momentum>0) score+=10;
if(momentum<0) score-=10;

let signal="WAIT";

if(score>=55) signal="BUY";
if(score<=-55) signal="SELL";

if(Math.abs(score)<20){
signal = emaFast>emaSlow ? "BUY"
: emaFast<emaSlow ? "SELL"
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
strength:Math.min(100,Math.abs(score))
});

}catch(err){
console.log("SERVER ERROR:",err.message);
res.json({signal:"WAIT",price:0,strength:0});
}

});

/* ================= START ================= */
app.listen(PORT, ()=>{
console.log("🚀 SNIPER AI V37 RUNNING ON PORT",PORT);
});
