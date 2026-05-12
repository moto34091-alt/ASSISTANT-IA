const express = require("express");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");

const app = express();

/* =========================
   CONFIG
========================= */

const PORT = process.env.PORT || 3000;

const JWT_SECRET = "SUPER_SECRET_KEY_2026";

/* =========================
   MIDDLEWARE
========================= */

app.use(express.json());
app.use(cookieParser());

app.use(express.static(path.join(__dirname, "public")));

/* =========================
   MONGODB
========================= */

mongoose.connect("MONGODB_URL_HERE")
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.log(err));

/* =========================
   ADMIN MODEL
========================= */

const AdminSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: String
});

const Admin = mongoose.model("Admin", AdminSchema);

/* =========================
   SETTINGS MODEL
========================= */

const SettingsSchema = new mongoose.Schema({

  adminMessage:{
    type:String,
    default:"🚀 Welcome to AI Trading Pro"
  },

  mode:{
    type:String,
    default:"SAFE"
  }

});

const Settings = mongoose.model("Settings", SettingsSchema);

/* =========================
   CREATE DEFAULT ADMIN
========================= */

async function createDefaultAdmin(){

  const exists = await Admin.findOne({
    username:"admin"
  });

  if(!exists){

    const hashed = bcrypt.hashSync(
      "Dj.123@dj",
      10
    );

    await Admin.create({
      username:"admin",
      password:hashed,
      role:"superadmin"
    });

    console.log("✅ Default admin created");
  }
}

createDefaultAdmin();

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

    const decoded = jwt.verify(
      token,
      JWT_SECRET
    );

    req.user = decoded;

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

app.post("/api/admin/login", async (req,res)=>{

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
      username:admin.username,
      role:admin.role

    },

    JWT_SECRET,

    {
      expiresIn:"2h"
    }

  );

  res.cookie("token", token, {

    httpOnly:true,
    secure:false,
    sameSite:"lax"

  });

  res.json({
    success:true,
    username:admin.username,
    role:admin.role
  });

});

/* =========================
   LOGOUT
========================= */

app.post("/api/admin/logout",(req,res)=>{

  res.clearCookie("token");

  res.json({
    success:true
  });

});

/* =========================
   CHECK AUTH
========================= */

app.get("/api/admin/me", auth, (req,res)=>{

  res.json({
    user:req.user
  });

});

/* =========================
   GET SETTINGS
========================= */

app.get("/api/admin/settings", async (req,res)=>{

  let settings = await Settings.findOne();

  if(!settings){

    settings = await Settings.create({});
  }

  res.json(settings);

});

/* =========================
   UPDATE SETTINGS
========================= */

app.post("/api/admin/settings", auth, async (req,res)=>{

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
   SIGNAL API
========================= */

app.get("/api/signal",(req,res)=>{

  const signals = [
    "BUY",
    "SELL",
    "WAIT"
  ];

  const signal =
    signals[
      Math.floor(
        Math.random()*signals.length
      )
    ];

  const confidence =
    Math.floor(
      Math.random()*30+70
    );

  res.json({

    signal,
    confidence,
    timestamp:Date.now()

  });

});

/* =========================
   FRONTEND
========================= */

app.get("*",(req,res)=>{

  res.sendFile(
    path.join(__dirname,"public","index.html")
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
