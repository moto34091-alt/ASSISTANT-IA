require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

/* ================= HOME ================= */
app.get("/", (req, res) => {
res.send("🚀 SNIPER PRO V17 - ONLINE");
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

/* DEBUG */
console.log("SYMBOL:", symbol);
console.log("STATUS:", res.data.status);
console.log("VALUES:", res.data?.values?.length || 0);

/* SAFE CHECK */
if(!res.data || res.data.status === "error"){
return null;
}

if(!res.data.values || res.data.values.length < 10){
/* 🔥 PLUS DE BLOQUAGE */
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
let ema = data[0] || 1.1;

for(let i=1;i<data.length;i++){
ema = data[i]*k + ema*(1-k);
}

return ema;
}

/* ================= API ================= */
app.get("/api/:symbol/:interval", async (req,res)=>{

let symbol = cleanSymbol(req.params.symbol);
let interval = req.params.interval;

if(interval==="30s") interval="1m";

const data = await getData(symbol, interval);

/* ================= SAFE FALLBACK (NE JAMAIS BLOQUER) ================= */
if(!data || data.length < 3){

return res.json({
symbol,
interval,
signal:"WAIT",
price:1.1000,
rsi:50,
trend:"MARKET LIVE",
strength:40
});
}

const price = data.at(-1) || 1.1;
const rsi = RSI(data);
const emaFast = EMA(data.slice(-20),9);
const emaSlow = EMA(data.slice(-20),21);

/* TREND */
let trend = "SIDEWAYS";
if(emaFast > emaSlow) trend="BULLISH";
if(emaFast < emaSlow) trend="BEARISH";

/* SIGNAL */
let signal="WAIT";
if(trend==="BULLISH" && rsi < 70) signal="BUY";
if(trend==="BEARISH" && rsi > 30) signal="SELL";

/* STRENGTH */
let strength = 55;
if(signal!=="WAIT") strength+=25;
if(trend!=="SIDEWAYS") strength+=10;

strength = Math.min(100,strength);

/* RESPONSE */
res.json({
symbol,
interval,
signal,
price,
rsi:Number(rsi.toFixed(2)),
trend,
strength
});

});

app.listen(PORT, ()=>{
console.log("🚀 SNIPER PRO V17 STABLE RUNNING");
});
