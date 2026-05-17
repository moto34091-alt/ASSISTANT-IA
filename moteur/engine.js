const { getPrice } = require("./data");

/* =========================
   FALLBACK PRICE (SAFE)
========================= */
function fallbackPrice(symbol) {
  return {
    EURUSD: 1.08,
    GBPUSD: 1.27,
    USDJPY: 150,
    BTCUSD: 65000,
    ETHUSD: 3200,
    XAUUSD: 2300
  }[symbol] || 100;
}

/* =========================
   FAKE PRICE DETECTOR
========================= */
function detectFakePrice(symbol, price) {
  if (!price || isNaN(price)) {
    return { fake: true, reason: "NO_PRICE" };
  }

  const p = Number(price);

  if (symbol === "EURUSD" && (p < 0.8 || p > 1.5))
    return { fake: true, reason: "EURUSD_RANGE" };

  if (symbol === "GBPUSD" && (p < 1.0 || p > 2.2))
    return { fake: true, reason: "GBPUSD_RANGE" };

  if (symbol === "USDJPY" && (p < 80 || p > 200))
    return { fake: true, reason: "JPY_RANGE" };

  if (symbol === "BTCUSD" && (p < 10000 || p > 150000))
    return { fake: true, reason: "BTC_RANGE" };

  if (symbol === "XAUUSD" && (p < 1500 || p > 3000))
    return { fake: true, reason: "GOLD_RANGE" };

  return { fake: false };
}

/* =========================
   RSI SIMULATION CLEAN
========================= */
function getRSI() {
  return 35 + Math.random() * 30;
}

/* =========================
   STRUCTURE ENGINE
========================= */
function getStructure(rsi) {
  if (rsi > 55) return "BULLISH";
  if (rsi < 45) return "BEARISH";
  return "NEUTRAL";
}

/* =========================
   MAIN ENGINE
========================= */
async function analyzeMarket(symbol, tf) {
  try {

    /* GET PRICE */
    let price = await getPrice(symbol);

    /* CHECK FAKE PRICE */
    const check = detectFakePrice(symbol, price);

    if (check.fake) {
      console.log("FAKE PRICE DETECTED:", check.reason);
      price = fallbackPrice(symbol);
    }

    /* RSI */
    const rsi = getRSI();

    /* STRUCTURE */
    const structure = getStructure(rsi);

    /* CONFIDENCE ENGINE */
    let confidence = 50;

    if (rsi > 55) confidence += 20;
    if (rsi < 45) confidence += 20;

    confidence = Math.max(10, Math.min(95, confidence));

    /* SIGNAL ENGINE */
    let signal = "WAIT";

    if (confidence >= 70) signal = "BUY";
    if (confidence <= 30) signal = "SELL";

    /* FINAL OUTPUT */
    return {
      price: Number(price.toFixed(2)),
      rsi: Number(rsi.toFixed(2)),
      structure,
      confidence: Number(confidence.toFixed(2)),
      signal,
      quality: confidence > 75 ? "HIGH" : "LOW",
      timeframe: tf || "1min"
    };

  } catch (err) {
    console.log("ENGINE CRASH:", err);

    /* NEVER BREAK FRONTEND */
    return {
      price: fallbackPrice(symbol),
      rsi: 50,
      structure: "NEUTRAL",
      confidence: 50,
      signal: "WAIT",
      quality: "LOW",
      timeframe: tf || "1min"
    };
  }
}

module.exports = { analyzeMarket };
