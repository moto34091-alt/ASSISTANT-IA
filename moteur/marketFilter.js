function marketQuality(symbol){

  const HIGH = [
    "EURUSD",
    "GBPUSD",
    "USDJPY",
    "USDCAD",
    "USDCHF",
    "BTCUSD",
    "ETHUSD",
    "XAUUSD",
    "AUDUSD",
    "EURJPY"
  ];

  let clean = symbol
    .replace(" OTC", "")
    .replace(/\//g, "")
    .replace(/\s/g, "")
    .toUpperCase();

  if(HIGH.includes(clean)){
    return "HIGH";
  }

  return "LOW";
}

function adjust(score, quality){

  if(quality === "HIGH"){
    return score + 1;
  }

  return score;
}

module.exports = {
  marketQuality,
  adjust
};
