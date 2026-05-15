function RSI(data){

if(!data || data.length < 14) return 50;

let gain = 0;
let loss = 0;

for(let i=1;i<14;i++){

const diff = data[i] - data[i-1];

if(diff > 0) gain += diff;
else loss += Math.abs(diff);

}

const rs = gain / (loss || 1);

return 100 - (100 / (1 + rs));
}

function EMA(data, period){

if(!data || data.length < period){
return data.at(-1) || 0;
}

const k = 2 / (period + 1);

let ema = data[0];

for(let i=1;i<data.length;i++){
ema = data[i] * k + ema * (1 - k);
}

return ema;
}

module.exports = {
RSI,
EMA
};
