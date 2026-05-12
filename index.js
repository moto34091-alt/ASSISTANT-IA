const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");

const app = express();

/* =========================
   CONFIG
========================= */

const PORT = process.env.PORT || 3000;
const JWT_SECRET = "TRADING_AI_SECRET_2026";

/* =========================
   MIDDLEWARE
========================= */

app.use(express.json());
app.use(cookieParser());

app.use(express.static(path.join(__dirname, "public")));

/* =========================
   MONGODB CONNECT
========================= */

mongoose.connect(
"mongodb://mongo:ScUwShceXYQTtHsRjJQwTyYVZWTTMtVM@yamabiko.proxy.rlwy.net:23435"
)

.then(() => {
  console.log("✅ MongoDB Connected");
})

.catch((err) => {
  console.log("❌ Mongo Error:", err);
});

/* =========================
   MODELS
========================= */

const Admin = mongoose.model("Admin", {

  username:String,
  password:String

});

const Settings = mongoose.model("Settings", {

  adminMessage:{
    type:String,
    default:"🚀 Welcome AI Trading Bot"
  },

  mode:{
    type:String,
    default:"SAFE"
  }

});

/* =========================
   CREATE DEFAULT ADMIN
========================= */

async function createAdmin(){

  const exist = await Admin.findOne({
    username:"admin"
  });

  if(!exist){

    const hash = bcrypt.hashSync(
      "Dj.123@dj",
      10
    );

    await Admin.create({

      username:"admin",
      password:hash

    });

    console.log("✅ Default admin created");

  }

}

createAdmin();

/* =========================
   JWT AUTH
========================= */

function auth(req,res,next){

  const token = req.cookies.token;

  if(!token){

    return res.status(401).json({
      error:"No token"
    });

  }

  try{

    req.user = jwt.verify(
      token,
      JWT_SECRET
    );

    next();

  }catch(err){

    return res.status(401).json({
      error:"Invalid token"
    });

  }

}

/* =========================
   LOGIN
========================= */

app.post("/api/login", async (req,res)=>{

  const { username, password } = req.body;

  const admin = await Admin.findOne({
    username
  });

  if(!admin){

    return res.status(401).json({
      error:"Admin not found"
    });

  }

  const valid = bcrypt.compareSync(
    password,
    admin.password
  );

  if(!valid){

    return res.status(401).json({
      error:"Wrong password"
    });

  }

  const token = jwt.sign({

      id:admin._id,
      username:admin.username

    },

    JWT_SECRET,

    {
      expiresIn:"2h"
    }

  );

  res.cookie("token", token, {

    httpOnly:true

  });

  res.json({
    success:true
  });

});

/* =========================
   SETTINGS GET
========================= */

app.get("/api/settings", async (req,res)=>{

  let settings = await Settings.findOne();

  if(!settings){

    settings = await Settings.create({});
  }

  res.json(settings);

});

/* =========================
   SETTINGS UPDATE
========================= */

app.post("/api/settings", auth, async (req,res)=>{

  let settings = await Settings.findOne();

  if(!settings){

    settings = new Settings();
  }

  settings.adminMessage =
    req.body.adminMessage;

  settings.mode =
    req.body.mode;

  await settings.save();

  res.json({

    success:true,
    settings

  });

});

/* =========================
   AI SIGNAL API
========================= */

app.get("/api/signal",(req,res)=>{

  const signals = [
    "BUY",
    "SELL",
    "WAIT"
  ];

  const strategies = [

    "Momentum",
    "Breakout",
    "Scalping",
    "Trend Following"

  ];

  const signal =
    signals[
      Math.floor(
        Math.random()*signals.length
      )
    ];

  const strategy =
    strategies[
      Math.floor(
        Math.random()*strategies.length
      )
    ];

  const confidence =
    Math.floor(
      Math.random()*35+65
    );

  res.json({

    signal,
    strategy,
    confidence,
    timestamp:Date.now()

  });

});

/* =========================
   FRONTEND
========================= */

app.get("/",(req,res)=>{

  res.sendFile(

    path.join(
      __dirname,
      "public",
      "index.html"
    )

  );

});

/* =========================
   START SERVER
========================= */

app.listen(PORT,()=>{

  console.log(
    "🚀 Server running on port "+PORT
  );

});
