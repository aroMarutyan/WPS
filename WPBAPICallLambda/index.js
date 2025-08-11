import { firstCall } from './src/services/api-call.js';
import { sendResultsToTelegram } from './src/services/telegram-bot.js';
import { getSearches, updateSearchData } from './src/services/crud.js';

export const handler = async () => {

  const searches = (await getSearches()).filter(search => search.active);

  for await (const search of searches) {
    const results = await firstCall(search);
    await handleResults(search, results);
  }

  finalizeLambda();
};

async function handleResults(search, results) {
  const newestResults = results.length ? getNewestResults(results, search.latestOfferId, search.lastModified) : [];
  
  if (newestResults.length >= 1) {
    await updateSearchData(search.searchId, newestResults[0]);
    await sendResultsToTelegram(newestResults);
  }
}

function getNewestResults(items, newestOfferId, lastModified) {
  const newestOfferIndex = items.findIndex(item => item?.id === newestOfferId);

  if(newestOfferIndex === -1) return [items[0]];

  const newestResults = items
    .sort((a, b) => b.modified_at - a.modified_at)
    .filter(item => item.modified_at >= lastModified)
    .slice(0, newestOfferIndex);

  // small precaution
  const precautionResults = newestResults.length > 5 ? newestResults.slice(5) : newestResults;

  return precautionResults !== [] ? precautionResults : [];
}

function finalizeLambda() {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: true })
  };
}