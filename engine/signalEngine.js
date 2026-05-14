function getSignalEngine(data, rsi, emaFast, emaSlow) {

let signal = "WAIT";

/* ================= MARKET CONTEXT ================= */
const trendUp = emaFast > emaSlow;
const trendDown = emaFast < emaSlow;

/* ================= STRUCTURE (BOS / CHoCH) ================= */
const recentHigh = Math.max(...data.slice(-10));
const recentLow = Math.min(...data.slice(-10));
const prevHigh = Math.max(...data.slice(-20, -10));
const prevLow = Math.min(...data.slice(-20, -10));

const BOS = {
bullish: recentHigh > prevHigh,
bearish: recentLow < prevLow
};

const CHoCH = {
bullish: trendUp && BOS.bullish,
bearish: trendDown && BOS.bearish
};

/* ================= SUPPORT / RESISTANCE ================= */
const support = Math.min(...data.slice(-30));
const resistance = Math.max(...data.slice(-30));

/* ================= LIQUIDITY SWEEP ================= */
const liquidity = {
buySweep: data.at(-1) < support,
sellSweep: data.at(-1) > resistance
};

/* ================= SCORE SYSTEM ================= */
let score = 0;

/* TREND */
if (trendUp) score += 30;
if (trendDown) score -= 30;

/* RSI */
if (rsi < 30) score += 25;
if (rsi > 70) score -= 25;

/* STRUCTURE */
if (BOS.bullish) score += 25;
if (BOS.bearish) score -= 25;

if (CHoCH.bullish) score += 35;
if (CHoCH.bearish) score -= 35;

/* LIQUIDITY */
if (liquidity.buySweep) score += 30;
if (liquidity.sellSweep) score -= 30;

/* MOMENTUM */
const momentum = data.at(-1) - data.at(Math.max(0, data.length - 3));
if (momentum > 0) score += 10;
if (momentum < 0) score -= 10;

/* RANGE BOOST */
if (rsi >= 40 && rsi <= 60) score += 10;

/* ================= FINAL DECISION ================= */
if (Math.abs(score) < 15) {
signal = "WAIT";
} else {
if (score >= 55) signal = "BUY";
if (score <= -55) signal = "SELL";
}

/* ================= FORCE MODE ================= */
if (signal === "WAIT") {
if (trendUp) signal = "BUY";
else if (trendDown) signal = "SELL";
}

return {
signal,
score,
BOS,
CHoCH,
support,
resistance,
liquidity
};

}

module.exports = getSignalEngine;
