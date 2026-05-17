const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

/* ─────────────────────────────
   SNIPER AI PRO FIXED ENGINE
───────────────────────────── */

function generatePrice(){

let price = 100 + Math.random() * 100;

if(!price || isNaN(price)){
price = 100;
}

return Number(price.toFixed(2));
}

function generateStructureData(price){

let highs = [];
let lows = [];

for(let i = 0; i < 20; i++){

price += (Math.random() - 0.5) * 2;

highs.push(price + Math.random() * 2);
lows.push(price - Math.random() * 2);

}

return { highs, lows, price };
}

/* LIQUIDITY FIX */
function checkLiquidity(highs, lows, price){
return highs.some(h => price > h) || lows.some(l => price < l);
}

/* STRUCTURE FIX */
function detectStructure(price, highs, lows){

let lastHigh = highs[highs.length - 1];
let lastLow = lows[lows.length - 1];

if(price > lastHigh) return "BULL_BOS";
if(price < lastLow) return "BEAR_BOS";
return "NEUTRAL";
}

/* SCORE ENGINE */
function scoreEngine(data){

let score = 50;

if(data.rsi > 70) score += 20;
if(data.rsi < 30) score += 20;

if(data.liquidity) score += 20;

if(data.structure === "BULL_BOS") score += 10;
if(data.structure === "BEAR_BOS") score += 10;

return Math.max(0, Math.min(100, score));
}

/* SIGNAL */
function getSignal(score){

if(score >= 70) return "BUY";
if(score <= 40) return "SELL";
return "WAIT";
}

/* API */
app.get("/signal",(req,res)=>{

let price = generatePrice();

let { highs, lows, price: finalPrice } = generateStructureData(price);

let rsi = 20 + Math.random() * 60;

let liquidity = checkLiquidity(highs, lows, finalPrice);

let structure = detectStructure(finalPrice, highs, lows);

let data = {
price: finalPrice,
rsi: Number(rsi.toFixed(2)),
liquidity,
structure
};

let confidence = scoreEngine(data);

res.json({
...data,
confidence,
signal: getSignal(confidence),
quality: confidence > 75 ? "HIGH" : "LOW"
});

});

/* START */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
console.log("🚀 SNIPER AI PRO FIXED RUNNING ON PORT", PORT);
});
