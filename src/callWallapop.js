import fs from 'node:fs';

import { SEARCH_URL, HEADERS, CHAT_ID } from './config/config.js';
import { BOT } from './telegramBot.js';

async function makeTheCall() {
  let response;

  try {
    response = await fetch(SEARCH_URL, { headers: HEADERS })
      .then(data => data.json());
  } catch(err) {
    console.error('FETCH ERROR:', err);
  }

  const latestItem = response.data.section.payload.items[0];
  const isNew = isNewEntry(latestItem);


  !isNew && botSendMsg(formatResponse(latestItem));
  isNew && writeData(latestItem);
  setTimeout(() => makeTheCall(), 10000);
}

function formatResponse(latestItem) {
  return JSON.stringify(latestItem, undefined, 3);
}


function writeData(data) {
    fs.writeFile('./src/data.json', formatResponse(data), err => {
      if (err) {
        console.error('WRITE ERROR:', err);
      } else {
        console.log('FILE WRITTEN SUCCESSFULLY!');
      }
    });
}

function botSendMsg(data) {
  BOT.sendMessage(CHAT_ID, data);
}

function isNewEntry(latestItem) {
  let isNew;

  fs.readFile('./src/data.json', 'utf8', (err, data) => {
    isNew = latestItem.id === JSON.parse(data).id;
    console.log('IS NEW', isNew);
  });
  return isNew;
}

makeTheCall();
