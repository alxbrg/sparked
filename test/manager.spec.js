'use strict';

const {
  Database,
  Manager,
  Transport,
} = require('../src');

const opts = {
  db: new Database({
    schemas: [{
      name: 'Foo',
      definition: {
        field: String,
      },
    }],
  }),
};

describe('Manager', () => {
  describe('constructor', () => {
    test('throws without valid dbOptions', () => {
      /* eslint-disable no-new */
      expect(() => { new Manager(); }).toThrow();
      /* eslint-enable no-new */
    });

    test('defaults', () => {
      const manager = new Manager(opts);

      expect(manager._db).toBeInstanceOf(Database);
      expect(manager._transport).toBeInstanceOf(Transport);
      expect(manager._subjects).toEqual([
        'foo.create',
        'foo.delete',
        'foo.find',
        'foo.update',
      ]);
    });
  });

  describe('_onMessage', async () => {
    const manager = new Manager(opts);
    const onMessage = jest.fn();

    // Override db methods
    const dbCreate = jest.fn().mockImplementation(() => 'created');
    const dbDelete = jest.fn().mockImplementation(() => 'deleted');
    const dbFind = jest.fn().mockImplementation(() => 'found');
    const dbUpdate = jest.fn().mockImplementation(() => 'updated');

    manager._db.create = dbCreate;
    manager._db.delete = dbDelete;
    manager._db.find = dbFind;
    manager._db.update = dbUpdate;

    const pub = new Transport();

    manager.on(Manager.MESSAGE, onMessage);
    manager.on(Manager.ERROR, () => {}); // ignore errors

    beforeAll(async () => {
      await manager.connect();
    });

    test('emits message event', () => {
      pub.publish('foo.create', 'message');
      expect(onMessage).toHaveBeenCalledWith('message', undefined, 'foo.create');
    });

    test('create', done => {
      dbCreate.mockClear();

      const request = {
        objects: 'objects',
        projection: 'projection',
        options: 'options',
      };

      pub.request('foo.create', request, null, data => {
        expect(dbCreate).toHaveBeenCalledWith('foo', ...Object.values(request));
        expect(data).toEqual({ data: 'created' });
        done();
      });
    });

    test('delete', done => {
      const request = {
        conditions: 'conditions',
        projection: 'projection',
        options: 'options',
      };

      pub.request('foo.delete', request, null, data => {
        expect(dbDelete).toHaveBeenCalledWith('foo', ...Object.values(request));
        expect(data).toEqual({ data: 'deleted' });
        done();
      });
    });

    test('find', done => {
      const request = {
        conditions: 'conditions',
        projection: 'projection',
        options: 'options',
      };

      pub.request('foo.find', request, null, data => {
        expect(dbFind).toHaveBeenCalledWith('foo', ...Object.values(request));
        expect(data).toEqual({ data: 'found' });
        done();
      });
    });

    test('update', done => {
      const request = {
        conditions: 'conditions',
        updates: 'updates',
        projection: 'projection',
        options: 'options',
      };

      pub.request('foo.update', request, null, data => {
        expect(dbUpdate).toHaveBeenCalledWith('foo', ...Object.values(request));
        expect(data).toEqual({ data: 'updated' });
        done();
      });
    });
  });
});
