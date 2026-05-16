function RSI(closes){

  try{

    if(!closes || closes.length < 14){
      return 50;
    }

    let gains = 0;
    let losses = 0;

    for(let i = 1; i < 14; i++){

      let diff = closes[i] - closes[i - 1];

      if(diff >= 0){
        gains += diff;
      }else{
        losses += Math.abs(diff);
      }
    }

    if(losses === 0){
      return 100;
    }

    let rs = gains / losses;

    return 100 - (100 / (1 + rs));

  }catch(err){

    console.log("RSI ERROR:", err.message);

    return 50;
  }
}

function momentum(closes){

  try{

    if(!closes || closes.length < 2){
      return 0;
    }

    return closes[closes.length - 1] - closes[0];

  }catch(err){

    console.log("MOMENTUM ERROR:", err.message);

    return 0;
  }
}

function EMA(data, period){

  if(!data || data.length === 0){
    return 0;
  }

  let k = 2 / (period + 1);

  let ema = data[0];

  for(let i = 1; i < data.length; i++){

    ema = data[i] * k + ema * (1 - k);
  }

  return ema;
}

function MACD(closes){

  try{

    if(!closes || closes.length < 26){

      return {
        bullish: false
      };
    }

    const ema12 = EMA(closes, 12);
    const ema26 = EMA(closes, 26);

    const macdValue = ema12 - ema26;

    return {
      bullish: macdValue > 0
    };

  }catch(err){

    console.log("MACD ERROR:", err.message);

    return {
      bullish: false
    };
  }
}

module.exports = {
  RSI,
  momentum,
  MACD
};
