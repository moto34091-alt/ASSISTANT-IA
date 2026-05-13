function isPivotLow(candles, i) {
  return (
    candles[i].low < candles[i - 1].low &&
    candles[i].low < candles[i + 1].low
  );
}

function isPivotHigh(candles, i) {
  return (
    candles[i].high > candles[i - 1].high &&
    candles[i].high > candles[i + 1].high
  );
}

function getSupportResistance(candles) {
  let supports = [];
  let resistances = [];

  for (let i = 1; i < candles.length - 1; i++) {
    if (isPivotLow(candles, i)) {
      supports.push(candles[i].low);
    }

    if (isPivotHigh(candles, i)) {
      resistances.push(candles[i].high);
    }
  }

  return {
    support: supports.at(-1) || null,
    resistance: resistances.at(-1) || null,
  };
}

module.exports = { getSupportResistance };
