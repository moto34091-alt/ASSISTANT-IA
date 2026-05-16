const fetch = require("node-fetch");

async function getCandles(symbol, interval = "1min") {

  try {

    if (!process.env.TWELVE_API_KEY) {
      console.log("❌ TWELVE_API_KEY MISSING");
      return [];
    }

    // CLEAN SYMBOL (NO OTC)
    let clean = symbol
      .replace(/\//g, "")
      .replace(/\s/g, "")
      .toUpperCase();

    const url =
`https://api.twelvedata.com/time_series?symbol=${clean}&interval=${interval}&outputsize=30&apikey=${process.env.TWELVE_API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.values || data.status === "error") {
      console.log("❌ API ERROR:", data.message);
      return [];
    }

    return data.values.reverse().map(c => ({
      open: parseFloat(c.open),
      high: parseFloat(c.high),
      low: parseFloat(c.low),
      close: parseFloat(c.close)
    }));

  } catch (err) {
    console.log("DATA ERROR:", err.message);
    return [];
  }
}

// PRICE LIVE
async function getPrice(symbol){

  try {

    let clean = symbol
      .replace(/\//g, "")
      .replace(/\s/g, "")
      .toUpperCase();

    const url =
`https://api.twelvedata.com/price?symbol=${clean}&apikey=${process.env.TWELVE_API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data && data.price){
      return parseFloat(data.price);
    }

    return null;

  } catch (err) {
    return null;
  }
}

module.exports = {
  getCandles,
  getPrice
};
