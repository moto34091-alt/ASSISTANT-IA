const fetch = require("node-fetch");

async function getCandles(symbol, interval = "1min") {

  const clean = symbol
    .replace(" OTC", "")
    .replace("/", "");

  const url =
`https://api.twelvedata.com/time_series?symbol=${clean}&interval=${interval}&outputsize=5&apikey=${process.env.TWELVE_API_KEY}`;

  console.log("➡️ URL:", url);

  const res = await fetch(url);
  const data = await res.json();

  console.log("🔥 FULL RESPONSE:", JSON.stringify(data, null, 2));

  return [];
}

module.exports = { getCandles };
