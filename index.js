const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");

const app = express();

const PORT = process.env.PORT || 3000;
const JWT_SECRET = "TRADING_AI_SECRET";

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

/* ================= DB ================= */
mongoose.connect(process.env.MONGO_URL)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

/* ================= MODELS ================= */
const Admin = mongoose.model("Admin", {
  username: String,
  password: String
});

const Settings = mongoose.model("Settings", {
  adminMessage: String,
  mode: String
});

/* ================= DEFAULT ADMIN ================= */
(async () => {
  const exist = await Admin.findOne({ username: "admin" });

  if (!exist) {
    const hash = bcrypt.hashSync("Dj.123@dj", 10);

    await Admin.create({
      username: "admin",
      password: hash
    });

    console.log("Admin created");
  }
})();

/* ================= LOGIN ================= */
app.post("/api/login", async (req, res) => {

  const { username, password } = req.body;

  const admin = await Admin.findOne({ username });

  if (!admin) return res.status(401).json({ error: "Not found" });

  const ok = bcrypt.compareSync(password, admin.password);

  if (!ok) return res.status(401).json({ error: "Wrong password" });

  const token = jwt.sign({ id: admin._id }, JWT_SECRET);

  res.cookie("token", token);

  res.json({ success: true });
});

/* ================= AUTH ================= */
function auth(req, res, next) {

  const token = req.cookies.token;

  if (!token) return res.status(401).json({ error: "No token" });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }

}

/* ================= SETTINGS ================= */
app.get("/api/settings", async (req, res) => {

  let data = await Settings.findOne();

  if (!data) data = await Settings.create({
    adminMessage: "Welcome",
    mode: "SAFE"
  });

  res.json(data);
});

app.post("/api/settings", auth, async (req, res) => {

  let data = await Settings.findOne();

  data.adminMessage = req.body.adminMessage;
  data.mode = req.body.mode;

  await data.save();

  res.json({ success: true });
});

/* ================= SIGNAL ================= */
app.get("/api/signal", (req, res) => {

  const signals = ["BUY", "SELL", "WAIT"];

  res.json({
    signal: signals[Math.floor(Math.random() * signals.length)],
    confidence: Math.floor(Math.random() * 40 + 60)
  });

});

/* ================= FRONT ================= */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ================= START ================= */
app.listen(PORT, () => {
  console.log("Server running");
});
