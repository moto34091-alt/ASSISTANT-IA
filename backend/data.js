async function getPrice(symbol) {

try {

const API_KEY = process.env.TWELVE_API_KEY;

if (!API_KEY) {
console.log("❌ TWELVE_API_KEY manquante");
return null;
}

let fixedSymbol = symbol;

/* FOREX FORMAT */
if (symbol.length === 6) {
fixedSymbol = symbol.slice(0, 3) + "/" + symbol.slice(3);
}

/* CRYPTO / METALS */
if (symbol === "XAUUSD") fixedSymbol = "XAU/USD";
if (symbol === "XAGUSD") fixedSymbol = "XAG/USD";
if (symbol === "BTCUSD") fixedSymbol = "BTC/USD";
if (symbol === "ETHUSD") fixedSymbol = "ETH/USD";

const url =
`https://api.twelvedata.com/price?symbol=${fixedSymbol}&apikey=${API_KEY}`;

console.log("➡️ URL:", url);

const res = await fetch(url);
const data = await res.json();

console.log("📡 RESPONSE:", data);

/* ERROR FROM API */
if (!data) {
console.log("❌ API empty response");
return null;
}

/* Twelve Data error check */
if (data.status === "error") {
console.log("❌ API ERROR:", data.message);
return null;
}

/* PRICE CHECK */
if (!data.price) {
console.log("❌ No price in response");
return null;
}

const price = Number(data.price);

if (isNaN(price)) {
console.log("❌ Price is NaN");
return null;
}

return price;

} catch (err) {

console.log("❌ GET PRICE CRASH:", err);
return null;

}

}

module.exports = { getPrice };
