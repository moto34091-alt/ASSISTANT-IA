const { Telegraf, Markup } = require("telegraf");

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

bot.start((ctx) => {
ctx.reply(
"🚀 SNIPER PRO v7 LIVE",
Markup.inlineKeyboard([
Markup.button.webApp(
"📊 SDT&interval=1m&limit=5"
)
])
);
});

bot.launch();
console.log("🤖 Telegram Bot RUNNING");
