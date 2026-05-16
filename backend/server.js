const express = require("express");
const cors = require("cors");
const { analyze } = require("./engine");

const app = express();
app.use(cors());

app.get("/signal", async (req, res) => {

  const symbol = req.query.symbol;
  const tf = req.query.tf || "1min";

  const data = await analyze(symbol, tf);

  res.json(data);
});

app.listen(3000, () => {
  console.log("SNIPER AI SERVER RUNNING");
});
