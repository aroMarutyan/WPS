import { beforeEach, describe, expect, it, vi } from 'vitest';
import { firstCall } from '../../src/services/api-call.service.js';
import { ERROR_SEARCHES_ARRAY } from '../../src/services/api-call-error-handler.service.js';

const createSearch = (overrides = {}) => ({
  alias: 'mountain-bike',
  searchTerm: 'bike',
  minPrice: '50',
  maxPrice: '300',
  range: '30',
  condition: new Set(['new', 'as_good_as_new']),
  ...overrides
});

describe('firstCall', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    ERROR_SEARCHES_ARRAY.length = 0;
  });

  it('returns first page items and builds search URL with filters', async () => {
    const items = [{ id: '1' }];
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        data: { section: { payload: { items } } },
        meta: { next_page: 'next-hash' }
      })
    });

    vi.stubGlobal('fetch', fetchMock);

    const search = createSearch();
    const result = await firstCall(search);

    expect(result).toEqual(items);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const calledUrl = fetchMock.mock.calls[0][0];
    expect(calledUrl.searchParams.get('keywords')).toBe('bike');
    expect(calledUrl.searchParams.get('min_sale_price')).toBe('50');
    expect(calledUrl.searchParams.get('max_sale_price')).toBe('300');
    expect(calledUrl.searchParams.get('distance_in_km')).toBe('30');
    expect(calledUrl.searchParams.get('condition')).toBe('new,as_good_as_new');
  });

  it('follows next pages until a non-empty page is found', async () => {
    const finalItems = [{ id: 'last' }];
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          data: { section: { payload: { items: [] } } },
          meta: { next_page: 'page-1' }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          data: { section: { payload: { items: [] } } },
          meta: { next_page: 'page-2' }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          data: { section: { payload: { items: finalItems } } },
          meta: { next_page: null }
        })
      });

    vi.stubGlobal('fetch', fetchMock);

    const result = await firstCall(createSearch({ condition: new Set(['']) }));

    expect(result).toEqual(finalItems);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const nextPageCallUrl = fetchMock.mock.calls[1][0];
    expect(nextPageCallUrl.searchParams.get('next_page')).toBe('page-1');
    expect(nextPageCallUrl.searchParams.get('source')).toBe('deep_link');
  });

  it('stops searching after max next page limit is reached', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        data: { section: { payload: { items: [] } } },
        meta: { next_page: 'still-empty' }
      })
    });

    vi.stubGlobal('fetch', fetchMock);

    const result = await firstCall(createSearch({ condition: new Set(['']) }));

    expect(result).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(11);
  });

  it('records fetch and first call errors when the API call fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    vi.stubGlobal('fetch', fetchMock);

    const result = await firstCall(createSearch());

    expect(result).toEqual([]);
    expect(ERROR_SEARCHES_ARRAY).toHaveLength(2);
    expect(ERROR_SEARCHES_ARRAY[0]).toMatchObject({ alias: 'mountain-bike', errorType: 'fetch', errorCode: 500 });
    expect(ERROR_SEARCHES_ARRAY[1]).toMatchObject({ alias: 'mountain-bike', errorType: 'first call', errorCode: 'N/A' });
  });

  it('returns empty array when first page has no items and no next page', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        data: { section: { payload: { items: [] } } },
        meta: { next_page: null }
      })
    });

    vi.stubGlobal('fetch', fetchMock);

    const result = await firstCall(createSearch({ condition: new Set(['']) }));

    expect(result).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('records next page call error when a subsequent page fetch fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          data: { section: { payload: { items: [] } } },
          meta: { next_page: 'page-1' }
        })
      })
      .mockResolvedValueOnce({ ok: false, status: 429 });

    vi.stubGlobal('fetch', fetchMock);

    const result = await firstCall(createSearch({ condition: new Set(['']) }));

    expect(result).toEqual([]);
    expect(ERROR_SEARCHES_ARRAY.length).toBeGreaterThanOrEqual(1);
    const nextPageError = ERROR_SEARCHES_ARRAY.find(e => e.errorType === 'next page call');
    expect(nextPageError).toBeDefined();
    expect(nextPageError.alias).toBe('mountain-bike');
  });

  it('omits optional URL params when search has no minPrice, maxPrice, or range', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        data: { section: { payload: { items: [{ id: '1' }] } } },
        meta: { next_page: null }
      })
    });

    vi.stubGlobal('fetch', fetchMock);

    const search = createSearch({ minPrice: '', maxPrice: '', range: '', condition: new Set(['']) });
    await firstCall(search);

    const calledUrl = fetchMock.mock.calls[0][0];
    expect(calledUrl.searchParams.get('min_sale_price')).toBeNull();
    expect(calledUrl.searchParams.get('max_sale_price')).toBeNull();
    expect(calledUrl.searchParams.get('distance_in_km')).toBeNull();
    expect(calledUrl.searchParams.get('condition')).toBeNull();
  });
});
