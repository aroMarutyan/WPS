import TelegramBot from 'node-telegram-bot-api';

const BOT = new TelegramBot(process.env.TOKEN);
const CHAT_ID = process.env.CHAT_ID;

export async function botResponse(text) {
  await BOT.sendMessage(CHAT_ID, text);
}

export async function botResponseHTML(text) {
  await BOT.sendMessage(CHAT_ID, text, { parse_mode: 'HTML'});
}

// Run only when updating commands
// try {
//   await BOT.setMyCommands([
//     { command: 'ls', description: '📋 List all active searches' },
//     { command: 'ns', description: '➕ Create a new search' },
//     { command: 'us', description: '✏️ Update an existing search' },
//     { command: 'ds', description: '🗑️ Delete a search' },
//     { command: 'help', description: '❓ Show help' },
//   ]);
//   console.log('Bot commands registered successfully.');
// } catch (err) {
//   console.error('Error setting bot commands:', err);
// }
