const { getCandles } = require("./data");
const { RSI, MACD, momentum, EMA } = require("./indicators");
const { wick, patterns, isDoji } = require("./priceAction");
const { marketQuality, adjust } = require("./marketFilter");

function tfSignal(candles){

  if(!candles || candles.length < 10){
    return "WAIT";
  }

  const closes = candles.map(c => c.close);

  const last = closes[closes.length - 1];
  const prev = closes[closes.length - 2];

  if(last > prev) return "BUY";
  if(last < prev) return "SELL";

  return "WAIT";
}

async function analyzeMarket(symbol, tf = "1min") {

  const candles = await getCandles(symbol, tf);

  if(!candles || candles.length < 20){
    return { signal: "WAIT", confidence: 0, rsi: 50, macd: false, quality: "LOW" };
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

  // EMA FILTER
  const ema20 = EMA(closes, 20);
  const ema50 = EMA(closes, 50);

  const trendBuy = ema20 > ema50;
  const trendSell = ema20 < ema50;

  // MULTI TIMEFRAME
  const c1 = await getCandles(symbol, "1min");
  const c5 = await getCandles(symbol, "5min");
  const c15 = await getCandles(symbol, "15min");

  let s1 = tfSignal(c1);
  let s5 = tfSignal(c5);
  let s15 = tfSignal(c15);

  let mtfBuy = 0;
  let mtfSell = 0;

  if(s1 === "BUY") mtfBuy++;
  if(s5 === "BUY") mtfBuy++;
  if(s15 === "BUY") mtfBuy++;

  if(s1 === "SELL") mtfSell++;
  if(s5 === "SELL") mtfSell++;
  if(s15 === "SELL") mtfSell++;

  const quality = marketQuality(symbol);

  let buy = 0;
  let sell = 0;

  // RSI
  if(rsi <= 40) buy++;
  if(rsi >= 60) sell++;

  // MACD
  if(macd.bullish) buy++;
  else sell++;

  // MOMENTUM
  if(mom > 0) buy++;
  else sell++;

  // WICK
  if(w.lower > w.upper) buy++;
  if(w.upper > w.lower) sell++;

  // PATTERNS
  if(p.morningStar || w.hammer) buy++;
  if(p.eveningStar || w.star) sell++;

  // DOJI FILTER
  if(isDoji(last)) {
    return {
      signal: "WAIT",
      confidence: 0,
      rsi,
      macd: macd.bullish,
      quality
    };
  }

  // TREND EMA
  if(trendBuy) buy++;
  if(trendSell) sell++;

  // MULTI TF BOOST
  buy += mtfBuy;
  sell += mtfSell;

  buy = adjust(buy, quality);
  sell = adjust(sell, quality);

  let signal = "WAIT";

  if(buy >= 4 && buy > sell){
    signal = "BUY";
  }
  else if(sell >= 4 && sell > buy){
    signal = "SELL";
  }

  let confidence = 50 + Math.max(buy, sell) * 10;
  if(confidence > 95) confidence = 95;

  return {
    symbol,
    signal,
    confidence: Math.round(confidence),
    rsi: Math.round(rsi),
    macd: macd.bullish,
    quality
  };
}

module.exports = { analyzeMarket };
