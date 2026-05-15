function hammer(data){
let last=data.at(-1);
let prev=data.at(-2);
return Math.abs(last-prev)>0;
}

function engulfing(data){
let a=data.at(-2);
let b=data.at(-1);
return b>a;
}

function morningStar(data){
return data.at(-3)<data.at(-2)&&data.at(-2)<data.at(-1);
}

function eveningStar(data){
return data.at(-3)>data.at(-2)&&data.at(-2)>data.at(-1);
}

/* ================= SCORE ================= */
function calculateStrength(data,rsi,emaFast,emaSlow,momentum,trend){

let score=0;

/* TREND */
if(emaFast>emaSlow)score+=25;
if(emaFast<emaSlow)score-=25;

/* RSI */
if(rsi<30)score+=20;
if(rsi>70)score-=20;

/* MOMENTUM */
if(momentum>0)score+=10;
if(momentum<0)score-=10;

/* PATTERNS */
if(hammer(data))score+=15;
if(engulfing(data))score+=20;
if(morningStar(data))score+=25;
if(eveningStar(data))score-=25;

let strength=Math.min(100,Math.abs(score));

let signal="WAIT";

if(score>=55)signal="BUY";
if(score<=-55)signal="SELL";

if(strength<60)signal="WAIT";

return{signal,strength,score};

}

module.exports={calculateStrength};
