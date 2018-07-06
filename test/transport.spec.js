'use strict';

const { Transport } = require('../src');

describe('Transport', () => {
  describe('connect/disconnect', () => {
    const transport = new Transport({ type: Transport.IN_MEMORY });

    const onConnect = jest.fn();
    const onDisconnect = jest.fn();
    transport.on(Transport.CONNECT, onConnect);
    transport.on(Transport.DISCONNECT, onDisconnect);

    it('connects to transport server', async () => {
      await transport.connect();

      expect(transport.connected).toBe(true);
      expect(onConnect).toHaveBeenCalledTimes(1);
    });

    it('disconnects from transport server', async () => {
      await transport.disconnect();

      expect(transport.connected).toBe(false);
      expect(onDisconnect).toHaveBeenCalledTimes(1);
    });
  });

  it('publish/subscribe', async () => {
    const subscriber = new Transport({ type: Transport.IN_MEMORY });
    const publisher = new Transport({ type: Transport.IN_MEMORY });

    await subscriber.connect();
    await publisher.connect();

    const callback = jest.fn();
    const sid = subscriber.subscribe('subject', callback);
    publisher.publish('subject', 'message', 'replyTo');

    subscriber.unsubscribe(sid);
    publisher.publish('subject', 'message', 'replyTo');

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('message', 'replyTo', 'subject');
  });

  it('request/reply', () => {
    const replier = new Transport({ type: Transport.IN_MEMORY });
    const requester = new Transport({ type: Transport.IN_MEMORY });

    // On 'subject' request, publish a reply to the requester
    const replierCb = jest.fn()
      .mockImplementation((_, replyTo) => replier.publish(replyTo, 'reply'));
    const requesterCb = jest.fn();

    replier.subscribe('subject', replierCb);
    requester.request('subject', 'message', null, requesterCb);

    expect(replierCb).toHaveBeenCalledTimes(1);
    expect(replierCb).toHaveBeenCalledWith('message', expect.any(String), 'subject');

    expect(requesterCb).toHaveBeenCalledTimes(1);
    expect(requesterCb).toHaveBeenCalledWith('reply', undefined, expect.any(String));
  });
});
