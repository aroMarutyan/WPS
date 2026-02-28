import { SEARCH_URL, HEADERS } from '../config/url-config.js';
import { ERROR_SEARCHES_ARRAY, createErrorSearchEntry } from './api-call-error-handler.service.js';

const MAX_NEXT_PAGE = 10;

export async function firstCall(search) {
  const url = buildURL(search);
  try {
    const res = await fetchSearchResults(url, search.alias);
    const items = res.data.section.payload.items;
    const nextPageHash = res.meta.next_page;
    
    if (items.length >= 1) {
      return items;
    } else if (nextPageHash !== null) {
      return (await callNextPage(nextPageHash, search.alias));
    } else {
      return [];
    }
  } catch(e) {
    console.log('First call failed', e);
    const errorEntry = createErrorSearchEntry(search.alias, 'first call');
    ERROR_SEARCHES_ARRAY.push(errorEntry);
    return [];
  }
}

async function callNextPage(nextPage, searchAlias, counter = 0) {
  try {
    if (counter >= MAX_NEXT_PAGE) {
      return [];
    }

    let url = new URL(SEARCH_URL);

    url.searchParams.append('next_page', nextPage);
    url.searchParams.append('source', 'deep_link');

    const res = await fetchSearchResults(url, searchAlias);
    const items = res.data.section.payload.items;
    const nextPageHash = res.meta.next_page;

    if (items.length >= 1 || nextPageHash === null) {
      return items; 
    } else {
      return callNextPage(nextPageHash, searchAlias, ++counter);
    } 
  } catch(e) {
    console.log('Next page call failed', e);
    const errorEntry = createErrorSearchEntry(searchAlias, 'next page call');
    ERROR_SEARCHES_ARRAY.push(errorEntry);
    return [];
  }
}

async function fetchSearchResults(url, searchAlias) {
  const rawResults = await fetch(url, { headers: HEADERS });
  if (rawResults.ok) {
    const jsonResults = await rawResults.json();

    return jsonResults;
  } else {
    const errorText = `Fetch call for search ${searchAlias} failed with STATUS: ${rawResults.status}`;
    console.log(errorText);
    const errorEntry = createErrorSearchEntry(searchAlias, 'fetch', rawResults.status);
    ERROR_SEARCHES_ARRAY.push(errorEntry);
    throw new Error(errorText);
  }
}

function buildURL(search) {
  const url = new URL(SEARCH_URL);
  // Barcelona
  url.searchParams.append('longitude', '2.1699187');
  url.searchParams.append('latitude', '41.387917');
  
  url.searchParams.append('source', 'side_bar_filters');
  url.searchParams.append('order_by', 'newest');
  url.searchParams.append('keywords', search.searchTerm);

  search.minPrice && url.searchParams.append('min_sale_price', search.minPrice);
  search.maxPrice && url.searchParams.append('max_sale_price', search.maxPrice);
  search.range && url.searchParams.append('distance_in_km', search.range);

  const conditionsArray = Array.from(search.condition);

  if (conditionsArray[0] !== '') {
    const conditions = conditionsArray.join(',');
    url.searchParams.append('condition', conditions);
  }

  return url;
}
