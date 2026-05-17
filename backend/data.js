const fetch = (...args) =>
import("node-fetch").then(({default: fetch}) => fetch(...args));

const API_KEY = process.env.TWELVE_API_KEY;

async function getPrice(symbol){

try{

let fixedSymbol = symbol;

if(symbol.includes("USD")){
fixedSymbol = symbol.replace("USD","/USD");
}

if(symbol.includes("JPY")){
fixedSymbol = symbol.replace("JPY","/JPY");
}

if(symbol.includes("BTC")){
fixedSymbol = "BTC/USD";
}

if(symbol.includes("XAU")){
fixedSymbol = "XAU/USD";
}

const url =
`https://api.twelvedata.com/price?symbol=${fixedSymbol}&apikey=${API_KEY}`;

const response = await fetch(url);

const data = await response.json();

return data.price || null;

}catch(err){

console.log(err);
return null;

}

}

module.exports = {
getPrice
};
