const { Telegraf } = require("telegraf");
require("dotenv").config();

const bot = new Telegraf(process.env.BOT_TOKEN);

/* ================= START ================= */
bot.start((ctx) => {
ctx.reply("🚀 SNIPER WEB APP", {
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

/* ================= COMMAND ================= */
bot.command("app", (ctx) => {
ctx.reply("🚀 Ouvre la Web App :", {
reply_markup: {
inline_keyboard: [
[
{
text: "OPEN TRADING",
web_app: {
url: "https://binanc18bot.up.railway.app/"
}
}
]
]
}
});
});

/* ================= LAUNCH ================= */
bot.launch();

console.log("🚀 Telegram bot actif");
