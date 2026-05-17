const express = require("express");
const app = express();

app.use(express.json());

/* MOCK PRICE (replace with real API later) */
function getPrice(symbol){

return {
price: (Math.random() * 100000).toFixed(2)
};

}

/* SMART MONEY ENGINE V5 */
function smcV5(data){

let score = 50;

/* RSI */
let rsi = data.rsi ?? 50;

/* VOLATILITY */
let volatility = data.volatility ?? (Math.random()*100);

/* trend simulation */
let trend = data.trend ?? (Math.random()>0.5?"UP":"DOWN");

/* LIQUIDITY SWEEP */
if(rsi > 70 || rsi < 30){
score += 20;
}

/* BOS (Break of Structure) */
if(data.macd === true){
score += 15;
}

/* CHoCH logic */
if(rsi > 60 && trend === "DOWN"){
score += 10;
}

/* fake breakout filter */
if(volatility > 70){
score += 10;
} else {
score -= 5;
}

/* trend bias */
if(trend === "UP") score += 10;
if(trend === "DOWN") score += 10;

/* clamp */
return Math.max(0, Math.min(100, score));
}

/* SIGNAL ENGINE */
function generateSignal(score){

if(score >= 70) return "BUY";
if(score <= 40) return "SELL";
return "WAIT";
}

/* API */
app.get("/signal",(req,res)=>{

const symbol = req.query.symbol;

const priceData = getPrice(symbol);

/* fake indicators (replace later with real data API) */
let data = {
price: priceData.price,
rsi: 30 + Math.random()*40,
macd: Math.random() > 0.5,
volatility: Math.random()*100,
trend: Math.random()>0.5?"UP":"DOWN"
};

let score = smcV5(data);

res.json({
price: data.price,
rsi: data.rsi.toFixed(2),
macd: data.macd,
volatility: data.volatility.toFixed(2),
trend: data.trend,
confidence: score,
signal: generateSignal(score),
quality: score > 75 ? "HIGH" : "LOW"
});

});

app.listen(3000,()=>console.log("SNIPER AI V5 RUNNING"));
