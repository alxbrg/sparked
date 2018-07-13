'use strict';

const {
  Database,
  Transport,
  Service,
} = require('../src');

const statefulOpts = {
  db: new Database({
    schemas: [{
      name: 'Foo',
      definition: {
        field: String,
      },
    }],
  }),
};

describe('Service', () => {
  describe('constructor', () => {
    test('type checks', () => {
      /* eslint-disable no-new */
      expect(() => { new Service({ db: '' }); }).toThrow();
      /* eslint-enable no-new */
    });

    test('defaults', () => {
      const service = new Service();

      expect(service._clients).toEqual([]);
      expect(service._db).toBe(undefined);
      expect(service._transport).toBeInstanceOf(Transport);
      expect(service._subjects).toEqual([ '*', '*.>' ]);
    });

    describe('with a db', () => {
      test('uses in-memory database by default', () => {
        const service = new Service(statefulOpts);
        expect(service._db).toBeInstanceOf(Database);
      });
    });
  });

  describe('connect/disconnect', () => {
    const service = new Service(statefulOpts);

    const onConnect = jest.fn();
    const onDisconnect = jest.fn();
    service.on(Service.CONNECT, onConnect);
    service.on(Service.DISCONNECT, onDisconnect);

    test('connects to the default in-memory bus and database', async () => {
      await service.connect();

      expect(service.connected).toBe(true);
      expect(service._transport.connected).toBe(true);
      expect(service._db.connected).toBe(true);
      expect(onConnect).toHaveBeenCalledTimes(1);
    });

    test('disconnects', async () => {
      await service.disconnect();

      expect(service.connected).toBe(false);
      expect(service._transport.connected).toBe(false);
      expect(service._db.connected).toBe(false);
      expect(onDisconnect).toHaveBeenCalledTimes(1);
    });
  });

  test('message event', async () => {
    const service = new Service();
    await service.connect();

    const onMessage = jest.fn();
    const pub = new Transport();

    service.on(Service.MESSAGE, onMessage);
    pub.publish('subject', 'message');

    expect(onMessage).toHaveBeenCalledWith('message', undefined, 'subject');
  });
});
