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

    if (!result || result.price == null) {
      return res.json({
        price: null,
        rsi: null,
        structure: "NO_DATA",
        confidence: 0,
        signal: "NO_DATA",
        quality: "LOW",
        timeframe: tf
      });
    }

    return res.json(result);

  } catch (err) {
    console.log("SIGNAL ERROR:", err);

    return res.json({
      price: null,
      rsi: null,
      structure: "ERROR",
      confidence: 0,
      signal: "ERROR",
      quality: "LOW",
      timeframe: "1min"
    });
  }
});

/* FRONT */
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* START */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 SERVER RUNNING ON PORT", PORT);
});
