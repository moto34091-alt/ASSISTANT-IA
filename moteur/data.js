const fetch = require("node-fetch");

async function getCandles(symbol, interval = "1min") {

  try {

    // conversion OTC
    let cleanSymbol = symbol.replace(" OTC", "");

    const url =
`https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(cleanSymbol)}&interval=${interval}&outputsize=50&apikey=${process.env.TWELVE_API_KEY}`;

    console.log("FETCH:", url);

    const res = await fetch(url);

    const data = await res.json();

    console.log("TWELVE DATA:", data);

    // sécurité
    if (!data.values || !Array.isArray(data.values)) {
      return [];
    }

    // reverse candles (ancien -> récent)
    const candles = data.values.reverse().map(c => ({
      open: parseFloat(c.open),
      high: parseFloat(c.high),
      low: parseFloat(c.low),
      close: parseFloat(c.close)
    }));

    return candles;

  } catch(err){

    console.log("DATA ERROR:", err.message);

    return [];
  }
}

module.exports = { getCandles };
