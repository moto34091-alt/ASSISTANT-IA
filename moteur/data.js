const fetch = require("node-fetch");

async function getCandles(symbol, interval = "1min") {

  try {

    // CHECK API KEY
    if (!process.env.TWELVE_API_KEY) {

      console.log("❌ TWELVE_API_KEY MISSING");

      return [];
    }

    // CLEAN SYMBOL
    let clean = symbol
      .replace(" OTC", "")
      .replace(/\//g, "")
      .replace(/\s/g, "")
      .toUpperCase();

    // FORCE VALID SYMBOLS
    const validSymbols = {
      "EURUSD": "EUR/USD",
      "GBPUSD": "GBP/USD",
      "USDJPY": "USD/JPY",
      "USDCAD": "USD/CAD",
      "USDCHF": "USD/CHF",
      "BTCUSD": "BTC/USD",
      "ETHUSD": "ETH/USD",
      "XAUUSD": "XAU/USD",
      "AUDUSD": "AUD/USD",
      "EURJPY": "EUR/JPY"
    };

    clean = validSymbols[clean] || clean;

    console.log("📊 SYMBOL =", clean);

    const url =
`https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(clean)}&interval=${interval}&outputsize=30&apikey=${process.env.TWELVE_API_KEY}`;

    console.log("🌐 URL =", url);

    const response = await fetch(url);

    const data = await response.json();

    console.log("📦 RESPONSE =", JSON.stringify(data, null, 2));

    // ERROR
    if (data.status === "error") {

      console.log("❌ API ERROR:", data.message);

      return [];
    }

    // NO VALUES
    if (!data.values || !Array.isArray(data.values)) {

      console.log("❌ NO VALUES");

      return [];
    }

    // FORMAT CANDLES
    const candles = data.values.reverse().map(c => ({
      open: parseFloat(c.open),
      high: parseFloat(c.high),
      low: parseFloat(c.low),
      close: parseFloat(c.close)
    }));

    console.log("✅ CANDLES =", candles.length);

    return candles;

  } catch (err) {

    console.log("❌ DATA ERROR:", err.message);

    return [];
  }
}

module.exports = { getCandles };
