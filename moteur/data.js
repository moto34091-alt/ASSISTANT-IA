const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

async function getPrice(symbol) {
  try {
    const API_KEY = process.env.TWELVE_API_KEY;

    if (!API_KEY) {
      console.log("NO API KEY");
      return null;
    }

    let fixedSymbol = symbol;

    if (symbol.length === 6) {
      fixedSymbol = symbol.slice(0, 3) + "/" + symbol.slice(3);
    }

    if (symbol === "XAUUSD") fixedSymbol = "XAU/USD";
    if (symbol === "BTCUSD") fixedSymbol = "BTC/USD";
    if (symbol === "ETHUSD") fixedSymbol = "ETH/USD";

    const url =
      `https://api.twelvedata.com/price?symbol=${fixedSymbol}&apikey=${API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    console.log("TWELVE PRICE RESPONSE:", data);

    if (!data) return null;

    if (data.status === "error") {
      console.log("API ERROR:", data.message);
      return null;
    }

    if (!data.price) return null;

    const price = Number(data.price);

    if (isNaN(price)) return null;

    return price;

  } catch (err) {
    console.log("GET PRICE ERROR:", err);
    return null;
  }
}

module.exports = { getPrice };
