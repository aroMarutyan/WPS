export const SEARCH_URL = new URL('https://api.wallapop.com/api/v3/search');
export const HEADERS = new Headers();

// Telegram bot
export const USERNNAME = 'rhodesianBushBot';
export const TOKEN = '7502719650:AAH1zVnTMqXZwAt49yOLbj1VuL1nlZDyE2g';
export const CHAT_ID = '5772079179';

SEARCH_URL.searchParams.append('source', 'search_box');
SEARCH_URL.searchParams.append('keywords', 'rtx 4090');
// Barcelona
SEARCH_URL.searchParams.append('longitude', '2.1699187');
SEARCH_URL.searchParams.append('latitude', '41.387917');

SEARCH_URL.searchParams.append('order_by', 'newest');
// SEARCH_URL.searchParams.append('min_sale_price', '3000');
// SEARCH_URL.searchParams.append('max_sale_price', '3000');
// SEARCH_URL.searchParams.append('distance_in_km', '3000');

// Required - no results without it!
HEADERS.append('X-DeviceOS', '0');
// Optional
HEADERS.append('Host', 'api.wallapop.com');
HEADERS.append('Origin', 'https://es.wallapop.com');
HEADERS.append('Referer', 'https://es.wallapop.com/');
HEADERS.append('sec-ch-ua', '"Google Chrome";v="132", "Chromium";v="131", "Not_A Brand";v="24"');
HEADERS.append('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');


