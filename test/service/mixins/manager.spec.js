'use strict';

const {
  Store,
  Service,
  Transport,
} = require('../../../src');

const Manager = Service.use(Service.mixins.Manager);

const opts = {
  store: new Store({
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
    test('throws without valid storeOptions', () => {
      /* eslint-disable no-new */
      expect(() => { new Manager(); }).toThrow();
      /* eslint-enable no-new */
    });

    test('defaults', () => {
      const manager = new Manager(opts);

      expect(manager._store).toBeInstanceOf(Store);
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

    // Override store methods
    const storeCreate = jest.fn().mockImplementation(async () => 'created');
    const storeDelete = jest.fn().mockImplementation(async () => 'deleted');
    const storeFind = jest.fn().mockImplementation(async () => 'found');
    const storeUpdate = jest.fn().mockImplementation(async () => 'updated');

    manager._store.create = storeCreate;
    manager._store.delete = storeDelete;
    manager._store.find = storeFind;
    manager._store.update = storeUpdate;

    const client = new Transport();

    // Subscribe to CRUD events
    const onCreated = jest.fn();
    const onDeleted = jest.fn();
    const onFound = jest.fn();
    const onUpdated = jest.fn();

    client.subscribe('foo.created', onCreated);
    client.subscribe('foo.deleted', onDeleted);
    client.subscribe('foo.found', onFound);
    client.subscribe('foo.updated', onUpdated);

    manager.on(Manager.MESSAGE, onMessage);
    manager.on(Manager.ERROR, () => {}); // ignore errors

    beforeAll(async () => {
      await manager.connect();
    });

    test('emits message event', () => {
      client.publish('foo.create', 'message');
      expect(onMessage).toHaveBeenCalledWith('message', undefined, 'foo.create');
    });

    test('create', done => {
      storeCreate.mockClear();

      const request = {
        objects: 'objects',
        projection: 'projection',
        options: 'options',
      };

      client.request('foo.create', request, null, data => {
        const expectedData = { data: 'created' };
        expect(storeCreate).toHaveBeenCalledWith('foo', ...Object.values(request));
        expect(data).toEqual(expectedData);
        expect(onCreated).toHaveBeenCalledWith(expectedData, undefined, 'foo.created');
        done();
      });
    });

    test('delete', done => {
      const request = {
        conditions: 'conditions',
        projection: 'projection',
        options: 'options',
      };

      client.request('foo.delete', request, null, data => {
        const expectedData = { data: 'deleted' };
        expect(storeDelete).toHaveBeenCalledWith('foo', ...Object.values(request));
        expect(data).toEqual(expectedData);
        expect(onDeleted).toHaveBeenCalledWith(expectedData, undefined, 'foo.deleted');
        done();
      });
    });

    test('find', done => {
      const request = {
        conditions: 'conditions',
        projection: 'projection',
        options: 'options',
      };

      client.request('foo.find', request, null, data => {
        const expectedData = { data: 'found' };
        expect(storeFind).toHaveBeenCalledWith('foo', ...Object.values(request));
        expect(data).toEqual(expectedData);
        expect(onFound).toHaveBeenCalledWith(expectedData, undefined, 'foo.found');
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

      client.request('foo.update', request, null, data => {
        const expectedData = { data: 'updated' };
        expect(storeUpdate).toHaveBeenCalledWith('foo', ...Object.values(request));
        expect(data).toEqual(expectedData);
        expect(onUpdated).toHaveBeenCalledWith(expectedData, undefined, 'foo.updated');
        done();
      });
    });
  });
});
