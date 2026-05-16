const { getCandles } = require("./data");
const { RSI, MACD, momentum } = require("./indicators");
const { wick, patterns } = require("./priceAction");
const { marketQuality, adjust } = require("./marketFilter");

async function analyzeMarket(symbol, tf = "1min") {

  try {

    // récupération candles
    const candles = await getCandles(symbol, tf);

    console.log("CANDLES:", candles);

    // sécurité candles
    if (!candles || candles.length < 3) {

      return {
        signal: "WAIT",
        confidence: 0,
        rsi: 50,
        macd: false,
        quality: "LOW"
      };
    }

    // closes
    const closes = candles.map(c => Number(c.close));

    // sécurité closes
    if (!closes || closes.length < 3) {

      return {
        signal: "WAIT",
        confidence: 0,
        rsi: 50,
        macd: false,
        quality: "LOW"
      };
    }

    // indicateurs
    const rsi = RSI(closes);
    const macd = MACD(closes);
    const mom = momentum(closes);

    // dernière bougie
    const last = candles[candles.length - 1];

    // sécurité dernière bougie
    if (!last) {

      return {
        signal: "WAIT",
        confidence: 0,
        rsi: 50,
        macd: false,
        quality: "LOW"
      };
    }

    // price action
    const w = wick(last);

    const p = patterns(
      candles[candles.length - 3],
      candles[candles.length - 2],
      candles[candles.length - 1]
    );

    // qualité marché
    const quality = marketQuality(symbol);

    let buy = 0;
    let sell = 0;

    // RSI
    if (rsi < 35) buy++;
    if (rsi > 65) sell++;

    // MACD
    if (macd.bullish) buy++;
    else sell++;

    // MOMENTUM
    if (mom > 0) buy++;
    else sell++;

    // WICKS
    if (w.lower > w.upper) buy++;
    if (w.upper > w.lower) sell++;

    // PATTERNS
    if (p.morningStar || w.hammer) buy++;
    if (p.eveningStar || w.star) sell++;

    // ajustement qualité
    buy = adjust(buy, quality);
    sell = adjust(sell, quality);

    // signal final
    let signal = "WAIT";

    if (buy >= 3 && buy > sell) {
      signal = "BUY";
    }

    else if (sell >= 3 && sell > buy) {
      signal = "SELL";
    }

    // confidence
    let confidence = 50 + (Math.max(buy, sell) * 10);

    if (confidence > 95) {
      confidence = 95;
    }

    return {
      symbol,
      signal,
      confidence: Math.round(confidence),
      rsi: Math.round(rsi),
      macd: macd.bullish,
      quality
    };

  } catch (err) {

    console.log("ENGINE ERROR:", err);

    return {
      signal: "WAIT",
      confidence: 0,
      rsi: 50,
      macd: false,
      quality: "LOW"
    };
  }
}

module.exports = { analyzeMarket };
