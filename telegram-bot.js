const { Telegraf } = require("telegraf");
require("dotenv").config();

const bot = new Telegraf(process.env.BOT_TOKEN);

/* ================= START COMMAND ================= */
bot.start((ctx) => {
ctx.reply("🚀 SNIPER PRO WEB APP", {
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

/* ================= OPTIONAL COMMAND ================= */
bot.command("app", (ctx) => {
ctx.reply("Ouvre ton Web App ici 👇", {
reply_markup: {
inline_keyboard: [
[
{
text: "🚀 OPEN TRADING APP",
web_app: {
url: "https://binanc18bot.up.railway.app/"
}
}
]
]
}
});
});

/* ================= LAUNCH BOT ================= */
bot.launch();

console.log("🚀 Telegram Bot Running...");
