const fetch = require("node-fetch");

async function getCandles(symbol, interval = "1min") {

  try {

    // enlever OTC
    symbol = symbol.replace(" OTC", "");

    // convertir format TwelveData
    symbol = symbol.replace("/", "");

    console.log("SYMBOL:", symbol);

    const url =
`https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${interval}&outputsize=50&apikey=${process.env.TWELVE_API_KEY}`;

    console.log("URL:", url);

    const response = await fetch(url);

    const data = await response.json();

    console.log("DATA:", data);

    // sécurité
    if (!data.values) {
      return [];
    }

    // candles
    return data.values.reverse().map(c => ({
      open: parseFloat(c.open),
      high: parseFloat(c.high),
      low: parseFloat(c.low),
      close: parseFloat(c.close)
    }));

  } catch(err){

    console.log("FETCH ERROR:", err.message);

    return [];
  }
}

module.exports = { getCandles };
