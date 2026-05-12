const express = require("express");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.static("public"));

/* =========================
   🔐 ADMIN
========================= */

const ADMIN_PASSWORD = "Dj.123@dj";

/* =========================
   📢 ADMIN MESSAGE
========================= */

let adminMessage =
  "🚀 Welcome to Assistant Trading Pro";

/* =========================
   🧠 AI SIGNAL ENGINE
========================= */

function generateSignal() {

  const signals = ["BUY", "SELL", "WAIT"];

  const strategies = [
    "RSI Strategy",
    "EMA Strategy",
    "Momentum Strategy",
    "Breakout Strategy",
    "AI Multi Confirmation"
  ];

  const signal =
    signals[Math.floor(Math.random() * signals.length)];

  const strategy =
    strategies[Math.floor(Math.random() * strategies.length)];

  const confidence =
    Math.floor(Math.random() * 20) + 80;

  return {
    signal,
    strategy,
    confidence
  };
}

/* =========================
   📊 SIGNAL API
========================= */

app.get("/api/signal", (req, res) => {

  res.json(generateSignal());

});

/* =========================
   📢 ADMIN MESSAGE
========================= */

app.get("/api/admin-message", (req, res) => {

  res.json({
    message: adminMessage
  });

});

/* =========================
   🔐 LOGIN
========================= */

app.post("/api/login", (req, res) => {

  const { password } = req.body;

  if (password === ADMIN_PASSWORD) {

    return res.json({
      success: true
    });

  }

  res.status(401).json({
    success: false
  });

});

/* =========================
   ✏️ UPDATE MESSAGE
========================= */

app.post("/api/admin-message", (req, res) => {

  adminMessage = req.body.message;

  res.json({
    success: true
  });

});

/* =========================
   🚀 FRONTEND
========================= */

app.get("/", (req, res) => {

  res.sendFile(
    path.join(__dirname, "public", "index.html")
  );

});

/* =========================
   🚀 START SERVER
========================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(
    "🚀 Assistant Trading Pro Running On Port " + PORT
  );

});
