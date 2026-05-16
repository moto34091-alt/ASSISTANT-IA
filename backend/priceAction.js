function wick(candle) {

  let body = Math.abs(candle.close - candle.open);
  let upper = candle.high - Math.max(candle.open, candle.close);
  let lower = Math.min(candle.open, candle.close) - candle.low;

  return {
    upper,
    lower,
    hammer: lower > body * 2,
    star: upper > body * 2
  };
}

function patterns(c1, c2, c3) {

  let morning =
    c1.close < c1.open &&
    c2.close < c1.close &&
    c3.close > c2.open;

  let evening =
    c1.close > c1.open &&
    c2.close > c1.close &&
    c3.close < c2.open;

  return {
    morningStar: morning,
    eveningStar: evening
  };
}

module.exports = { wick, patterns };
