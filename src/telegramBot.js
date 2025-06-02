import TelegramBot from 'node-telegram-bot-api';
import { TOKEN } from './config/config.js';

export const BOT = new TelegramBot(TOKEN, {polling: true});

// Matches "/echo [whatever]"
// bot.onText(/\/echo (.+)/, (msg, match) => {
//   // 'msg' is the received Message from Telegram
//   // 'match' is the result of executing the regexp above on the text content
//   // of the message
//
//   const chatId = msg.chat.id;
//   const resp = match[1]; // the captured "whatever"
//
//   // send back the matched "whatever" to the chat
//   bot.sendMessage(chatId, resp);
// });

BOT.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    console.log(`Received message: ${text} from chat ID: ${chatId}`);

    // Respond to the user
    BOT.sendMessage(chatId, `You said: ${text}, and also I love you, Alba`);
});

// Log when the bot is ready
console.log('Bot is running and waiting for messages...');
