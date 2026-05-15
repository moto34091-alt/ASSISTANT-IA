const { RSI, EMA } = require("./indicators");

const {
detectBOS,
detectLiquidity,
detectCHOCH
} = require("./smartmoney");

function analyzeMarket(data){

const price = data.at(-1);

const rsi = RSI(data);

const emaFast = EMA(data.slice(-30), 9);
const emaSlow = EMA(data.slice(-30), 21);

const trend =
emaFast > emaSlow
? "BULLISH"
: emaFast < emaSlow
? "BEARISH"
: "SIDEWAYS";

/* SMART MONEY */
const BOS = detectBOS(data);

const liquidity = detectLiquidity(data);

const CHoCH = detectCHOCH(trend, BOS);

/* SCORE */
let score = 0;

if(emaFast > emaSlow) score += 30;
if(emaFast < emaSlow) score -= 30;

if(rsi < 30) score += 25;
if(rsi > 70) score -= 25;

if(BOS.bullish) score += 20;
if(BOS.bearish) score -= 20;

if(CHoCH.bullish) score += 30;
if(CHoCH.bearish) score -= 30;

if(liquidity.buySweep) score += 20;
if(liquidity.sellSweep) score -= 20;

/* MOMENTUM */
const momentum = price - data.at(data.length - 3);

if(momentum > 0) score += 10;
if(momentum < 0) score -= 10;

/* SIGNAL */
let signal = "WAIT";

if(score >= 55) signal = "BUY";
if(score <= -55) signal = "SELL";

if(Math.abs(score) < 20){

signal =
trend === "BULLISH"
? "BUY"
: trend === "BEARISH"
? "SELL"
: "WAIT";

}

return {

signal,
price,
rsi:Number(rsi.toFixed(2)),
trend,
score,
strength:Math.min(100, Math.abs(score)),

BOS,
CHoCH,

support: liquidity.support,
resistance: liquidity.resistance,

liquidity

};

}

module.exports = {
analyzeMarket
};
