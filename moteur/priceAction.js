function wick(c){

  const body = Math.abs(c.close - c.open);

  const upper = c.high - Math.max(c.open, c.close);
  const lower = Math.min(c.open, c.close) - c.low;

  return {
    upper,
    lower,
    hammer: lower > body * 2,
    star: upper > body * 2
  };
}

function patterns(c1, c2, c3){

  const morningStar =
    c1.close < c1.open &&
    c3.close > c3.open;

  const eveningStar =
    c1.close > c1.open &&
    c3.close < c3.open;

  return {
    morningStar,
    eveningStar
  };
}

// NEW: DOJI
function isDoji(c){

  const body = Math.abs(c.close - c.open);
  const range = c.high - c.low;

  return body < range * 0.1;
}

module.exports = {
  wick,
  patterns,
  isDoji
};
