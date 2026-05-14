const { Telegraf, Markup } = require("telegraf");

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

bot.start((ctx) => {
ctx.reply(
"🚀 SNIPER PRO v7 LIVE",
Markup.inlineKeyboard([
Markup.button.webApp(
"https://binanc18bot.up.railway.app/"
)
])
);
});

bot.launch();
console.log("🤖 Telegram Bot RUNNING");
