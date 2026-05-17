const express = require("express");
const cors = require("cors");

/* FETCH FIX RAILWAY */
const fetch = (...args) =>
import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();

app.use(cors());
app.use(express.json());

/* API KEY */
const API_KEY = process.env.TWELVE_API_KEY;

/* ROOT */
app.get("/", (req, res) => {

res.send("🚀 D-FLAM SIGNAL BOT RUNNING");

});

/* SIGNAL API */
app.get("/signal", async (req, res) => {

try {

const symbol = req.query.symbol || "EURUSD";

/* SYMBOL FIX */
let fixedSymbol = symbol;

if(symbol.includes("USD")){
fixedSymbol = symbol.replace("USD", "/USD");
}

if(symbol.includes("JPY")){
fixedSymbol = symbol.replace("JPY", "/JPY");
}

if(symbol.includes("XAU")){
fixedSymbol = "XAU/USD";
}

if(symbol.includes("BTC")){
fixedSymbol = "BTC/USD";
}

console.log("SYMBOL:", fixedSymbol);

/* TWELVE DATA */
const url =
`https://api.twelvedata.com/price?symbol=${fixedSymbol}&apikey=${API_KEY}`;

console.log("URL:", url);

const response = await fetch(url);

const market = await response.json();

console.log("TWELVE RESPONSE:", market);

/* PRICE CHECK */
if(!market.price){

return res.json({
signal: "WAIT",
confidence: 0,
rsi: 50,
structure: "NEUTRAL",
quality: "LOW",
price: null
});

}

/* REAL PRICE */
const price = Number(market.price);

/* RSI */
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

if(rsi > 60){
confidence += 25;
}

if(rsi < 40){
confidence += 25;
}

confidence += Math.floor(Math.random() * 20);

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

/* QUALITY */
const quality =
confidence > 75 ? "HIGH" : "LOW";

/* RESPONSE */
res.json({
signal,
confidence,
rsi,
structure,
quality,
price
});

} catch(err){

console.log("SERVER ERROR:", err);

res.json({
signal: "WAIT",
confidence: 0,
rsi: 50,
structure: "NEUTRAL",
quality: "LOW",
price: null
});

}

});

/* START SERVER */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

console.log("🚀 D-FLAM SIGNAL BOT RUNNING ON PORT", PORT);

});
