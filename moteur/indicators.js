function RSI(closes){
  return 50;
}

function momentum(closes){
  return 1;
}

function MACD(closes){
  return {
    bullish: true
  };
}

module.exports = {
  RSI,
  momentum,
  MACD
};
