const fetch = require("node-fetch");

/* FORMAT SYMBOL */

function formatSymbol(symbol){

  const crypto = ["BTCUSD","ETHUSD"];
  const metals = ["XAUUSD","XAGUSD"];

  // CRYPTO
  if(crypto.includes(symbol)){
    return symbol.replace("USD","/USD");
  }

  // GOLD / SILVER
  if(metals.includes(symbol)){
    return symbol.replace("USD","/USD");
  }

  // FOREX
  if(symbol.length === 6){
    return symbol.slice(0,3) + "/" + symbol.slice(3);
  }

  return symbol;
}

/* GET CANDLES */

async function getCandles(symbol, interval = "1min") {

  try {

    if (!process.env.TWELVE_API_KEY) {

      console.log("❌ TWELVE_API_KEY MISSING");

      return [];
    }

    // FORMAT SYMBOL
    let clean = formatSymbol(symbol);

    const url =
`https://api.twelvedata.com/time_series?symbol=${clean}&interval=${interval}&outputsize=50&apikey=${process.env.TWELVE_API_KEY}`;

    console.log("📡 FETCH:", url);

    const res = await fetch(url);

    const data = await res.json();

    console.log("📊 DATA:", data);

    // ERROR API
    if (
      data.status === "error" ||
      !data.values
    ) {

      console.log("❌ API ERROR:", data.message);

      return [];
    }

    // FORMAT CANDLES
    return data.values.reverse().map(c => ({

      open: parseFloat(c.open),

      high: parseFloat(c.high),

      low: parseFloat(c.low),

      close: parseFloat(c.close)

    }));

  } catch (err) {

    console.log("❌ DATA ERROR:", err.message);

    return [];
  }
}

/* GET LIVE PRICE */

async function getPrice(symbol){

  try {

    let clean = formatSymbol(symbol);

    const url =
`https://api.twelvedata.com/price?symbol=${clean}&apikey=${process.env.TWELVE_API_KEY}`;

    console.log("💲 PRICE:", url);

    const res = await fetch(url);

    const data = await res.json();

    console.log("💰 PRICE DATA:", data);

    if(data && data.price){

      return parseFloat(data.price);
    }

    return null;

  } catch(err){

    console.log("❌ PRICE ERROR:", err.message);

    return null;
  }
}

module.exports = {

  getCandles,
  getPrice

};
