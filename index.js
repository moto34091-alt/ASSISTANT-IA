require("dotenv").config();

const express = require("express");
const axios = require("axios");
const WebSocket = require("ws");
const path = require("path");

const app = express();

app.use(express.static(__dirname));

/* =========================
HOME
========================= */
app.get("/", (req, res) => {
res.sendFile(path.join(__dirname, "index.html"));
});

/* =========================
FOREX DATA
========================= */
async function fetchForex(symbol, interval) {

try {

const intervals = {
"30s":"1min",
"1m":"1min",
"5m":"5min",
"15m":"15min"
};

const pair =
symbol.slice(0,3) + "/" + symbol.slice(3);

const url =
`https://api.twelvedata.com/time_series?symbol=${pair}&interval=${intervals[interval]}&outputsize=100&apikey=${process.env.TWELVE_API_KEY}`;

const res = await axios.get(url);

if (!res.data.values) return null;

return res.data.values
.reverse()
.map(c => ({
close:Number(c.close),
high:Number(c.high),
low:Number(c.low)
}));

} catch (e) {
console.log(e.message);
return null;
}
}

/* =========================
RSI
========================= */
function RSI(data, period = 14){

let gains = 0;
let losses = 0;

for(let i=1;i<=period;i++){

const diff = data[i] - data[i-1];

if(diff >= 0) gains += diff;
else losses += Math.abs(diff);

}

let avgGain = gains / period;
let avgLoss = losses / period;

for(let i=period+1;i<data.length;i++){

const diff = data[i] - data[i-1];

const gain = diff > 0 ? diff : 0;
const loss = diff < 0 ? Math.abs(diff) : 0;

avgGain = ((avgGain * 13) + gain) / 14;
avgLoss = ((avgLoss * 13) + loss) / 14;

}

const rs = avgGain / (avgLoss || 1);

return 100 - (100 / (1 + rs));
}

/* =========================
EMA
========================= */
function EMA(data, period){

const k = 2 / (period + 1);

let ema = data[0];

for(let i=1;i<data.length;i++){
ema = data[i] * k + ema * (1-k);
}

return ema;
}

/* =========================
SUPPORT / RESISTANCE
========================= */
function support(data){
return Math.min(...data.slice(-20));
}

function resistance(data){
return Math.max(...data.slice(-20));
}

/* =========================
BOS DETECTION
========================= */
function detectBOS(price, resistanceLevel, supportLevel){

if(price > resistanceLevel)
return "BULLISH BOS";

if(price < supportLevel)
return "BEARISH BOS";

return "NO BOS";
}

/* =========================
ANALYZE
========================= */
async function analyze(symbol, interval){

const candles = await fetchForex(symbol, interval);

if(!candles || candles.length < 30){

return {
signal:"WAIT",
price:0,
rsi:0,
emaFast:0,
emaSlow:0,
trend:"NO DATA",
strength:0,
support:0,
resistance:0,
bos:"NO BOS",
candles:[]
};

}

const closes = candles.map(c=>c.close);

const price = closes.at(-1);

const rsi = RSI(closes);

const emaFast = EMA(closes.slice(-20),9);
const emaSlow = EMA(closes.slice(-20),21);

const sup = support(closes);
const res = resistance(closes);

const bos = detectBOS(price,res,sup);

let trend = "SIDEWAYS";

if(emaFast > emaSlow)
trend = "BULLISH";

if(emaFast < emaSlow)
trend = "BEARISH";

let strength = 50;

if(emaFast > emaSlow) strength += 20;
if(rsi < 30) strength += 20;
if(rsi > 70) strength += 20;

let signal = "WAIT";

if(
trend === "BULLISH" &&
rsi < 45 &&
price > sup
){
signal = "BUY";
}

if(
trend === "BEARISH" &&
rsi > 55 &&
price < res
){
signal = "SELL";
}

return {

signal,
price:price.toFixed(5),
rsi:rsi.toFixed(2),
emaFast:emaFast.toFixed(5),
emaSlow:emaSlow.toFixed(5),
trend,
strength,
support:sup.toFixed(5),
resistance:res.toFixed(5),
bos,
candles:candles.slice(-3)

};

}

/* =========================
API
========================= */
app.get("/api/:symbol/:interval", async(req,res)=>{

const data =
await analyze(
req.params.symbol,
req.params.interval
);

res.json(data);

});

/* =========================
SERVER
========================= */
const PORT =
process.env.PORT || 3000;

const server =
app.listen(PORT,()=>{
console.log("SNIPER PRO V7 ONLINE");
});

/* =========================
WEBSOCKET
========================= */
const wss =
new WebSocket.Server({server});

wss.on("connection",(ws)=>{

ws.on("message",async(msg)=>{

try{

const {symbol,interval} =
JSON.parse(msg);

const result =
await analyze(symbol,interval);

setTimeout(()=>{

ws.send(JSON.stringify(result));

},10000);

}catch(e){

ws.send(JSON.stringify({
signal:"WAIT"
}));

}

});

});
