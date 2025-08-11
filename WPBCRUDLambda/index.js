import { botResponse } from './src/services/telegram-bot.js';
import { listSearches, createNewSearch, updateSearch, deleteSearch } from './src/services/crud.js';

export const handler = async (event) => {
  const text = JSON.parse(event.body).message.text;
  switch (true) {
    case text.startsWith('/ls'):
      await listSearches(text);
      break;

    case text.startsWith('/ns'):
      await createNewSearch(text);
      break;

    case text.startsWith('/us'):
      await updateSearch(text);
      break;

    case text.startsWith('/ds'):
      await deleteSearch(text);
      break;

    case text.startsWith('/help'):
      await botResponse(helpText());
      break;

    default:
      await botResponse('Command unrecognized. Type /help to get an overview of available commands');
  }
  finalizeLambda();
};

function helpText() {
  const intro = 'Placeholder text is in ALL CAPS\nActual commands are in camelCase\nEvery input should be followed by a new line, unless specified otherwise\n';
  const listSearches = 'To check all searches, input:\nREQUIRED: /ls\nOPTIONAL: activeOnly\n';
  const allowedConditions = 'OPTIONAL: CONDITION - separate condtions with comma\nfollowing conditions allowed:\nas_good_as_new, new\ngood, fair\nhas_given_it_all, all';
  const createSerach = `To create new search, input:\nREQUIRED: /ns\nREQUIRED: SEARCH ALIAS\nREQUIRED: SEARCH TERM\nOPTIONAL: MINIMUM PRICE\nOPTIONAL: MAXIMUM SALE PRICE\n${allowedConditions}\n`;
  const paramsToUpdate = 'Param names to update: active, alias, condition, minSalePrice, maxSalePrice, searchTerm.\nCondition should be updated in the same manner as when creating a new search!';
  const updateSearch = `To update a search, input:\nREQUIRED: /us\nREQUIRED: SEARCH ID\nREQUIRED: PARAM TO CHANGE\nREQUIRED: NEW VALUE - dont put anything if you want to remove the param\nParams can be updated one at a time\n${paramsToUpdate}\n`;

  const deleteSearch = 'To delete search, input:\nREQUIRED: /ds\nREQUIRED: SEARCH ID\n';

  return `${intro}\n${listSearches}\n${createSerach}\n${updateSearch}\n${deleteSearch}`;
}

function finalizeLambda() {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: true })
  };
}

