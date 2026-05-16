const express = require("express");
const cors = require("cors");

// engine trading
const { analyzeMarket } = require("./moteur/engine");

const app = express();

// MIDDLEWARE
app.use(cors());
app.use(express.json());

// DEBUG START
console.log("🚀 SNIPER AI SERVER STARTING...");

// HOME ROUTE (test serveur)
app.get("/", (req, res) => {
  res.send("SNIPER AI RUNNING ✅");
});

// SIGNAL ROUTE
app.get("/signal", async (req, res) => {
  try {

    const symbol = req.query.symbol;
    const tf = req.query.tf || "1min";

    // protection crash
    if (!symbol) {
      return res.json({
        signal: "WAIT",
        error: "NO_SYMBOL"
      });
    }

    console.log("📊 REQUEST:", symbol, tf);

    // call engine
    const result = await analyzeMarket(symbol, tf);

    // safety fallback
    if (!result) {
      return res.json({
        signal: "WAIT",
        confidence: 0
      });
    }

    res.json(result);

  } catch (err) {

    console.log("❌ ERROR:", err.message);

    res.json({
      signal: "ERROR",
      message: err.message,
      confidence: 0
    });
  }
});

// PORT FIX (IMPORTANT FOR DEPLOY)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("✅ SERVER RUNNING ON PORT:", PORT);
});
