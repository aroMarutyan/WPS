export const SEARCH_URL = new URL('https://api.wallapop.com/api/v3/search');
export const HEADERS = new Headers();

// // Barcelona
// SEARCH_URL.searchParams.append('longitude', '2.1699187');
// SEARCH_URL.searchParams.append('latitude', '41.387917');
// // Required params
// // SEARCH_URL.searchParams.append('source', 'search_box');
// SEARCH_URL.searchParams.append('source', 'side_bar_filters');
// SEARCH_URL.searchParams.append('order_by', 'newest');

// Required headers - no results without it!
HEADERS.append('X-DeviceOS', '0');
// Optional
HEADERS.append('Host', 'api.wallapop.com');
HEADERS.append('Origin', 'https://es.wallapop.com');
HEADERS.append('Referer', 'https://es.wallapop.com/');
HEADERS.append('sec-ch-ua', '"Google Chrome";v="132", "Chromium";v="131", "Not_A Brand";v="24"');
HEADERS.append('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');