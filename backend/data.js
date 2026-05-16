const fetch = require("node-fetch");
const { TWELVE_API_KEY } = require("./config");

async function getCandles(symbol, interval = "1min") {

  const url =
`https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${interval}&outputsize=50&apikey=${TWELVE_API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data.values) return [];

  return data.values.map(c => ({
    open: +c.open,
    high: +c.high,
    low: +c.low,
    close: +c.close
  }));
}

module.exports = { getCandles };
