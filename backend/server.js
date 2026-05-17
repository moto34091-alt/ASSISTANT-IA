const express = require("express");
const app = express();

app.use(express.json());

/* ─────────────────────────────
   MARKET STRUCTURE ENGINE V6
───────────────────────────── */

/* simulate swing structure */
function generateStructure(){

let highs = [];
let lows = [];

let price = 100 + Math.random()*100;

for(let i=0;i<20;i++){

price += (Math.random()-0.5)*2;

highs.push(price + Math.random()*2);
lows.push(price - Math.random()*2);

}

return {highs, lows, price};
}

/* LIQUIDITY DETECTION */
function liquiditySweep(price, highs, lows){

let sweepHigh = highs.some(h => price > h);
let sweepLow = lows.some(l => price < l);

if(sweepHigh || sweepLow){
return true;
}
return false;
}

/* BOS / CHoCH */
function structureBreak(price, highs, lows){

let lastHigh = highs[highs.length-1];
let lastLow = lows[lows.length-1];

if(price > lastHigh) return "BULL_BOS";
if(price < lastLow) return "BEAR_BOS";

return "NEUTRAL";
}

/* ORDER BLOCK SIMULATION */
function orderBlock(structure){

if(structure === "BULL_BOS") return "BUY_ZONE";
if(structure === "BEAR_BOS") return "SELL_ZONE";
return "NONE";
}

/* SMC ENGINE V6 */
function smcV6(data){

let score = 50;

/* RSI logic */
if(data.rsi > 70) score += 20;
if(data.rsi < 30) score += 20;

/* liquidity */
if(data.liquidity) score += 20;

/* structure */
if(data.structure === "BULL_BOS") score += 15;
if(data.structure === "BEAR_BOS") score += 15;

/* order block */
if(data.orderBlock !== "NONE") score += 10;

/* volatility filter */
if(data.volatility > 60) score += 5;

/* clamp */
return Math.max(0, Math.min(100, score));
}

/* SIGNAL */
function signal(score){

if(score >= 70) return "BUY";
if(score <= 40) return "SELL";
return "WAIT";
}

/* API */
app.get("/signal",(req,res)=>{

let {highs,lows,price} = generateStructure();

let rsi = 20 + Math.random()*60;
let volatility = Math.random()*100;

let liquidity = liquiditySweep(price,highs,lows);
let structure = structureBreak(price,highs,lows);
let orderBlock = orderBlock(structure);

let data = {
price: price.toFixed(2),
rsi: rsi.toFixed(2),
volatility: volatility.toFixed(2),
liquidity,
structure,
orderBlock
};

let score = smcV6(data);

res.json({
...data,
confidence: score,
signal: signal(score),
quality: score > 75 ? "HIGH" : "LOW"
});

});

app.listen(3000,()=>console.log("V6 SMART MONEY RUNNING"));
