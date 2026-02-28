import { beforeEach, describe, expect, it, vi } from 'vitest';

const sendMessage = vi.fn();

vi.mock('node-telegram-bot-api', () => ({
  default: vi.fn(function () {
    return { sendMessage };
  })
}));

describe('telegram-bot.service', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.TOKEN = 'token';
    process.env.CHAT_ID = 'chat-id';
  });

  it('sends plain and html responses to the configured chat id', async () => {
    const { botResponse, botResponseHTML } = await import('../../../src/services/telegram-bot.service.js');

    await botResponse('hello');
    await botResponseHTML('html-message');

    expect(sendMessage).toHaveBeenNthCalledWith(1, 'chat-id', 'hello');
    expect(sendMessage).toHaveBeenNthCalledWith(2, 'chat-id', 'html-message', { parse_mode: 'HTML' });
  });

  it('builds telegram response payload from offer details', async () => {
    const { buildTelegramResponse } = await import('../../../src/services/telegram-bot.service.js');

    const response = buildTelegramResponse('bike-alert', {
      imageUrl: 'https://image',
      title: 'Road Bike',
      price: 350,
      description: 'Fast bike',
      location: { city: 'Madrid', region: 'Madrid' },
      shipping: true,
      link: 'https://offer'
    });

    expect(response).toContain('<b>SEARCH ALIAS:</b> bike-alert');
    expect(response).toContain('<b>LOCATION:</b> Madrid Madrid');
    expect(response).toContain("<a href='https://offer'>CLICK</a>");
  });
});
