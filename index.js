const express = require("express");
const cors = require("cors");
const path = require("path");

const { analyzeMarket } = require("./moteur/engine");

const app = express();

app.use(cors());
app.use(express.json());

/* SERVE HTML */
app.use(express.static(path.join(__dirname, "public")));

/* API SIGNAL */
app.get("/signal", async (req, res) => {

  try {

    const symbol = req.query.symbol;
    const tf = req.query.tf || "1min";

    const result = await analyzeMarket(symbol, tf);

    res.json(result);

  } catch(err){

    console.log(err);

    res.json({
      signal:"ERROR",
      confidence:0
    });
  }
});

/* FORCE INDEX.HTML */
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* PORT */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 SERVER RUNNING ON", PORT);
});
