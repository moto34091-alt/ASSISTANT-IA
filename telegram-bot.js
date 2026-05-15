const { Telegraf } = require("telegraf");
require("dotenv").config();

/* ================= BOT INIT ================= */
const bot = new Telegraf(process.env.BOT_TOKEN);

/* ================= SAFETY FIX (RAILWAY) ================= */
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

/* ================= START COMMAND ================= */
bot.start((ctx) => {
ctx.reply("🚀 SNIPER WEB APP READY", {
reply_markup: {
inline_keyboard: [
[
{
text: "📊 OUVRIR WEB APP",
web_app: {
url: "https://binanc18bot.up.railway.app/"
}
}
]
]
}
});
});

/* ================= APP COMMAND ================= */
bot.command("app", (ctx) => {
ctx.reply("🚀 ACCÈS WEB APP", {
reply_markup: {
inline_keyboard: [
[
{
text: "OPEN TRADING APP",
web_app: {
url: "https://binanc18bot.up.railway.app/"
}
}
]
]
}
});
});

/* ================= ERROR HANDLING ================= */
bot.catch((err, ctx) => {
console.log("❌ BOT ERROR:", err);
});

/* ================= LAUNCH SAFE ================= */
bot.launch()
.then(() => {
console.log("🚀 BOT STARTED SUCCESSFULLY");
})
.catch(err => {
console.log("❌ BOT FAILED TO START:", err);
});
