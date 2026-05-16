function RSI(closes, period = 14) {

  let gain = 0;
  let loss = 0;

  for (let i = 1; i < period; i++) {
    let diff = closes[i] - closes[i - 1];

    if (diff > 0) gain += diff;
    else loss -= diff;
  }

  let rs = gain / (loss || 1);
  return 100 - (100 / (1 + rs));
}

function momentum(closes) {
  return closes[closes.length - 1] - closes[0];
}

function MACD(closes) {

  const EMA = (data, period) => {
    let k = 2 / (period + 1);
    let ema = data[0];

    for (let i = 1; i < data.length; i++) {
      ema = data[i] * k + ema * (1 - k);
    }

    return ema;
  };

  let macdLine = EMA(closes, 12) - EMA(closes, 26);
  let signal = EMA(closes, 9);

  return {
    macdLine,
    signalLine: signal,
    bullish: macdLine > signal
  };
}

module.exports = { RSI, momentum, MACD };
