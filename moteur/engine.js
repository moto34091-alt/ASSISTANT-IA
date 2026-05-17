const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const API_KEY = process.env.TWELVE_API_KEY;

/* ─────────────────────────────
   FORMAT SYMBOL
───────────────────────────── */
function formatSymbol(symbol) {
  if (!symbol) return null;

  if (symbol.length === 6) {
    return symbol.slice(0, 3) + "/" + symbol.slice(3);
  }

  if (symbol === "BTCUSD") return "BTC/USD";
  if (symbol === "ETHUSD") return "ETH/USD";
  if (symbol === "XAUUSD") return "XAU/USD";

  return symbol;
}

/* ─────────────────────────────
   GET CANDLES (REAL DATA)
───────────────────────────── */
async function getCandles(symbol) {
  try {
    const fixed = formatSymbol(symbol);

    const url =
      `https://api.twelvedata.com/time_series?symbol=${fixed}&interval=1min&outputsize=50&apikey=${API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data || data.status === "error" || !data.values) {
      console.log("API ERROR:", data);
      return null;
    }

    return data.values
      .map(c => Number(c.close))
      .filter(v => !isNaN(v))
      .reverse();

  } catch (err) {
    console.log("CANDLES ERROR:", err);
    return null;
  }
}

/* ─────────────────────────────
   RSI
───────────────────────────── */
function RSI(closes, period = 14) {
  if (!closes || closes.length < period + 1) return null;

  let gain = 0;
  let loss = 0;

  for (let i = 1; i <= period; i++) {
    let diff = closes[i] - closes[i - 1];
    if (diff > 0) gain += diff;
    else loss += Math.abs(diff);
  }

  if (loss === 0) return 100;

  let rs = gain / loss;
  return 100 - (100 / (1 + rs));
}

/* ─────────────────────────────
   MOMENTUM
───────────────────────────── */
function momentum(closes) {
  if (!closes || closes.length < 10) return 0;

  let recent = closes.slice(-5);
  let past = closes.slice(-10, -5);

  let recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  let pastAvg = past.reduce((a, b) => a + b, 0) / past.length;

  return recentAvg - pastAvg;
}

/* ─────────────────────────────
   STRUCTURE
───────────────────────────── */
function structure(rsi, mom) {
  if (rsi > 55 && mom > 0) return "BULLISH";
  if (rsi < 45 && mom < 0) return "BEARISH";
  return "NEUTRAL";
}

/* ─────────────────────────────
   SNIPER ENGINE V2
───────────────────────────── */
async function analyzeMarket(symbol, tf) {
  try {
    const candles = await getCandles(symbol);

    if (!candles) {
      return null;
    }

    const price = candles[candles.length - 1];
    const rsi = RSI(candles);
    const mom = momentum(candles);

    if (rsi == null) {
      return null;
    }

    let structureState = structure(rsi, mom);

    /* ───── SCORE SYSTEM ───── */
    let score = 50;

    if (rsi > 55) score += 20;
    if (rsi < 45) score += 20;

    if (mom > 0) score += 15;
    if (mom < 0) score += 15;

    if (structureState === "BULLISH") score += 10;
    if (structureState === "BEARISH") score += 10;

    score = Math.max(0, Math.min(100, score));

    /* ───── SIGNAL ───── */
    let signal = "WAIT";

    if (score >= 65) signal = "BUY";
    if (score <= 35) signal = "SELL";

    /* ───── QUALITY ───── */
    let quality = score > 75 ? "HIGH" : "LOW";

    return {
      price: Number(price),
      rsi: Number(rsi.toFixed(2)),
      momentum: Number(mom.toFixed(6)),
      structure: structureState,
      confidence: Number(score.toFixed(2)),
      signal,
      quality,
      timeframe: tf || "1min"
    };

  } catch (err) {
    console.log("ENGINE ERROR:", err);
    return null;
  }
}

module.exports = { analyzeMarket };
