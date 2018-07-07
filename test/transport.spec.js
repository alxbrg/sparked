'use strict';

const { Transport } = require('../src');

const opts = { type: Transport.IN_MEMORY };

describe('Transport', () => {
  describe('connect/disconnect', () => {
    const transport = new Transport(opts);

    const onConnect = jest.fn();
    const onDisconnect = jest.fn();
    transport.on(Transport.CONNECT, onConnect);
    transport.on(Transport.DISCONNECT, onDisconnect);

    test('connects to transport server', async () => {
      await transport.connect();

      expect(transport.connected).toBe(true);
      expect(onConnect).toHaveBeenCalledTimes(1);
    });

    test('disconnects from transport server', async () => {
      await transport.disconnect();

      expect(transport.connected).toBe(false);
      expect(onDisconnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('publish/subscribe', () => {
    const sub = new Transport(opts);
    const pub = new Transport(opts);

    beforeAll(async () => {
      await sub.connect();
      await pub.connect();
    });

    test('calls a sub\'s callback on publish until it is unsubscribed', () => {
      const callback = jest.fn();

      const sid = sub.subscribe('subject', callback);
      pub.publish('subject', 'message', 'replyTo');

      sub.unsubscribe(sid);
      pub.publish('subject', 'message', 'replyTo');

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('message', 'replyTo', 'subject');
    });

    describe('wildcards', () => {
      const token = jest.fn();
      const full = jest.fn();
      const fullAndToken = jest.fn();

      sub.subscribe('a.*.c', token);
      sub.subscribe('d.e.>', full);
      sub.subscribe('f.*.h.>', fullAndToken);

      test('*', () => {
        pub.publish('a.x.c');
        pub.publish('a.xyz.c');

        // Should not get picked up:
        pub.publish('a.x.c.a');
        pub.publish('a.x');

        expect(token).toHaveBeenCalledTimes(2);
      });

      test('>', () => {
        pub.publish('d.e.x');
        pub.publish('d.e.xyz');
        pub.publish('d.e.0.1.2');

        // Should not get picked up:
        pub.publish('x.y.z');
        pub.publish('d.e');
        pub.publish('d.x.y.z');

        expect(full).toHaveBeenCalledTimes(3);
      });

      test('* & >', () => {
        pub.publish('f.x.h.y');
        pub.publish('f.x.h.y.z');

        // Should not get picked up:
        pub.publish('f.x.h');
        pub.publish('f.h.x');
        pub.publish('f.x.y.h.z');

        expect(fullAndToken).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('request', () => {
    const replier = new Transport(opts);
    const requester = new Transport(opts);

    // On 'subject' request, publish a reply to the requester
    const replierCb = jest.fn()
      .mockImplementation((_, replyTo) => replier.publish(replyTo, 'reply'));
    const requesterCb = jest.fn();

    beforeAll(async () => {
      await replier.connect();
      await requester.connect();

      replier.subscribe('subject', replierCb);
      requester.request('subject', 'message', null, requesterCb);
    });

    test('replier\'s callback gets called', () => {
      expect(replierCb).toHaveBeenCalledTimes(1);
      expect(replierCb).toHaveBeenCalledWith('message', expect.any(String), 'subject');
    });

    test('requester gets a reply', () => {
      expect(requesterCb).toHaveBeenCalledTimes(1);
      expect(requesterCb).toHaveBeenCalledWith('reply', undefined, expect.any(String));
    });
  });
});
