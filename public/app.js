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

/* petit délai UX */
setTimeout(async ()=>{

const res = await fetch(`/api/${symbol}/${time}`);
const d = await res.json();

/* signal color */
let color = "orange";
if(d.signal === "BUY") color = "green";
if(d.signal === "SELL") color = "red";

document.getElementById("signal").innerHTML =
`SIGNAL: <span class="${color}">${d.signal}</span>`;

document.getElementById("price").innerText =
"PRICE: " + d.price;

document.getElementById("rsi").innerText =
"RSI: " + d.rsi;

document.getElementById("trend").innerText =
"TREND: " + d.trend;

document.getElementById("strength").innerText =
"STRENGTH: " + (d.strength || 0);

show("s4");

}, 12000);
}

function reset(){
show("s1");
}
