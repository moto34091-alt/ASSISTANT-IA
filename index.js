const express = require("express");
const cors = require("cors");
const path = require("path");

const { analyzeMarket } = require("./moteur/engine");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* SIGNAL API */
app.get("/signal", async (req, res) => {
  try {
    const symbol = req.query.symbol || "EURUSD";
    const tf = req.query.tf || "1min";

    const result = await analyzeMarket(symbol, tf);

    return res.json(result);

  } catch (err) {
    console.log("API ERROR:", err);

    return res.json({
      price: 1,
      rsi: 50,
      structure: "NEUTRAL",
      confidence: 50,
      signal: "WAIT",
      quality: "LOW",
      timeframe: "1min"
    });
  }
});

/* FRONTEND */
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* START SERVER */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 SERVER RUNNING ON PORT", PORT);
});
