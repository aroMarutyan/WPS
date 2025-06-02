import { BOT } from './src/telegramBot.js';
export function handler() {
  BOT.on('message', (msg) => {
      const chatId = msg.chat.id;
      const text = msg.text;

      console.log(`Received message: ${text} from chat ID: ${chatId}`);

      BOT.sendMessage(chatId, `You said: ${text}, and also I love you, Alba`);
  });
};

handler();
