const express = require("express");
const cors = require("cors");
const { analyzeMarket } = require("./moteur/engine");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/signal", async (req, res) => {

  const symbol = req.query.symbol;
  const tf = req.query.tf || "1min";

  const result = await analyzeMarket(symbol, tf);

  res.json(result);
});

app.listen(3000, () => {
  console.log("🚀 SNIPER AI RUNNING ON PORT 3000");
});
