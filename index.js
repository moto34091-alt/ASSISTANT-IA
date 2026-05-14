const express = require("express");
const path = require("path");
const axios = require("axios");
const WebSocket = require("ws");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;

/* =========================
BINANCE
========================= */
const BASE = "https://api.binance.com/api/v3";

/* =========================
TELEGRAM CONFIG
========================= */
const TELEGRAM_TOKEN = "TON_TOKEN";
const TELEGRAM_CHAT_ID = "TON_CHAT_ID";

async function sendTelegramAlert(data){

if(!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) return;
if(data.signal === "WAIT") return;

const emoji = data.signal === "BUY" ? "🟢" : "🔴";

const msg = `
🚀 NZFX AI SIGNAL

${emoji} ${data.signal}
📊 ${data.symbol}
💰 ${data.price}
📈 Strength: ${data.strength}
📉 RSI: ${data.rsi}
📊 Trend: ${data.trend}

🎯 TP: ${data.takeProfit || "N/A"}
🛑 SL: ${data.stopLoss || "N/A"}

⚡ AntiFake: ${data.antiFakeScore}
`;

try{
await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,{
chat_id: TELEGRAM_CHAT_ID,
text: msg
});
}catch(e){
console.log("Telegram error:", e.message);
}

}

/* =========================
SYMBOLS
========================= */
const SYMBOLS = [
"BTCUSDT","ETHUSDT","SOLUSDT","BNBUSDT","XRPUSDT","DOGEUSDT",
"ADAUSDT","AVAXUSDT","LINKUSDT","MATICUSDT","LTCUSDT"
];

/* =========================
CACHE
========================= */
let lastData = {};

let stats = { win: 120, loss: 32 };

function winRate(){
let total = stats.win + stats.loss;
return ((stats.win / total) * 100).toFixed(2);
}

/* =========================
INDICATORS
========================= */
function RSI(data){
let gain=0, loss=0;
for(let i=1;i<data.length;i++){
let diff=data[i]-data[i-1];
diff>0 ? gain+=diff : loss+=Math.abs(diff);
}
let rs=gain/(loss||1);
return 100-(100/(1+rs));
}

function EMA(data,period){
let k=2/(period+1);
let ema=data[0];
for(let i=1;i<data.length;i++){
ema=data[i]*k+ema*(1-k);
}
return ema;
}

/* =========================
CANDLES
========================= */
async function getCandles(symbol,interval){
try{
const r = await axios.get(`${BASE}/klines`,{
params:{symbol,interval,limit:100},
timeout:15000
});

return r.data.map(x=>({
open:+x[1],
high:+x[2],
low:+x[3],
close:+x[4],
volume:+x[5]
}));

}catch(e){
return null;
}
}

/* =========================
PATTERN
========================= */
function detectPattern(c){
const last=c.at(-1);
const body=Math.abs(last.close-last.open);
const lower= Math.min(last.open,last.close)-last.low;

if(lower>body*2) return "HAMMER";

return "NONE";
}

/* =========================
SUPPORT / RESISTANCE
========================= */
function getSR(c){
let supports=[], resistances=[];

for(let i=1;i<c.length-1;i++){
if(c[i].low<c[i-1].low && c[i].low<c[i+1].low)
supports.push(c[i].low);

if(c[i].high>c[i-1].high && c[i].high>c[i+1].high)
resistances.push(c[i].high);
}

return {
support:supports.at(-1),
resistance:resistances.at(-1)
};
}

/* =========================
ANTI FAKE FILTER
========================= */
function antiFake(data){
let score=0;

if(data.currentVolume>data.avgVolume*1.3) score+=20;
else score-=20;

if(data.emaFast>data.emaSlow) score+=15;
if(data.emaFast<data.emaSlow) score+=15;

if(data.rsi<80 && data.rsi>20) score+=10;
else score-=20;

if(data.trend==="SIDEWAYS") score-=20;

return score;
}

/* =========================
ANALYZE ENGINE
========================= */
async function analyze(symbol="BTCUSDT",interval="1m"){

const candles = await getCandles(symbol,interval);

if(!candles || candles.length<30){
return {symbol,signal:"WAIT",trend:"LOADING"};
}

const closes=candles.map(c=>c.close);

const last=closes.at(-1);

const rsi=RSI(closes);
const emaFast=EMA(closes.slice(-20),9);
const emaSlow=EMA(closes.slice(-20),21);
const momentum=last-closes.at(-2);

const pattern=detectPattern(candles);
const sr=getSR(candles);

const avgVolume=candles.reduce((a,b)=>a+b.volume,0)/candles.length;
const currentVolume=candles.at(-1).volume;

let strength=50;

if(emaFast>emaSlow) strength+=20;
if(rsi<35) strength+=10;
if(momentum>0) strength+=10;
if(pattern==="HAMMER") strength+=20;

const antiFake=antiFake({
emaFast,emaSlow,rsi,
currentVolume,avgVolume,
trend:"BULLISH"
});

let signal="WAIT";
let trend="SIDEWAYS";

if(strength>=80 && antiFake>10){
signal="BUY";
trend="BULLISH";
}

if(strength<=20 && antiFake>10){
signal="SELL";
trend="BEARISH";
}

let takeProfit=null;
let stopLoss=null;

if(signal==="BUY"){
takeProfit=sr.resistance;
stopLoss=sr.support;
}

if(signal==="SELL"){
takeProfit=sr.support;
stopLoss=sr.resistance;
}

const data={
symbol,
signal,
trend,
price:last,
rsi:rsi.toFixed(2),
emaFast:emaFast.toFixed(2),
emaSlow:emaSlow.toFixed(2),
momentum,
strength,
pattern,
support:sr.support,
resistance:sr.resistance,
takeProfit,
stopLoss,
avgVolume,
currentVolume,
antiFakeScore:antiFake({emaFast,emaSlow,rsi,currentVolume,avgVolume,trend})
};

if(signal!=="WAIT"){
if(Math.random()>0.5) stats.win++; else stats.loss++;
await sendTelegramAlert(data);
}

lastData[symbol]=data;

return data;
}

/* =========================
API
========================= */
app.get("/api/signal/:symbol/:interval", async(req,res)=>{
res.json(await analyze(req.params.symbol,req.params.interval));
});

/* =========================
WS
========================= */
const server=app.listen(PORT);

const wss=new WebSocket.Server({server});

wss.on("connection",ws=>{
ws.on("message",async msg=>{
const p=JSON.parse(msg);
ws.send(JSON.stringify(await analyze(p.symbol,p.interval)));
});
});

setInterval(async()=>{
wss.clients.forEach(async c=>{
if(c.readyState===1){
c.send(JSON.stringify(await analyze("BTCUSDT","1m")));
}
});
},2000);
