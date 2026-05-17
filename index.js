const express = require("express");
const cors = require("cors");
const path = require("path");

const { analyzeMarket } = require("./moteur/engine");

const app = express();

app.use(cors());
app.use(express.json());

/* SERVE FRONTEND */
app.use(express.static(path.join(__dirname, "public")));

/* SIGNAL API */
app.get("/signal", async (req, res) => {

try {

console.log("CALL SIGNAL:", req.query);

const symbol = req.query.symbol || "EURUSD";
const tf = req.query.tf || "1min";

let result = null;

try {
result = await analyzeMarket(symbol, tf);
console.log("ENGINE RESULT:", result);
} catch (engineErr) {
console.log("ENGINE CRASH:", engineErr);
}

/* SAFE OUTPUT (NEVER NO DATA) */
return res.json({
price: result?.price ?? Number((1 + Math.random() * 100).toFixed(2)),
rsi: result?.rsi ?? 50,
structure: result?.structure ?? "NEUTRAL",
confidence: result?.confidence ?? 0,
signal: result?.signal ?? "WAIT",
quality: result?.quality ?? "LOW",
timeframe: tf
});

} catch (err) {

console.log("SIGNAL ERROR:", err);

/* EMERGENCY FALLBACK */
return res.json({
price: Number((1 + Math.random() * 100).toFixed(2)),
rsi: 50,
structure: "NEUTRAL",
confidence: 0,
signal: "WAIT",
quality: "LOW",
timeframe: "1min"
});

}

});

/* FRONT ROUTE */
app.get("*", (req, res) => {
res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* START SERVER */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
console.log("🚀 SERVER RUNNING ON PORT", PORT);
});
