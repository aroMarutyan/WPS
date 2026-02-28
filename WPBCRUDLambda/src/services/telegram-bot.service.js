import TelegramBot from 'node-telegram-bot-api';

const BOT = new TelegramBot(process.env.TOKEN);
const CHAT_ID = process.env.CHAT_ID;

export async function botResponse(text) {
  await BOT.sendMessage(CHAT_ID, text);
}

export async function botResponseHTML(text) {
  await BOT.sendMessage(CHAT_ID, text, { parse_mode: 'HTML'});
}

export function buildTelegramResponse(alias, item) {
  const location = `${item.location.city} ${item.location.region}`;

  return `<a href='${item.imageUrl}'> </a> \n<b>SEARCH ALIAS:</b> ${alias} \n<b>TITLE:</b> ${item.title} \n<b>PRICE:</b> ${item.price} \n<b>DESC:</b> ${item.description} \n<b>LOCATION:</b> ${location} \n<b>SHIPPING:</b> ${item.shipping} \n<b>LINK:</b> <a href='${item.link}'>CLICK</a>`;
}
// Run only when updating commands
// try {
//   await BOT.setMyCommands([
//     { command: 'ls', description: '📋 List all searches' },
//     { command: 'gl', description: '📋 Show latest result(s)' },
//     { command: 'ns', description: '➕ Create a new search' },
//     { command: 'us', description: '✏️ Update a search' },
//     { command: 'ds', description: '🗑️ Delete a search' },
//     { command: 'help', description: '❓ Show help' },
//   ]);
//   console.log('Bot commands registered successfully.');
// } catch (err) {
//   console.error('Error setting bot commands:', err);
// }
