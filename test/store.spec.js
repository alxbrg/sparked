'use strict';

const Loki = require('lokijs');
const { Store } = require('../src');

describe('Store', () => {
  const loki = new Loki();
  const collection = loki.addCollection('test', {
    clone: true,
    disableMeta: true,
  });

  const store = new Store({
    schemas: [{ name: 'Test' }],
    type: Store.IN_MEMORY,
    store: loki,
  });

  beforeAll(async () => {
    await store.connect();
  });

  afterEach(() => {
    collection.clear();
  });

  afterAll(async () => {
    await store.disconnect();
  });

  describe('connect/disconnect', async () => {
    const _store = new Store({
      schemas: [{ name: 'connect' }],
      type: Store.IN_MEMORY,
    });

    const onConnect = jest.fn();
    const onDisconnect = jest.fn();

    _store.on(Store.CONNECT, onConnect);
    _store.on(Store.DISCONNECT, onDisconnect);

    test('connects the store and emits a CONNECT event', async () => {
      await _store.connect();
      expect(_store.connected).toBe(true);
      expect(onConnect).toHaveBeenCalledTimes(1);
    });

    test('disconnects the store and emits a DISCONNECT event', async () => {
      await _store.disconnect();
      expect(_store.connected).toBe(false);
      expect(onDisconnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('create', () => {
    test('creates a single object', async () => {
      const mock = { foo: 1 };
      const res = await store.create('test', mock);
      const store = collection.find({});

      expect(res).toEqual([{ ...mock, id: 1 }]);
      expect(store).toHaveLength(1);
    });

    test('creates multiple objects', async () => {
      const mocks = [{ foo: 1 }, { foo: 2 }];
      const res = await store.create('test', mocks);
      const store = collection.find({});

      expect(res).toEqual(mocks.map((mock, i) => ({ ...mock, id: i + 1 })));
      expect(store).toHaveLength(2);
    });
  });

  describe('delete', () => {
    test('deletes objects', async () => {
      const mock = { foo: 3 };
      collection.insert(mock);
      const res = await store.delete('test', mock);
      const store = collection.find({});

      expect(res).toEqual([{ ...mock, id: expect.any(Number) }]);
      expect(store).toHaveLength(0);
    });
  });

  describe('find', () => {
    test('finds objects', async () => {
      const mock = { foo: 2 };
      collection.insert(mock);
      const res = await store.find('test', mock);

      expect(res).toEqual([{ ...mock, id: expect.any(Number) }]);
    });
  });

  describe('update', () => {
    test('$inc', async () => {
      const mocks = [{ foo: 1, bar: 1 }, { foo: 2, bar: 1 }, { foo: 0, bar: 0 }];
      collection.insert(mocks);
      const res = await store.update('test', { bar: 1 }, { $inc: { foo: 10 } });

      expect(res).toEqual([{ foo: 11, bar: 1, id: 1 }, { foo: 12, bar: 1, id: 2 }]);
    });

    test('$mul', async () => {
      const mocks = [{ foo: 1, bar: 1 }, { foo: 2, bar: 1 }, { foo: 0, bar: 0 }];
      collection.insert(mocks);
      const res = await store.update('test', { bar: 1 }, { $mul: { foo: 10 } });

      expect(res).toEqual([{ foo: 10, bar: 1, id: 1 }, { foo: 20, bar: 1, id: 2 }]);
    });

    test('$set', async () => {
      const mocks = [{ foo: 1, bar: 1 }, { bar: 1 }, { foo: 0, bar: 0 }];
      collection.insert(mocks);
      const res = await store.update('test', { bar: 1 }, { $set: { foo: 10 } });

      expect(res).toEqual([{ foo: 10, bar: 1, id: 1 }, { foo: 10, bar: 1, id: 2 }]);
    });

    test('$unset', async () => {
      const mocks = [{ foo: 1, bar: 1 }, { bar: 1 }, { foo: 0, bar: 0 }];
      collection.insert(mocks);
      const res = await store.update('test', { bar: 1 }, { $unset: { foo: 1 } });

      expect(res).toEqual([{ foo: null, bar: 1, id: 1 }, { foo: null, bar: 1, id: 2 }]);
    });

    test('$pull', async () => {
      const condition = { bar: 1 };
      const mocks = [
        { foo: [ 1, 2, 2 ], bar: 1 },
        { foo: [ 1, 3 ], bar: 1 },
        { foo: 0, bar: 1 },
      ];
      collection.insert(mocks);
      const res = await store.update('test', condition, { $pull: { foo: 2 } });

      expect(res).toEqual([
        { foo: [ 1 ], bar: 1, id: 1 },
        { foo: [ 1, 3 ], bar: 1, id: 2 },
        { foo: 0, bar: 1, id: 3 },
      ]);

      // $in
      const res1 = await store.update('test', condition, {
        $pull: { foo: { $in: [ 1, 3 ] } },
      });
      expect(res1).toEqual([
        { foo: [], bar: 1, id: 1 },
        { foo: [], bar: 1, id: 2 },
        { foo: 0, bar: 1, id: 3 },
      ]);
    });

    test('$push', async () => {
      const mocks = [{ foo: [ 1, 2 ], bar: 1 }, { foo: 1, bar: 1 }, { foo: 0, bar: 0 }];
      collection.insert(mocks);
      const res = await store.update('test', { bar: 1 }, { $push: { foo: 3 } });

      expect(res).toEqual([
        { foo: [ 1, 2, 3 ], bar: 1, id: 1 },
        { foo: 1, bar: 1, id: 2 },
      ]);
    });
  });
});
