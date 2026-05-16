const { getCandles } = require("./data");
const { RSI, MACD, momentum } = require("./indicators");
const { wick, patterns } = require("./priceAction");
const { marketQuality, adjust } = require("./marketFilter");

async function analyzeMarket(symbol, tf = "1min") {

  try {

    const candles = await getCandles(symbol, tf);

    console.log("📊 CANDLES =", candles.length);

    // ⚡ MODE FLEXIBLE (important)
    if (!candles || candles.length < 5) {
      return {
        signal: "WAIT",
        confidence: 0,
        reason: "NO_DATA"
      };
    }

    const closes = candles.map(c => Number(c.close));

    const rsi = RSI(closes);
    const macd = MACD(closes);
    const mom = momentum(closes);

    const last = candles[candles.length - 1];

    const w = wick(last);

    const p = patterns(
      candles[candles.length - 3] || last,
      candles[candles.length - 2] || last,
      last
    );

    const quality = marketQuality(symbol);

    let buy = 0;
    let sell = 0;

    // RSI (plus flexible)
    if (rsi <= 40) buy++;
    if (rsi >= 60) sell++;

    // MACD
    if (macd.bullish) buy++;
    else sell++;

    // momentum
    if (mom > 0) buy++;
    else sell++;

    // wick analysis
    if (w.lower > w.upper) buy++;
    if (w.upper > w.lower) sell++;

    // patterns
    if (p.morningStar) buy++;
    if (p.eveningStar) sell++;

    // adjust market quality
    buy = adjust(buy, quality);
    sell = adjust(sell, quality);

    // ⚡ SIGNAL ENGINE (moins strict)
    let signal = "WAIT";

    if (buy >= 3 && buy > sell) {
      signal = "BUY";
    } 
    else if (sell >= 3 && sell > buy) {
      signal = "SELL";
    }
    else if (buy === sell && buy >= 2) {
      signal = Math.random() > 0.5 ? "BUY" : "SELL";
    }

    let confidence = 50 + Math.max(buy, sell) * 10;

    if (confidence > 95) confidence = 95;

    return {
      symbol,
      signal,
      confidence: Math.round(confidence),
      rsi: Math.round(rsi),
      macd: macd.bullish,
      quality,
      buy,
      sell
    };

  } catch (err) {

    console.log("ENGINE ERROR:", err.message);

    return {
      signal: "WAIT",
      confidence: 0,
      error: err.message
    };
  }
}

module.exports = { analyzeMarket };
