const fetch = require("node-fetch");

async function getCandles(symbol, interval = "1min") {

  return [
    { open:1, high:2, low:0.5, close:1.5 },
    { open:1.5, high:2.2, low:1.2, close:2 },
    { open:2, high:2.5, low:1.8, close:2.3 }
  ];
}

module.exports = { getCandles };
