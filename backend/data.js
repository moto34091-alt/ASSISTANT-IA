async function getPrice(symbol) {

try {

const API_KEY = process.env.TWELVE_API_KEY;

if (!API_KEY) {
return null;
}

let fixedSymbol = symbol;

/* FORMAT FOREX */
if (symbol.length === 6) {
fixedSymbol = symbol.slice(0, 3) + "/" + symbol.slice(3);
}

/* SPECIAL ASSETS */
if (symbol === "XAUUSD") fixedSymbol = "XAU/USD";
if (symbol === "XAGUSD") fixedSymbol = "XAG/USD";
if (symbol === "BTCUSD") fixedSymbol = "BTC/USD";
if (symbol === "ETHUSD") fixedSymbol = "ETH/USD";

const url =
`https://api.twelvedata.com/price?symbol=${fixedSymbol}&apikey=${API_KEY}`;

const res = await fetch(url);
const data = await res.json();

if (!data || !data.price) {
return null;
}

const price = Number(data.price);

if (isNaN(price)) {
return null;
}

return price;

} catch (err) {

console.log("PRICE ERROR:", err);
return null;

}

}

module.exports = {
getPrice
};
