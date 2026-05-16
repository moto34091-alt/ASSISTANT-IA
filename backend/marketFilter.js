function marketQuality(symbol) {

  const HIGH = [
    "EUR/USD","GBP/USD","USD/JPY","USD/CHF",
    "EUR/JPY","GBP/JPY","XAU/USD"
  ];

  const MEDIUM = [
    "EUR/GBP","AUD/USD","USD/CAD","NZD/USD"
  ];

  if (HIGH.includes(symbol)) return "HIGH";
  if (MEDIUM.includes(symbol)) return "MEDIUM";
  return "LOW";
}

function adjust(score, quality) {

  if (quality === "HIGH") return score * 1.1;
  if (quality === "MEDIUM") return score * 1.0;
  return score * 0.8;
}

module.exports = { marketQuality, adjust };
