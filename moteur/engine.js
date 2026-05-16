const { getCandles, getPrice } = require("./data");
const { RSI, MACD, momentum, EMA } = require("./indicators");
const { wick, patterns, isDoji } = require("./priceAction");
const { marketQuality, adjust } = require("./marketFilter");

async function analyzeMarket(symbol, tf = "1min") {

  const candles = await getCandles(symbol, tf);
  const price = await getPrice(symbol);

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

  const closes = candles.map(c => c.close);

  const rsi = RSI(closes);
  const macd = MACD(closes);
  const mom = momentum(closes);

  const last = candles[candles.length - 1];

  const w = wick(last);

  const p = patterns(
    candles[candles.length - 3],
    candles[candles.length - 2],
    last
  );

  const ema20 = EMA(closes, 20);
  const ema50 = EMA(closes, 50);

  let buy = 0;
  let sell = 0;

  if (rsi <= 40) buy++;
  if (rsi >= 60) sell++;

  if (macd.bullish) buy++;
  else sell++;

  if (mom > 0) buy++;
  else sell++;

  if (w.lower > w.upper) buy++;
  if (w.upper > w.lower) sell++;

  if (p.morningStar || w.hammer) buy++;
  if (p.eveningStar || w.star) sell++;

  if (isDoji(last)) {
    return {
      signal: "WAIT",
      confidence: 0,
      rsi,
      macd: macd.bullish,
      quality: "LOW",
      price
    };
  }

  if (ema20 > ema50) buy++;
  if (ema20 < ema50) sell++;

  const quality = marketQuality(symbol);

  buy = adjust(buy, quality);
  sell = adjust(sell, quality);

  let signal = "WAIT";

  if (buy >= 4 && buy > sell) signal = "BUY";
  else if (sell >= 4 && sell > buy) signal = "SELL";

  let confidence = 50 + Math.max(buy, sell) * 10;
  if (confidence > 95) confidence = 95;

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

module.exports = { analyzeMarket };
