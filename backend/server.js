const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

/* ─────────────────────────────
   SAFE MARKET STRUCTURE ENGINE V6 FIXED
───────────────────────────── */

/* GENERATE STRUCTURE SAFE */
function generateStructure(){

let highs = [];
let lows = [];

/* SAFE PRICE INIT */
let price = 100 + Math.random() * 100;

/* build market structure */
for(let i = 0; i < 20; i++){

price += (Math.random() - 0.5) * 2;

highs.push(price + Math.random() * 2);
lows.push(price - Math.random() * 2);

}

/* FINAL SAFETY CHECK */
if(!price || isNaN(price)){
price = 100;
}

price = Number(price.toFixed(2));

return { highs, lows, price };
}

/* LIQUIDITY SWEEP */
function liquiditySweep(price, highs, lows){
return highs.some(h => price > h) || lows.some(l => price < l);
}

/* BOS / CHOCH */
function structureBreak(price, highs, lows){

let lastHigh = highs[highs.length - 1];
let lastLow = lows[lows.length - 1];

if(price > lastHigh) return "BULL_BOS";
if(price < lastLow) return "BEAR_BOS";

return "NEUTRAL";
}

/* ORDER BLOCK */
function getOrderBlock(structure){

if(structure === "BULL_BOS") return "BUY_ZONE";
if(structure === "BEAR_BOS") return "SELL_ZONE";

return "NONE";
}

/* SMC ENGINE */
function smcV6(data){

let score = 50;

/* RSI */
if(data.rsi > 70) score += 20;
if(data.rsi < 30) score += 20;

/* LIQUIDITY */
if(data.liquidity) score += 20;

/* STRUCTURE */
if(data.structure === "BULL_BOS") score += 15;
if(data.structure === "BEAR_BOS") score += 15;

/* ORDER BLOCK */
if(data.orderBlock !== "NONE") score += 10;

/* VOLATILITY */
if(data.volatility > 60) score += 5;
else score -= 5;

/* CLAMP */
return Math.max(0, Math.min(100, score));
}

/* SIGNAL ENGINE */
function getSignal(score){

if(score >= 70) return "BUY";
if(score <= 40) return "SELL";
return "WAIT";
}

/* API ENDPOINT */
app.get("/signal",(req,res)=>{

let { highs, lows, price } = generateStructure();

/* SAFE INDICATORS */
let rsi = 20 + Math.random() * 60;
let volatility = Math.random() * 100;

/* CORE LOGIC */
let liquidity = liquiditySweep(price, highs, lows);
let structure = structureBreak(price, highs, lows);
let orderBlock = getOrderBlock(structure);

/* DATA PACK */
let data = {
price,
rsi: Number(rsi.toFixed(2)),
volatility: Number(volatility.toFixed(2)),
liquidity,
structure,
orderBlock
};

/* SCORE */
let confidence = smcV6(data);

/* RESPONSE */
res.json({
...data,
confidence,
signal: getSignal(confidence),
quality: confidence > 75 ? "HIGH" : "LOW"
});

});

/* START SERVER */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
console.log("🚀 SNIPER AI PRO V6 FIXED RUNNING ON PORT", PORT);
});
