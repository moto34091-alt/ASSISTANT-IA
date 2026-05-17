const fetch = (...args) =>
import("node-fetch").then(({ default: fetch }) => fetch(...args));

const API_KEY = process.env.TWELVE_API_KEY;

function formatSymbol(symbol) {

let fixedSymbol = symbol;

const forexPairs = [
"EURUSD","GBPUSD","USDJPY","USDCHF","USDCAD",
"AUDUSD","NZDUSD","EURJPY","GBPJPY","EURGBP",
"EURCHF","EURCAD","EURAUD","AUDJPY","CHFJPY"
];

if (forexPairs.includes(symbol)) {
fixedSymbol = symbol.slice(0, 3) + "/" + symbol.slice(3);
}

if (symbol === "XAUUSD") fixedSymbol = "XAU/USD";
if (symbol === "BTCUSD") fixedSymbol = "BTC/USD";
if (symbol === "ETHUSD") fixedSymbol = "ETH/USD";

return fixedSymbol;

}

async function getPrice(symbol) {

try {

const fixedSymbol = formatSymbol(symbol);

const url =
`https://api.twelvedata.com/price?symbol=${fixedSymbol}&apikey=${API_KEY}`;

const response = await fetch(url);
const data = await response.json();

if (!data || !data.price) return null;

return Number(data.price);

} catch (err) {

return null;

}

}

module.exports = {
getPrice
};
