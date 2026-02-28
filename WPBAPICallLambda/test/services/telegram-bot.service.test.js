import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const sendMessage = vi.fn();

vi.mock('node-telegram-bot-api', () => ({
  default: vi.fn(function () {
    return { sendMessage };
  })
}));

describe('telegram-bot-service', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.useFakeTimers();
    process.env.TOKEN = 'token';
    process.env.CHAT_ID = 'chat-id';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sends plain and HTML responses to configured chat', async () => {
    const { botResponse, botResponseHTML } = await import('../../src/services/telegram-bot.service.js');

    await botResponse('plain text');
    await botResponseHTML('html text');

    expect(sendMessage).toHaveBeenNthCalledWith(1, 'chat-id', 'plain text');
    expect(sendMessage).toHaveBeenNthCalledWith(2, 'chat-id', 'html text', { parse_mode: 'HTML' });
  });

  it('formats and sends each result as HTML', async () => {
    const { sendResultsToTelegram } = await import('../../src/services/telegram-bot.service.js');

    const results = [
      {
        web_slug: 'offer-1',
        title: 'Bike 1',
        description: 'Desc',
        images: [{ urls: { small: 'small-1', medium: 'med-1', big: 'big-1' } }],
        price: { amount: 100 },
        location: { city: 'Barcelona', region: 'Catalonia' },
        shipping: { user_allows_shipping: true }
      },
      {
        web_slug: 'offer-2',
        title: 'Bike 2',
        description: 'Desc2',
        images: [{ urls: { small: '', medium: 'med-2', big: 'big-2' } }],
        price: { amount: 200 },
        location: { city: 'Girona', region: 'Catalonia' },
        shipping: { user_allows_shipping: false }
      }
    ];

    const sendPromise = sendResultsToTelegram(results);
    await vi.runAllTimersAsync();
    await sendPromise;

    expect(sendMessage).toHaveBeenCalledTimes(2);
    expect(sendMessage.mock.calls[0][1]).toContain('<b>TITLE:</b> Bike 1');
    expect(sendMessage.mock.calls[0][1]).toContain("<a href='https://es.wallapop.com/item/offer-1'>CLICK</a>");
    expect(sendMessage.mock.calls[1][1]).toContain("<a href='med-2'>");
    expect(sendMessage.mock.calls[1][2]).toEqual({ parse_mode: 'HTML' });
  });
});
