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

const symbol = req.query.symbol || "EURUSD";
const tf = req.query.tf || "1min";

const result = await analyzeMarket(symbol, tf);

/* SAFETY CHECK */
if (!result) {
return res.json({
price: null,
rsi: 50,
structure: "NEUTRAL",
confidence: 0,
signal: "WAIT",
quality: "LOW",
timeframe: tf
});
}

/* CLEAN RESPONSE */
return res.json({
price: result.price ?? null,
rsi: result.rsi ?? 50,
structure: result.structure ?? "NEUTRAL",
confidence: result.confidence ?? 0,
signal: result.signal ?? "WAIT",
quality: result.quality ?? "LOW",
timeframe: result.timeframe ?? tf
});

} catch (err) {

console.log("SIGNAL ERROR:", err);

return res.json({
price: null,
rsi: 50,
structure: "NEUTRAL",
confidence: 0,
signal: "WAIT",
quality: "LOW",
timeframe: "1min"
});

}

});

/* FRONTEND ROUTE */
app.get("*", (req, res) => {
res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* PORT */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
console.log("🚀 SERVER RUNNING ON", PORT);
});
