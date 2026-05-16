const fetch = require("node-fetch");

async function getCandles(symbol, interval = "1min") {

  try {

    // DEBUG API KEY
    console.log("🔑 TWELVE_API_KEY =", process.env.TWELVE_API_KEY);

    if (!process.env.TWELVE_API_KEY) {
      console.log("❌ API KEY MISSING");
      return [];
    }

    // CLEAN SYMBOL
    let cleanSymbol = symbol
      .replace(" OTC", "")
      .replace("/", "");

    console.log("📊 SYMBOL CLEAN =", cleanSymbol);

    // URL TWELVEDATA
    const url =
`https://api.twelvedata.com/time_series?symbol=${cleanSymbol}&interval=${interval}&outputsize=50&apikey=${process.env.TWELVE_API_KEY}`;

    console.log("🌐 REQUEST URL =", url);

    const response = await fetch(url);
    const data = await response.json();

    console.log("📦 RAW DATA =", JSON.stringify(data, null, 2));

    // ERROR API
    if (data.status === "error") {
      console.log("❌ API ERROR:", data.message);
      return [];
    }

    // NO DATA
    if (!data.values || !Array.isArray(data.values)) {
      console.log("⚠️ NO VALUES RECEIVED");
      return [];
    }

    // FORMAT CANDLES
    const candles = data.values
      .reverse()
      .map(c => ({
        open: parseFloat(c.open),
        high: parseFloat(c.high),
        low: parseFloat(c.low),
        close: parseFloat(c.close)
      }));

    console.log("✅ CANDLES LOADED =", candles.length);

    return candles;

  } catch (err) {

    console.log("❌ FETCH ERROR:", err.message);

    return [];
  }
}

module.exports = { getCandles };
