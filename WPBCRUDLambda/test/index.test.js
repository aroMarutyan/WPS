import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/services/telegram-bot.service.js', () => ({
  botResponse: vi.fn()
}));

vi.mock('../src/services/db-crud.service.js', () => ({
  listSearches: vi.fn(),
  getNewestResults: vi.fn(),
  createNewSearch: vi.fn(),
  updateSearch: vi.fn(),
  deleteSearch: vi.fn()
}));

const CHAT_ID = 12345;

function buildEvent(text) {
  return { body: JSON.stringify({ message: { text, chat: { id: CHAT_ID } } }) };
}

describe('handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ['/ls', 'listSearches'],
    ['/gl', 'getNewestResults'],
    ['/ns', 'createNewSearch'],
    ['/us', 'updateSearch'],
    ['/ds', 'deleteSearch']
  ])('routes %s to %s with the chat id', async (command, methodName) => {
    const { handler } = await import('../index.js');
    const crudService = await import('../src/services/db-crud.service.js');

    const response = await handler(buildEvent(command));

    expect(crudService[methodName]).toHaveBeenCalledWith(command, CHAT_ID);
    expect(response).toEqual({
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true })
    });
  });

  it('responds with help text for /help command', async () => {
    const { handler } = await import('../index.js');
    const { botResponse } = await import('../src/services/telegram-bot.service.js');

    await handler(buildEvent('/help'));

    expect(botResponse).toHaveBeenCalledTimes(1);
    expect(botResponse.mock.calls[0][0]).toBe(CHAT_ID);
    expect(botResponse.mock.calls[0][1]).toContain('To check all searches');
  });

  it('responds with unrecognized command fallback', async () => {
    const { handler } = await import('../index.js');
    const { botResponse } = await import('../src/services/telegram-bot.service.js');

    await handler(buildEvent('/unknown'));

    expect(botResponse).toHaveBeenCalledWith(CHAT_ID, 'Unrecognized command. Type /help to get an overview of available commands');
  });

  it('scopes different chat ids independently', async () => {
    const { handler } = await import('../index.js');
    const crudService = await import('../src/services/db-crud.service.js');

    await handler({ body: JSON.stringify({ message: { text: '/ls', chat: { id: 111 } } }) });
    await handler({ body: JSON.stringify({ message: { text: '/ls', chat: { id: 222 } } }) });

    expect(crudService.listSearches).toHaveBeenNthCalledWith(1, '/ls', 111);
    expect(crudService.listSearches).toHaveBeenNthCalledWith(2, '/ls', 222);
  });
});
