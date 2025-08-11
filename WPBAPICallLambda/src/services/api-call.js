import { SEARCH_URL, HEADERS } from '../config/url-config.js';
import { botResponse } from './telegram-bot.js'

const MAX_NEXT_PAGE = 5;
const MAX_SENT_RESULTS = 5;

export async function firstCall(search) {
  const url = buildURL(search);
  try {
    const res = await fetchSearchResults(url);
    const items = res.data.section.payload.items;
    const nextPage = res.meta.next_page;
    
    if (items.length >= 1) {
      return items;
    } else if (nextPage !== null) {
      return (await callNextPage(nextPage));
    } else {
      return [];
    }
  } catch(e) {
    console.log('CALL FAILED', e);
    botResponse(`FETCHING SEARCH DATA FAILED FOR SEARCH ${search.alias}`);
    return [];
  }
}

async function callNextPage(nextPage, counter = 0) {
  if (counter >= MAX_NEXT_PAGE) {
    return [];
  }

  let url = new URL(SEARCH_URL);

  url.searchParams.append('next_page', nextPage);
  url.searchParams.append('source', 'deep_link');

  const res = await fetchSearchResults(url);
  const items = res.data.section.payload.items;
  const nextPageHash = res.meta.next_page;

  if (items.length >= 1 || nextPageHash === null) {
    return items; 
  } else {
    return callNextPage(nextPageHash, ++counter);
  } 
}

async function fetchSearchResults(url) {
  return await (await fetch(url, { headers: HEADERS })).json();
}

function buildURL(search) {
  const url = new URL(SEARCH_URL);
  // Barcelona
  url.searchParams.append('longitude', '2.1699187');
  url.searchParams.append('latitude', '41.387917');
  
  url.searchParams.append('source', 'side_bar_filters');
  url.searchParams.append('order_by', 'newest');
  url.searchParams.append('keywords', search.searchTerm);

  search.minSalePrice && url.searchParams.append('min_sale_price', search.minSalePrice);
  search.maxSalePrice && url.searchParams.append('max_sale_price', search.maxSalePrice);

  const conditionsArray = Array.from(search.condition);

  if (conditionsArray[0] !== '') {
    const conditions = conditionsArray.join(',');
    url.searchParams.append('condition', conditions);
  }

  return url;
}
