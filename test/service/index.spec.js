'use strict';

const {
  Client,
  Store,
  Transport,
  Service,
} = require('../../src');

const name = 'service';
const modelName = 'test';
const store = new Store({
  modelNames: [modelName],
});

describe('Service', () => {
  describe('constructor', () => {
    test('type checks', () => {
      /* eslint-disable no-new */
      expect(() => { new Service(); }).toThrow();
      expect(() => { new Service({ name, store: '' }); }).toThrow();
      expect(() => { new Service({ name, clients: '' }); }).toThrow();
      expect(() => { new Service({ name, subjects: '' }); }).toThrow();
      expect(() => { new Service({ name, transport: '' }); }).toThrow();
      /* eslint-enable no-new */
    });

    test('defaults', () => {
      const service = new Service({ name });

      expect(service._clients).toEqual([]);
      expect(service._store).toBe(undefined);
      expect(service._transport).toBeInstanceOf(Transport);
      expect(service._subjects).toEqual([]);
    });

    describe('with a store', () => {
      test('uses in-memory data store by default', () => {
        const service = new Service({ name, store });
        expect(service._store).toBeInstanceOf(Store);
      });
    });
  });

  describe('connect/disconnect', () => {
    const service = new Service({
      name,
      store,
      clients: [ new Client() ],
    });

    const onConnect = jest.fn();
    const onDisconnect = jest.fn();
    service.on(Service.CONNECT, onConnect);
    service.on(Service.DISCONNECT, onDisconnect);

    test('connects to the default in-memory bus and store, and connects clients',
      async () => {
        await service.connect();

        expect(service.connected).toBe(true);
        expect(service._transport.connected).toBe(true);

        expect(service._store.connected).toBe(true);
        expect(onConnect).toHaveBeenCalledTimes(1);

        expect(service._clients[0].connected).toBe(true);
      });

    test('disconnects', async () => {
      await service.disconnect();

      expect(service.connected).toBe(false);
      expect(service._transport.connected).toBe(false);
      expect(service._store.connected).toBe(false);
      expect(onDisconnect).toHaveBeenCalledTimes(1);
    });
  });

  test('message event', async () => {
    const service = new Service({ name, subjects: ['*'] });
    await service.connect();

    const onMessage = jest.fn();
    const pub = new Transport();

    service.on(Service.MESSAGE, onMessage);
    pub.publish('subject', 'message');

    expect(onMessage).toHaveBeenCalledWith('message', undefined, 'subject');
  });

  describe('use', () => {
    test('type check', () => {
      expect(() => Service.use(undefined)).toThrow();
      expect(() => Service.use(() => {})).toThrow();
      expect(() => Service.use((x, y) => {})).toThrow();

      // Valid args
      expect(() => Service.use(x => {})).not.toThrow();
      expect(() => Service.use(x => {}, x => {})).not.toThrow();
    });

    test('composition', () => {
      const MixinA = SuperClass => {
        SuperClass.static = 'static';

        return class extends SuperClass {
          constructor (opts) {
            super(opts);
            this.plugin = 'A';
          }
          method () {
            this.shared = 'A';
            return 'A';
          }
          get onlyOnA () { return 'only_on_A'; }
        };
      };

      const MixinB = SuperClass => class extends SuperClass {
        constructor (opts) {
          super(opts);
          this.onlyOnB = 'only_on_B';
          this.plugin = 'B';
        }
        method () {
          this.shared = 'B';
          return this.onlyOnB;
        }
      };

      const Composed = Service.use(MixinA, MixinB);
      const composed = new Composed({ name });

      expect(Composed.static).toEqual('static');
      expect(composed.plugin).toBe('B');
      expect(composed.shared).toBe(undefined);
      expect(composed.method()).toEqual('only_on_B');
      expect(composed.shared).toBe('B');
      expect(composed.onlyOnA).toEqual('only_on_A');
    });
  });
});
