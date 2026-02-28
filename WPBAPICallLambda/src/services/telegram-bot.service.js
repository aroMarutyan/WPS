import TelegramBot from 'node-telegram-bot-api';

const BOT = new TelegramBot(process.env.TOKEN);
const CHAT_ID = process.env.CHAT_ID;

export async function sendResultsToTelegram(newestResults) {
  for (const result of newestResults) {
    await botResponseHTML(buildTelegramResponse(result));
    await asyncTimeout();
  }
}

export async function botResponse(text) {
  await BOT.sendMessage(CHAT_ID, text);
}

export async function botResponseHTML(text) {
  await BOT.sendMessage(CHAT_ID, text, { parse_mode: 'HTML'});
}

async function asyncTimeout() {
  return new Promise(resolve => setTimeout(resolve, 1000));
};

function buildTelegramResponse(item) {
  const itemUrl = 'https://es.wallapop.com/item/' + item.web_slug;
  const location = `${item.location.city} ${item.location.region}`;

  // check what's the deal with the images
  return `<a href='${item.images[0].urls.small || item.images[0].urls.medium || item.images[0].urls.big}'> </a> \n<b>TITLE:</b> ${item.title} \n<b>PRICE:</b> ${item.price.amount} \n<b>DESC:</b> ${item.description} \n<b>LOCATION:</b> ${location} \n<b>SHIPPING:</b> ${item.shipping.user_allows_shipping} \n<b>LINK:</b> <a href='${itemUrl}'>CLICK</a>`;
}
