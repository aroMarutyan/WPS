import { beforeEach, describe, expect, it, vi } from 'vitest';

const CHAT_ID = 'chat-555';

vi.mock('@aws-sdk/client-dynamodb', () => {
  const send = vi.fn();

  return {
    DynamoDBClient: vi.fn(function () {
      return { send };
    }),
    ScanCommand: vi.fn(function (input) {
      return { type: 'scan', input };
    }),
    PutItemCommand: vi.fn(function (input) {
      return { type: 'put', input };
    }),
    UpdateItemCommand: vi.fn(function (input) {
      return { type: 'update', input };
    }),
    DeleteItemCommand: vi.fn(function (input) {
      return { type: 'delete', input };
    }),
    GetItemCommand: vi.fn(function (input) {
      return { type: 'get', input };
    }),
    __mocks: { send }
  };
}, { virtual: true });

vi.mock('@aws-sdk/util-dynamodb', () => ({
  marshall: vi.fn(input => input),
  unmarshall: vi.fn(item => item)
}), { virtual: true });

vi.mock('../../../src/services/telegram-bot.service.js', () => ({
  botResponse: vi.fn(),
  botResponseHTML: vi.fn(),
  buildTelegramResponse: vi.fn((alias) => `<b>${alias}</b>`)
}));

vi.mock('../../../src/services/format.service.js', () => ({
  formatConditions: vi.fn(() => new Set(['new'])),
  formatSearchToHTML: vi.fn(() => '<b>search</b>')
}));

vi.mock('../../../src/services/search-handler.service.js', () => ({
  getTableName: vi.fn(() => ({ TableName: 'table-name' })),
  getSearchParams: vi.fn((searchId, chatId) => ({ TableName: 'table-name', Key: { searchId, chatId } })),
  handleNewValue: vi.fn((_key, value) => value ?? ''),
  getIdNum: vi.fn(() => '777'),
  handleNumericInput: vi.fn((value) => value ?? ''),
  validateSearch: vi.fn(),
  validateNumericParam: vi.fn((value) => value),
  validateParamCount: vi.fn()
}));

describe('db-crud.service', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('lists active searches only and returns no-results message when none are active', async () => {
    const { __mocks } = await import('@aws-sdk/client-dynamodb');
    const { botResponse, botResponseHTML } = await import('../../../src/services/telegram-bot.service.js');
    const { listSearches } = await import('../../../src/services/db-crud.service.js');

    __mocks.send.mockResolvedValue({
      Items: [{ active: false, chatId: CHAT_ID }]
    });

    await listSearches('/ls\nactiveOnly', CHAT_ID);

    expect(botResponse).toHaveBeenCalledWith(CHAT_ID, 'No active searches found');
    expect(botResponseHTML).not.toHaveBeenCalled();
  });

  it('only shows searches belonging to the requesting chat id', async () => {
    const { __mocks } = await import('@aws-sdk/client-dynamodb');
    const { formatSearchToHTML } = await import('../../../src/services/format.service.js');
    const { listSearches } = await import('../../../src/services/db-crud.service.js');

    const mine = { active: true, alias: 'mine', chatId: CHAT_ID };
    const other = { active: true, alias: 'other', chatId: 'someone-elses-chat' };

    __mocks.send.mockResolvedValue({ Items: [mine, other] });

    await listSearches('/ls', CHAT_ID);

    expect(formatSearchToHTML).toHaveBeenCalledTimes(1);
    expect(formatSearchToHTML).toHaveBeenCalledWith(mine);
  });

  it('fetches newest results for a specific search id', async () => {
    const { __mocks } = await import('@aws-sdk/client-dynamodb');
    const { botResponseHTML, buildTelegramResponse } = await import('../../../src/services/telegram-bot.service.js');
    const { validateNumericParam } = await import('../../../src/services/search-handler.service.js');
    const { getNewestResults } = await import('../../../src/services/db-crud.service.js');

    __mocks.send.mockResolvedValueOnce({
      Item: { alias: 'city-bike', newestOffer: { id: 'offer-1' } }
    });

    await getNewestResults('/gl\n44', CHAT_ID);

    expect(validateNumericParam).toHaveBeenCalledWith('44', 'searchId');
    expect(buildTelegramResponse).toHaveBeenCalledWith('city-bike', { id: 'offer-1' });
    expect(botResponseHTML).toHaveBeenCalledWith(CHAT_ID, '<b>city-bike</b>');
  });

  it('creates a search scoped to the chat id and sends confirmation with created search details', async () => {
    const { __mocks, PutItemCommand } = await import('@aws-sdk/client-dynamodb');
    const { marshall } = await import('@aws-sdk/util-dynamodb');
    const { botResponse, botResponseHTML } = await import('../../../src/services/telegram-bot.service.js');
    const { createNewSearch } = await import('../../../src/services/db-crud.service.js');

    __mocks.send
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        Item: {
          alias: 'new search',
          searchId: '777',
          chatId: CHAT_ID,
          searchTerm: 'bike',
          condition: new Set(['new']),
          active: true
        }
      });

    await createNewSearch('/ns\nnew search\nbike\n10\n20\n30\nnew', CHAT_ID);

    expect(PutItemCommand).toHaveBeenCalledTimes(1);
    expect(marshall).toHaveBeenCalledWith(expect.objectContaining({ alias: 'new search', searchId: '777', chatId: CHAT_ID }));
    expect(botResponse).toHaveBeenCalledWith(CHAT_ID, 'Search successfully added');
    expect(botResponseHTML).toHaveBeenCalledWith(CHAT_ID, '<b>search</b>');
  });

  it('updates a search and sends the updated payload', async () => {
    const { __mocks, UpdateItemCommand } = await import('@aws-sdk/client-dynamodb');
    const { marshall } = await import('@aws-sdk/util-dynamodb');
    const { botResponse, botResponseHTML } = await import('../../../src/services/telegram-bot.service.js');
    const { updateSearch } = await import('../../../src/services/db-crud.service.js');

    __mocks.send
      .mockResolvedValueOnce({ Items: [{ searchId: '44', chatId: CHAT_ID }] })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        Item: { alias: 'edited', searchId: '44', chatId: CHAT_ID, searchTerm: 'bike', condition: new Set(['new']), active: true }
      });

    await updateSearch('/us\n44\nalias\nedited', CHAT_ID);

    expect(UpdateItemCommand).toHaveBeenCalledTimes(1);
    expect(UpdateItemCommand).toHaveBeenCalledWith(expect.objectContaining({ Key: { searchId: '44', chatId: CHAT_ID } }));
    expect(marshall).toHaveBeenCalledWith({ ':VAL': 'edited' });
    expect(botResponse).toHaveBeenCalledWith(CHAT_ID, 'search successfully updated');
    expect(botResponseHTML).toHaveBeenCalledWith(CHAT_ID, '<b>search</b>');
  });

  it('deletes a search after validation and confirms deletion', async () => {
    const { __mocks, DeleteItemCommand } = await import('@aws-sdk/client-dynamodb');
    const { botResponse } = await import('../../../src/services/telegram-bot.service.js');
    const { validateSearch } = await import('../../../src/services/search-handler.service.js');
    const { deleteSearch } = await import('../../../src/services/db-crud.service.js');

    __mocks.send.mockResolvedValueOnce({ Items: [{ searchId: '88', chatId: CHAT_ID }] }).mockResolvedValueOnce({});

    await deleteSearch('/ds\n88', CHAT_ID);

    expect(validateSearch).toHaveBeenCalledWith('88', [{ searchId: '88', chatId: CHAT_ID }]);
    expect(DeleteItemCommand).toHaveBeenCalledTimes(1);
    expect(DeleteItemCommand).toHaveBeenCalledWith(expect.objectContaining({ Key: { searchId: '88', chatId: CHAT_ID } }));
    expect(botResponse).toHaveBeenCalledWith(CHAT_ID, 'Search successfully deleted');
  });

  it('sends error response when listing searches fails', async () => {
    const { __mocks } = await import('@aws-sdk/client-dynamodb');
    const { botResponse } = await import('../../../src/services/telegram-bot.service.js');
    const { listSearches } = await import('../../../src/services/db-crud.service.js');

    __mocks.send.mockRejectedValue(new Error('ddb down'));

    await listSearches('/ls', CHAT_ID);

    expect(botResponse).toHaveBeenCalledWith(CHAT_ID, expect.stringContaining('Error getting the list of searches'));
  });

  it('lists all searches when activeOnly is not specified', async () => {
    const { __mocks } = await import('@aws-sdk/client-dynamodb');
    const { botResponseHTML } = await import('../../../src/services/telegram-bot.service.js');
    const { formatSearchToHTML } = await import('../../../src/services/format.service.js');
    const { listSearches } = await import('../../../src/services/db-crud.service.js');

    __mocks.send.mockResolvedValue({
      Items: [{ active: true, alias: 's1', chatId: CHAT_ID }, { active: false, alias: 's2', chatId: CHAT_ID }]
    });

    await listSearches('/ls', CHAT_ID);

    expect(botResponseHTML).toHaveBeenCalledTimes(2);
    expect(formatSearchToHTML).toHaveBeenCalledTimes(2);
  });

  it('sends error response when creating a search fails', async () => {
    const { __mocks } = await import('@aws-sdk/client-dynamodb');
    const { botResponse } = await import('../../../src/services/telegram-bot.service.js');
    const { createNewSearch } = await import('../../../src/services/db-crud.service.js');

    __mocks.send.mockRejectedValue(new Error('put failed'));

    await createNewSearch('/ns\nalias\nterm', CHAT_ID);

    expect(botResponse).toHaveBeenCalledWith(CHAT_ID, expect.stringContaining('Error adding new search'));
  });

  it('sends error response when updating a search fails', async () => {
    const { __mocks } = await import('@aws-sdk/client-dynamodb');
    const { botResponse } = await import('../../../src/services/telegram-bot.service.js');
    const { updateSearch } = await import('../../../src/services/db-crud.service.js');

    __mocks.send
      .mockResolvedValueOnce({ Items: [{ searchId: '44', chatId: CHAT_ID }] })
      .mockRejectedValueOnce(new Error('update failed'));

    await updateSearch('/us\n44\nalias\nnew-name', CHAT_ID);

    expect(botResponse).toHaveBeenCalledWith(CHAT_ID, expect.stringContaining('Error updating search'));
  });

  it('sends error response when deleting a search fails', async () => {
    const { __mocks } = await import('@aws-sdk/client-dynamodb');
    const { botResponse } = await import('../../../src/services/telegram-bot.service.js');
    const { deleteSearch } = await import('../../../src/services/db-crud.service.js');

    __mocks.send
      .mockResolvedValueOnce({ Items: [{ searchId: '88', chatId: CHAT_ID }] })
      .mockRejectedValueOnce(new Error('delete failed'));

    await deleteSearch('/ds\n88', CHAT_ID);

    expect(botResponse).toHaveBeenCalledWith(CHAT_ID, expect.stringContaining('Error deleting search'));
  });
});
