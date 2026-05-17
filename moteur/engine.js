const { getPrice } = require("./data");

function RSI() {
  return 35 + Math.random() * 30;
}

function analyzeStructure(rsi) {
  if (rsi > 55) return "BULLISH";
  if (rsi < 45) return "BEARISH";
  return "NEUTRAL";
}

async function analyzeMarket(symbol, tf) {
  try {
    const price = await getPrice(symbol);
    const rsi = RSI();

    let confidence = 50;

    if (rsi > 55) confidence += 20;
    if (rsi < 45) confidence += 20;

    confidence = Math.max(10, Math.min(95, confidence));

    let signal = "WAIT";
    if (confidence >= 70) signal = "BUY";
    if (confidence <= 30) signal = "SELL";

    return {
      price: Number(price.toFixed(2)),
      rsi: Number(rsi.toFixed(2)),
      structure: analyzeStructure(rsi),
      confidence: Number(confidence.toFixed(2)),
      signal,
      quality: confidence > 75 ? "HIGH" : "LOW",
      timeframe: tf || "1min"
    };

  } catch (err) {
    console.log("ENGINE ERROR:", err);

    return {
      price: 1,
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
