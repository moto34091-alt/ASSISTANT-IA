function detectPatterns(candles) {
  const last = candles.at(-1);
  const prev = candles.at(-2);

  const body = Math.abs(last.close - last.open);
  const lowerWick = Math.min(last.open, last.close) - last.low;
  const upperWick = last.high - Math.max(last.open, last.close);

  if (lowerWick > body * 2 && upperWick < body) {
    return "HAMMER";
  }

  if (
    prev.close < prev.open &&
    last.close > last.open &&
    last.open < prev.close &&
    last.close > prev.open
  ) {
    return "BULLISH_ENGULFING";
  }

  if (
    prev.close > prev.open &&
    last.close < last.open &&
    last.open > prev.close &&
    last.close < prev.open
  ) {
    return "BEARISH_ENGULFING";
  }

  return "NONE";
}

module.exports = { detectPatterns };
