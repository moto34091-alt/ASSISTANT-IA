function detectBOS(data){

const recentHigh = Math.max(...data.slice(-10));
const recentLow = Math.min(...data.slice(-10));

const prevHigh = Math.max(...data.slice(-20,-10));
const prevLow = Math.min(...data.slice(-20,-10));

return {
bullish: recentHigh > prevHigh,
bearish: recentLow < prevLow
};

}

function detectLiquidity(data){

const support = Math.min(...data.slice(-30));
const resistance = Math.max(...data.slice(-30));

const price = data.at(-1);

return {
support,
resistance,
buySweep: price < support,
sellSweep: price > resistance
};

}

function detectCHOCH(trend, BOS){

return {
bullish: trend === "BULLISH" && BOS.bullish,
bearish: trend === "BEARISH" && BOS.bearish
};

}

module.exports = {
detectBOS,
detectLiquidity,
detectCHOCH
};
