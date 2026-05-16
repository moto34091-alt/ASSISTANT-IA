function RSI(closes){

  try {

    if(!closes || closes.length < 14){
      return 50;
    }

    let gains = 0;
    let losses = 0;

    for(let i = 1; i < 14; i++){

      const diff = closes[i] - closes[i - 1];

      if(diff >= 0){
        gains += diff;
      } else {
        losses += Math.abs(diff);
      }
    }

    if(losses === 0) return 100;

    const rs = gains / losses;

    return 100 - (100 / (1 + rs));

  } catch(err){
    return 50;
  }
}

function momentum(closes){

  if(!closes || closes.length < 2){
    return 0;
  }

  return closes[closes.length - 1] - closes[0];
}

function EMA(data, period){

  if(!data || data.length === 0) return 0;

  let k = 2 / (period + 1);
  let ema = data[0];

  for(let i = 1; i < data.length; i++){
    ema = data[i] * k + ema * (1 - k);
  }

  return ema;
}

function MACD(closes){

  try {

    if(!closes || closes.length < 26){
      return { bullish: false };
    }

    const ema12 = EMA(closes, 12);
    const ema26 = EMA(closes, 26);

    return {
      bullish: ema12 > ema26
    };

  } catch(err){
    return { bullish: false };
  }
}

module.exports = {
  RSI,
  momentum,
  MACD,
  EMA
};
