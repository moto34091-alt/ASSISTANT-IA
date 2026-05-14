let symbol = "";
let time = "";

function show(id){
document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
document.getElementById(id).classList.add("active");
}

function setSymbol(s){
symbol = s;
show("s2");
}

function setTime(t){
time = t;
run();
}

async function run(){

show("s3");

setTimeout(async ()=>{

const res = await fetch(`/api/${symbol}/${time}`);
const d = await res.json();

let color = "orange";
if(d.signal==="BUY") color="green";
if(d.signal==="SELL") color="red";

document.getElementById("signal").innerHTML =
`SIGNAL: <span class="${color}">${d.signal}</span>`;

document.getElementById("price").innerText =
"PRICE: " + (d.price ?? 0);

document.getElementById("rsi").innerText =
"RSI: " + (d.rsi ?? 50);

document.getElementById("trend").innerText =
"TREND: " + (d.trend || "NO DATA");

document.getElementById("strength").innerText =
"STRENGTH: " + (d.strength ?? 0);

show("s4");

},10000);
}

function reset(){
show("s1");
}
