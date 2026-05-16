const fetch = require("node-fetch");

async function getCandles(symbol, interval = "1min") {

  const cleanSymbol = symbol.replace(" OTC", "").replace("/", "");

  const url = `https://api.twelvedata.com/time_series?symbol=${cleanSymbol}&interval=${interval}&outputsize=5&apikey=${process.env.TWELVE_API_KEY}`;

  console.log("URL =>", url);

  const res = await fetch(url);
  const data = await res.json();

  console.log("RAW RESPONSE =>", data);

  return [];
}

module.exports = { getCandles };
