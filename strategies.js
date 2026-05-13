function calculateScore(data) {
  let score = 50;

  if (data.emaFast > data.emaSlow) score += 20;
  if (data.emaFast < data.emaSlow) score -= 20;

  if (data.rsi < 35) score += 15;
  if (data.rsi > 65) score -= 15;

  if (data.momentum > 0) score += 10;
  if (data.momentum < 0) score -= 10;

  if (data.pattern === "HAMMER") score += 20;
  if (data.pattern === "MORNING_STAR") score += 30;
  if (data.pattern === "BULLISH_ENGULFING") score += 25;

  if (data.pattern === "EVENING_STAR") score -= 30;
  if (data.pattern === "BEARISH_ENGULFING") score -= 25;

  if (
    data.support &&
    data.price <= data.support * 1.002
  ) {
    score += 20;
  }

  if (
    data.resistance &&
    data.price >= data.resistance * 0.998
  ) {
    score -= 20;
  }

  if (data.currentVolume > data.avgVolume * 1.5) {
    score += 15;
  }

  score = Math.max(0, Math.min(100, score));

  return score;
}

module.exports = { calculateScore };
