const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const API_KEY = process.env.TWELVE_API_KEY;

/* SIGNAL API */
app.get("/signal", async (req, res) => {

try{

const symbol = req.query.symbol || "EUR/USD";

const fixedSymbol = symbol.replace("USD","/USD");

const url =
`https://api.twelvedata.com/price?symbol=${fixedSymbol}&apikey=${API_KEY}`;

const response = await fetch(url);

const market = await response.json();

console.log("TWELVE:", market);

/* PRICE */
let price = market.price;

if(!price){

return res.json({
signal:"WAIT",
confidence:0,
rsi:50,
structure:"NEUTRAL",
quality:"LOW",
price:null
});

}

price = Number(price);

/* RSI SIMULATION */
let rsi = Math.floor(20 + Math.random() * 60);

/* STRUCTURE */
let structure = "NEUTRAL";

if(rsi > 60){
structure = "BULL_BOS";
}

if(rsi < 40){
structure = "BEAR_BOS";
}

/* CONFIDENCE */
let confidence = 50;

if(rsi > 60) confidence += 25;
if(rsi < 40) confidence += 25;

confidence += Math.floor(Math.random()*20);

if(confidence > 100){
confidence = 100;
}

/* SIGNAL */
let signal = "WAIT";

if(confidence >= 70){
signal = "BUY";
}

if(confidence <= 35){
signal = "SELL";
}

/* RESPONSE */
res.json({
signal,
confidence,
rsi,
structure,
quality: confidence > 75 ? "HIGH" : "LOW",
price
});

}catch(err){

console.log(err);

res.json({
signal:"WAIT",
confidence:0,
rsi:50,
structure:"NEUTRAL",
quality:"LOW",
price:null
});

}

});

/* ROOT */
app.get("/",(req,res)=>{
res.send("D-FLAM SIGNAL BOT RUNNING");
});

/* START */
const PORT = process.env.PORT || 3000;

app.listen(PORT, ()=>{
console.log("🚀 SERVER RUNNING");
});
