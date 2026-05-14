function formatResponse({
symbol,
interval,
signal,
price,
rsi,
trend,
score,
BOS,
CHoCH,
support,
resistance,
liquidity
}) {

return {
symbol,
interval,

signal,
price,
rsi,
trend,
score,

BOS,
CHoCH,
support,
resistance,
liquidity
};

}

module.exports = formatResponse;
