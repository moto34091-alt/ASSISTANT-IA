/* ─────────────────────────────
   D-FLAM LIVE MARKET DATA ENGINE
   moteur/data.js
───────────────────────────── */

/* FETCH FIX NODE-FETCH V3 */
const fetch = (...args) =>
import("node-fetch").then(({ default: fetch }) => fetch(...args));

/* API KEY */
const API_KEY = process.env.TWELVE_API_KEY;

/* ─────────────────────────────
   FORMAT SYMBOL
───────────────────────────── */

function formatSymbol(symbol){

let fixedSymbol = symbol;

/* FOREX */
const forexPairs = [
"EURUSD",
"GBPUSD",
"USDJPY",
"USDCHF",
"USDCAD",
"AUDUSD",
"NZDUSD",
"EURJPY",
"GBPJPY",
"EURGBP",
"EURCHF",
"EURCAD",
"EURAUD",
"AUDJPY",
"CHFJPY"
];

if(forexPairs.includes(symbol)){

fixedSymbol =
symbol.slice(0,3) + "/" + symbol.slice(3);

}

/* GOLD */
if(symbol === "XAUUSD"){
fixedSymbol = "XAU/USD";
}

/* SILVER */
if(symbol === "XAGUSD"){
fixedSymbol = "XAG/USD";
}

/* BTC */
if(symbol === "BTCUSD"){
fixedSymbol = "BTC/USD";
}

/* ETH */
if(symbol === "ETHUSD"){
fixedSymbol = "ETH/USD";
}

return fixedSymbol;

}

/* ─────────────────────────────
   GET LIVE PRICE
───────────────────────────── */

async function getPrice(symbol){

try{

/* FORMAT */
const fixedSymbol = formatSymbol(symbol);

console.log("📈 SYMBOL:", fixedSymbol);

/* URL */
const url =
`https://api.twelvedata.com/price?symbol=${fixedSymbol}&apikey=${API_KEY}`;

console.log("🌐 URL:", url);

/* FETCH */
const response = await fetch(url);

const data = await response.json();

console.log("✅ TWELVE RESPONSE:", data);

/* SAFE CHECK */
if(
!data ||
!data.price ||
data.status === "error"
){

console.log("❌ INVALID PRICE");

return null;

}

/* PRICE */
const price =
Number(data.price);

/* FINAL SAFE */
if(isNaN(price)){

console.log("❌ PRICE NAN");

return null;

}

return price;

}catch(err){

console.log("🔥 GET PRICE ERROR:", err);

return null;

}

}

/* ─────────────────────────────
   EXPORT
───────────────────────────── */

module.exports = {
getPrice,
formatSymbol
};
