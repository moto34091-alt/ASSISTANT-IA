require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

/* ================= HOME ================= */
app.get("/", (req, res) => {
res.send("🚀 SNIPER PRO V15 - ONLINE");
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

const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${map[interval]}&outputsize=200&apikey=${process.env.TWELVE_API_KEY}`;

const res = await axios.get(url);

/* DEBUG */
console.log("SYMBOL:", symbol);
console.log("STATUS:", res.data.status);
console.log("VALUES:", res.data?.values?.length);

/* CHECK */
if(!res.data || res.data.status === "error"){
return null;
}

if(!res.data.values || res.data.values.length < 30){
return null;
}

/* CLEAN */
return res.data.values.reverse().map(c => Number(c.close));

} catch(err){
console.log("API ERROR:", err.message);
return null;
}
}

/* ================= RSI ================= */
function RSI(data){
if(!data || data.length < 14) return 50;

let gain = 0, loss = 0;

for(let i=1;i<14;i++){
const diff = data[i] - data[i-1];
diff > 0 ? gain += diff : loss += Math.abs(diff);
}

const rs = gain / (loss || 1);
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

/* ================= API ================= */
app.get("/api/:symbol/:interval", async (req,res)=>{

let symbol = req.params.symbol;
let interval = req.params.interval;

symbol = cleanSymbol(symbol);

if(interval === "30s") interval = "1m";

const data = await getData(symbol, interval);

/* ================= SAFE FALLBACK ================= */
if(!data){
return res.json({
symbol,
interval,
signal:"WAIT",
price:1.1000,
rsi:50,
trend:"NO DATA (API LIMIT)",
strength:25
});
}

const price = data.at(-1);
const rsi = RSI(data);
const emaFast = EMA(data.slice(-30),9);
const emaSlow = EMA(data.slice(-30),21);

/* TREND */
let trend = "SIDEWAYS";
if(emaFast > emaSlow) trend = "BULLISH";
if(emaFast < emaSlow) trend = "BEARISH";

/* SIGNAL */
let signal = "WAIT";
if(trend==="BULLISH" && rsi < 65) signal="BUY";
if(trend==="BEARISH" && rsi > 35) signal="SELL";

/* STRENGTH */
let strength = 50;
if(signal !== "WAIT") strength += 30;
if(trend !== "SIDEWAYS") strength += 10;
if(rsi > 45 && rsi < 70) strength += 10;

strength = Math.min(100, strength);

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
console.log("🚀 SNIPER PRO V15 ONLINE");
});
