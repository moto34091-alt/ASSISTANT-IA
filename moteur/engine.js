const { getCandles, getPrice } = require("./data");
const { RSI, MACD, momentum, EMA } = require("./indicators");
const { wick, patterns, isDoji } = require("./priceAction");
const { marketQuality, adjust } = require("./marketFilter");

async function analyzeMarket(symbol, tf = "1min") {

  const candles = await getCandles(symbol, tf);
  const price = await getPrice(symbol);

  // NO DATA
  if (!candles || candles.length < 20) {

    return {
      signal: "WAIT",
      confidence: 0,
      rsi: 50,
      macd: false,
      quality: "LOW",
      price
    };
  }

  // CLOSES
  const closes = candles.map(c => c.close);

  // INDICATORS
  const rsi = RSI(closes);

  const macd = MACD(closes);

  const mom = momentum(closes);

  // LAST CANDLE
  const last = candles[candles.length - 1];

  // WICKS
  const w = wick(last);

  // PATTERNS
  const p = patterns(
    candles[candles.length - 3],
    candles[candles.length - 2],
    last
  );

  // EMA TREND
  const ema20 = EMA(closes, 20);

  const ema50 = EMA(closes, 50);

  // SCORES
  let buy = 0;
  let sell = 0;

  /* RSI */

  if (rsi <= 35) buy++;

  if (rsi >= 65) sell++;

  /* MACD */

  if (macd.bullish) {
    buy += 2;
  } else {
    sell += 2;
  }

  /* MOMENTUM */

  if (mom > 0) {
    buy++;
  } else {
    sell++;
  }

  /* WICKS */

  if (w.lower > w.upper * 1.5) {
    buy++;
  }

  if (w.upper > w.lower * 1.5) {
    sell++;
  }

  /* PATTERNS */

  if (p.morningStar || w.hammer) {
    buy += 2;
  }

  if (p.eveningStar || w.star) {
    sell += 2;
  }

  /* EMA */

  if (ema20 > ema50) {
    buy += 2;
  }

  if (ema20 < ema50) {
    sell += 2;
  }

  /* DOJI FILTER */

  if (isDoji(last)) {

    return {
      signal: "WAIT",
      confidence: 0,
      rsi: Math.round(rsi),
      macd: macd.bullish,
      quality: "LOW",
      price
    };
  }

  /* MARKET QUALITY */

  const quality = marketQuality(symbol);

  buy = adjust(buy, quality);

  sell = adjust(sell, quality);

  /* SIGNAL */

  let signal = "WAIT";

  // ANTI FAKE FILTER
  if (
    Math.abs(buy - sell) <= 1
  ) {

    signal = "WAIT";

  } else {

    if (buy >= 5 && buy > sell) {
      signal = "BUY";
    }

    else if (sell >= 5 && sell > buy) {
      signal = "SELL";
    }

  }

  /* CONFIDENCE */

  let score = Math.max(buy, sell);

  let confidence = 55 + (score * 5);

  // LIMIT
  if (confidence > 88) {
    confidence = 88;
  }

  // WAIT CONFIDENCE
  if(signal === "WAIT"){
    confidence = 0;
  }

  return {

    symbol,

    signal,

    confidence: Math.round(confidence),

    rsi: Math.round(rsi),

    macd: macd.bullish,

    quality,

    price

  };
}

module.exports = {
  analyzeMarket
};
