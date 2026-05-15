/* ================= FAIR VALUE GAP ================= */
function detectFVG(data){

if(data.length < 5){
return {
bullish:false,
bearish:false
};
}

const c1 = data.at(-5);
const c2 = data.at(-4);
const c3 = data.at(-3);

return {

bullish: c3 > c1 && c2 > c1,

bearish: c3 < c1 && c2 < c1

};

}

/* ================= ORDER BLOCK ================= */
function detectOrderBlock(data){

const last = data.at(-1);
const prev = data.at(-2);

return {

bullish:last > prev,
bearish:last < prev

};

}

/* ================= INSTITUTIONAL SCORE ================= */
function institutionalScore({

trend,
BOS,
CHoCH,
liquidity,
FVG,
OB,
rsi

}){

let score = 0;

/* TREND */
if(trend === "BULLISH") score += 25;
if(trend === "BEARISH") score -= 25;

/* BOS */
if(BOS.bullish) score += 20;
if(BOS.bearish) score -= 20;

/* CHOCH */
if(CHoCH.bullish) score += 30;
if(CHoCH.bearish) score -= 30;

/* LIQUIDITY */
if(liquidity.buySweep) score += 20;
if(liquidity.sellSweep) score -= 20;

/* FVG */
if(FVG.bullish) score += 15;
if(FVG.bearish) score -= 15;

/* ORDER BLOCK */
if(OB.bullish) score += 20;
if(OB.bearish) score -= 20;

/* RSI */
if(rsi < 30) score += 15;
if(rsi > 70) score -= 15;

return score;

}

module.exports = {
detectFVG,
detectOrderBlock,
institutionalScore
};
