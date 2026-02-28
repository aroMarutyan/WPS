import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@aws-sdk/client-dynamodb', () => {
  const send = vi.fn();
  const DynamoDBClient = vi.fn(function () {
    return { send };
  });
  const ScanCommand = vi.fn(function (input) {
    return { input };
  });
  const UpdateItemCommand = vi.fn(function (input) {
    return { input };
  });

  return {
    DynamoDBClient,
    ScanCommand,
    UpdateItemCommand,
    __mocks: { send }
  };
});

vi.mock('@aws-sdk/util-dynamodb', () => ({
  unmarshall: vi.fn(item => ({ ...item, unmarshalled: true })),
  marshall: vi.fn(item => item)
}));

describe('db-crud-service', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.TABLE_NAME = 'searches-table';
  });

  it('scans searches and unmarshalls returned items', async () => {
    const { __mocks, ScanCommand } = await import('@aws-sdk/client-dynamodb');
    const { unmarshall } = await import('@aws-sdk/util-dynamodb');
    const { getSearches } = await import('./db-crud.service.js');

    __mocks.send.mockResolvedValue({
      Items: [{ searchId: 'a' }, { searchId: 'b' }]
    });

    const searches = await getSearches();

    expect(ScanCommand).toHaveBeenCalledWith({
      TableName: 'searches-table',
      ConsistentRead: true
    });
    expect(unmarshall).toHaveBeenCalledTimes(2);
    expect(searches).toEqual([
      { searchId: 'a', unmarshalled: true },
      { searchId: 'b', unmarshalled: true }
    ]);
  });

  it('updates newest offer field with remapped offer data', async () => {
    const { __mocks, UpdateItemCommand } = await import('@aws-sdk/client-dynamodb');
    const { marshall } = await import('@aws-sdk/util-dynamodb');
    const { updateSearchData } = await import('./db-crud.service.js');

    const newestResult = {
      id: 'offer-1',
      web_slug: 'my-offer',
      title: 'Road Bike',
      description: 'Great condition',
      modified_at: 123,
      images: [{ urls: { small: '', medium: 'medium-image', big: 'big-image' } }],
      price: { amount: 200 },
      location: { city: 'Barcelona', region: 'Catalonia' },
      shipping: { user_allows_shipping: true }
    };

    await updateSearchData('search-1', newestResult);

    expect(marshall).toHaveBeenCalledWith({ searchId: 'search-1' });
    expect(marshall).toHaveBeenCalledWith({
      ':VAL': {
        imageUrl: 'medium-image',
        title: 'Road Bike',
        price: 200,
        description: 'Great condition',
        location: { city: 'Barcelona', region: 'Catalonia' },
        shipping: true,
        link: 'https://es.wallapop.com/item/my-offer',
        offerId: 'offer-1',
        modified: 123
      }
    });
    expect(UpdateItemCommand).toHaveBeenCalledTimes(1);
    expect(__mocks.send).toHaveBeenCalledTimes(1);
  });
});
