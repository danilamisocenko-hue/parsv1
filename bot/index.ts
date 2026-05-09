import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';

dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || '');

bot.start((ctx) => {
  ctx.reply('Парсер Бот запущен! Используйте команду /help для списка команд.');
});

bot.help((ctx) => {
  ctx.reply('Доступные команды:\n/status - проверить состояние задач\n/balance - ваш баланс');
});

bot.command('status', (ctx) => {
  ctx.reply('Задачи в работе: 2\nЗавершено сегодня: 15');
});

bot.command('balance', (ctx) => {
  ctx.reply('Ваш баланс: $1,240.00');
});

if (process.env.TELEGRAM_BOT_TOKEN) {
  bot.launch().then(() => {
    console.log('Telegram Bot started');
  });
} else {
  console.log('TELEGRAM_BOT_TOKEN not found, bot not started');
}

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
