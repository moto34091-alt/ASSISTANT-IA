const { RSI, momentum, MACD } = require("./indicators");
const { wick, patterns } = require("./priceAction");
const { marketQuality, adjust } = require("./marketFilter");
const { getCandles } = require("./data");

async function analyze(symbol, tf = "1min") {

  let candles = await getCandles(symbol, tf);
  if (candles.length < 20) return { signal: "WAIT" };

  let closes = candles.map(c => c.close);

  let rsi = RSI(closes);
  let mom = momentum(closes);
  let macd = MACD(closes);

  let w = wick(candles[candles.length - 1]);
  let p = patterns(candles[0], candles[1], candles[2]);

  let quality = marketQuality(symbol);

  let buy = 0, sell = 0;

  // RSI
  if (rsi < 30) buy++;
  if (rsi > 70) sell++;

  // Momentum
  if (mom > 0) buy++;
  else sell++;

  // MACD
  if (macd.bullish) buy++;
  else sell++;

  // Patterns
  if (p.morningStar || w.hammer) buy++;
  if (p.eveningStar) sell++;

  // Wicks
  if (w.lower > w.upper) buy++;
  if (w.upper > w.lower) sell++;

  buy = adjust(buy, quality);
  sell = adjust(sell, quality);

  let signal = "WAIT";

  if (buy >= 4 && buy > sell) signal = "BUY";
  else if (sell >= 4 && sell > buy) signal = "SELL";

  let confidence = 50 + Math.max(buy, sell) * 8;

  if (confidence > 95) confidence = 95;

  return {
    symbol,
    signal,
    confidence,
    rsi,
    macd: macd.bullish,
    quality
  };
}

module.exports = { analyze };
