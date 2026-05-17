const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const API_KEY = process.env.TWELVE_API_KEY;

/* SYMBOL FIX (CRITIQUE) */
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

/* GET DATA */
async function getCandles(symbol) {
  try {
    const fixed = formatSymbol(symbol);

    const url =
      `https://api.twelvedata.com/time_series?symbol=${fixed}&interval=1min&outputsize=50&apikey=${API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data || data.status === "error" || !data.values) {
      console.log("API ERROR:", data);
      return null;
    }

    return data.values
      .map(c => Number(c.close))
      .filter(v => !isNaN(v))
      .reverse();

  } catch (err) {
    console.log("CANDLES ERROR:", err);
    return null;
  }
}

/* RSI */
function RSI(closes, period = 14) {
  if (!closes || closes.length < period + 1) return null;

  let gain = 0;
  let loss = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gain += diff;
    else loss += Math.abs(diff);
  }

  if (loss === 0) return 100;

  const rs = gain / loss;
  return 100 - (100 / (1 + rs));
}

/* ENGINE */
async function analyzeMarket(symbol, tf) {
  try {
    const candles = await getCandles(symbol);

    if (!candles || candles.length < 20) {
      return null;
    }

    const price = candles[candles.length - 1];
    const rsi = RSI(candles);

    if (rsi == null) return null;

    let confidence = 50;

    if (rsi > 55) confidence += 25;
    if (rsi < 45) confidence += 25;

    confidence = Math.max(0, Math.min(100, confidence));

    let signal = "WAIT";
    if (confidence >= 65) signal = "BUY";
    if (confidence <= 35) signal = "SELL";

    return {
      price: Number(price),
      rsi: Number(rsi.toFixed(2)),
      structure:
        rsi > 55 ? "BULLISH" :
        rsi < 45 ? "BEARISH" :
        "NEUTRAL",
      confidence: Number(confidence.toFixed(2)),
      signal,
      quality: confidence > 75 ? "HIGH" : "LOW",
      timeframe: tf || "1min"
    };

  } catch (err) {
    console.log("ENGINE ERROR:", err);
    return null;
  }
}

module.exports = { analyzeMarket };
