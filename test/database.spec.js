'use strict';

const Loki = require('lokijs');
const { Database } = require('../src');

describe('Database', () => {
  const loki = new Loki();
  const collection = loki.addCollection('Test', {
    clone: true,
    disableMeta: true,
  });

  const db = new Database({
    schemas: [{ name: 'Test' }],
    type: Database.IN_MEMORY,
    db: loki,
  });

  const { models: { Test } } = db;

  beforeAll(async () => {
    await db.connect();
  });

  afterEach(() => {
    collection.clear();
  });

  afterAll(async () => {
    await db.disconnect();
  });

  describe('connect/disconnect', async () => {
    const _db = new Database({
      schemas: [{ name: 'connect' }],
      type: Database.IN_MEMORY,
    });

    it('connects the db and emits a CONNECT event', async () => {
      await _db.connect();
      expect(_db.connected).toBe(true);
    });

    it('disconnects the db and emits a DISCONNECT event', async () => {
      await _db.disconnect();
      expect(_db.connected).toBe(false);
    });
  });

  describe('create', () => {
    it('creates a single object', async () => {
      const mock = { foo: 1 };
      const res = await Test.create(mock);
      const store = collection.find({});

      expect(res).toEqual([{ ...mock, id: 1 }]);
      expect(store).toHaveLength(1);
    });

    it('creates multiple objects', async () => {
      const mocks = [{ foo: 1 }, { foo: 2 }];
      const res = await Test.create(mocks);
      const store = collection.find({});

      expect(res).toEqual(mocks.map((mock, i) => ({ ...mock, id: i + 1 })));
      expect(store).toHaveLength(2);
    });
  });

  describe('delete', () => {
    it('deletes objects', async () => {
      const mock = { foo: 3 };
      collection.insert(mock);
      const res = await Test.delete(mock);
      const store = collection.find({});

      expect(res).toEqual([{ ...mock, id: expect.any(Number) }]);
      expect(store).toHaveLength(0);
    });
  });

  describe('find', () => {
    it('finds objects', async () => {
      const mock = { foo: 2 };
      collection.insert(mock);
      const res = await Test.find(mock);

      expect(res).toEqual([{ ...mock, id: expect.any(Number) }]);
    });
  });

  describe('update', () => {
    it('$inc', async () => {
      const mocks = [{ foo: 1, bar: 1 }, { foo: 2, bar: 1 }, { foo: 0, bar: 0 }];
      collection.insert(mocks);
      const res = await Test.update({ bar: 1 }, { $inc: { foo: 10 } });

      expect(res).toEqual([{ foo: 11, bar: 1, id: 1 }, { foo: 12, bar: 1, id: 2 }]);
    });

    it('$mul', async () => {
      const mocks = [{ foo: 1, bar: 1 }, { foo: 2, bar: 1 }, { foo: 0, bar: 0 }];
      collection.insert(mocks);
      const res = await Test.update({ bar: 1 }, { $mul: { foo: 10 } });

      expect(res).toEqual([{ foo: 10, bar: 1, id: 1 }, { foo: 20, bar: 1, id: 2 }]);
    });

    it('$set', async () => {
      const mocks = [{ foo: 1, bar: 1 }, { bar: 1 }, { foo: 0, bar: 0 }];
      collection.insert(mocks);
      const res = await Test.update({ bar: 1 }, { $set: { foo: 10 } });

      expect(res).toEqual([{ foo: 10, bar: 1, id: 1 }, { foo: 10, bar: 1, id: 2 }]);
    });

    it('$unset', async () => {
      const mocks = [{ foo: 1, bar: 1 }, { bar: 1 }, { foo: 0, bar: 0 }];
      collection.insert(mocks);
      const res = await Test.update({ bar: 1 }, { $unset: { foo: 1 } });

      expect(res).toEqual([{ foo: null, bar: 1, id: 1 }, { foo: null, bar: 1, id: 2 }]);
    });

    it('$pull', async () => {
      const condition = { bar: 1 };
      const mocks = [
        { foo: [ 1, 2, 2 ], bar: 1 },
        { foo: [ 1, 3 ], bar: 1 },
        { foo: 0, bar: 1 },
      ];
      collection.insert(mocks);
      const res = await Test.update(condition, { $pull: { foo: 2 } });

      expect(res).toEqual([
        { foo: [ 1 ], bar: 1, id: 1 },
        { foo: [ 1, 3 ], bar: 1, id: 2 },
        { foo: 0, bar: 1, id: 3 },
      ]);

      // $in
      const res1 = await Test.update(condition, {
        $pull: { foo: { $in: [ 1, 3 ] } },
      });
      expect(res1).toEqual([
        { foo: [], bar: 1, id: 1 },
        { foo: [], bar: 1, id: 2 },
        { foo: 0, bar: 1, id: 3 },
      ]);
    });

    it('$push', async () => {
      const mocks = [{ foo: [ 1, 2 ], bar: 1 }, { foo: 1, bar: 1 }, { foo: 0, bar: 0 }];
      collection.insert(mocks);
      const res = await Test.update({ bar: 1 }, { $push: { foo: 3 } });

      expect(res).toEqual([
        { foo: [ 1, 2, 3 ], bar: 1, id: 1 },
        { foo: 1, bar: 1, id: 2 },
      ]);
    });
  });
});
