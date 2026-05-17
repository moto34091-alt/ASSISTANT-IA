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

async function getPrice(symbol) {
  try {
    const API_KEY = process.env.TWELVE_API_KEY;

    if (!API_KEY) {
      console.log("NO API KEY");
      return 1;
    }

    const fixedSymbol = formatSymbol(symbol);

    const url =
      `https://api.twelvedata.com/price?symbol=${fixedSymbol}&apikey=${API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    console.log("TWELVE RESPONSE:", data);

    if (!data || !data.price || data.status === "error") {
      return 1;
    }

    const price = Number(data.price);

    if (isNaN(price)) return 1;

    return price;

  } catch (err) {
    console.log("DATA ERROR:", err);
    return 1;
  }
}

module.exports = { getPrice };
