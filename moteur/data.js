const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

function formatSymbol(symbol) {
  const map = {
    EURUSD: "EUR/USD",
    GBPUSD: "GBP/USD",
    USDJPY: "USD/JPY",
    USDCHF: "USD/CHF",
    USDCAD: "USD/CAD",
    AUDUSD: "AUD/USD",
    BTCUSD: "BTC/USD",
    ETHUSD: "ETH/USD",
    XAUUSD: "XAU/USD"
  };

  return map[symbol] || symbol;
}

/* SMART FALLBACK PRICES */
function fallbackPrice(symbol) {
  const fallback = {
    EURUSD: 1.08,
    GBPUSD: 1.27,
    USDJPY: 150,
    BTCUSD: 65000,
    ETHUSD: 3200,
    XAUUSD: 2300
  };

  return fallback[symbol] || 100;
}

async function getPrice(symbol) {
  try {
    const API_KEY = process.env.TWELVE_API_KEY;

    const fixedSymbol = formatSymbol(symbol);

    if (!API_KEY) {
      console.log("NO API KEY → fallback");
      return fallbackPrice(symbol);
    }

    const url =
      `https://api.twelvedata.com/price?symbol=${fixedSymbol}&apikey=${API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    console.log("API RESPONSE:", data);

    if (!data || !data.price || data.status === "error") {
      console.log("INVALID DATA → fallback");
      return fallbackPrice(symbol);
    }

    const price = Number(data.price);

    if (isNaN(price)) {
      return fallbackPrice(symbol);
    }

    return price;

  } catch (err) {
    console.log("DATA ERROR:", err);
    return fallbackPrice(symbol);
  }
}

module.exports = { getPrice };
