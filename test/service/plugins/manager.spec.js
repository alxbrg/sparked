'use strict';

const {
  Store,
  Service,
  Transport,
} = require('../../../src');

const Manager = Service.use(Service.plugins.Manager);

const opts = {
  name: 'manager',
  store: new Store({
    modelNames: ['test'],
  }),
};

describe('Manager', () => {
  describe('constructor', () => {
    test('throws without valid storeOptions', () => {
      /* eslint-disable no-new */
      expect(() => { new Manager({ name: 'manager' }); }).toThrow();
      /* eslint-enable no-new */
    });

    test('defaults', () => {
      const manager = new Manager(opts);

      expect(manager._store).toBeInstanceOf(Store);
      expect(manager._transport).toBeInstanceOf(Transport);
      expect(manager._subjects).toEqual([
        'test.create',
        'test.delete',
        'test.find',
        'test.update',
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

    client.subscribe('test.created', onCreated);
    client.subscribe('test.deleted', onDeleted);
    client.subscribe('test.found', onFound);
    client.subscribe('test.updated', onUpdated);

    manager.on(Manager.MESSAGE, onMessage);
    manager.on(Manager.ERROR, () => {}); // ignore errors

    beforeAll(async () => {
      await manager.connect();
    });

    test('emits message event', () => {
      client.publish('test.create', 'message');
      expect(onMessage).toHaveBeenCalledWith('message', undefined, 'test.create');
    });

    test('create', done => {
      storeCreate.mockClear();

      const request = {
        objects: 'objects',
        projection: 'projection',
        options: 'options',
      };

      client.request('test.create', request, null, data => {
        const expectedData = { data: 'created' };
        expect(storeCreate).toHaveBeenCalledWith('test', ...Object.values(request));
        expect(data).toEqual(expectedData);
        expect(onCreated).toHaveBeenCalledWith(expectedData, undefined, 'test.created');
        done();
      });
    });

    test('delete', done => {
      const request = {
        conditions: 'conditions',
        projection: 'projection',
        options: 'options',
      };

      client.request('test.delete', request, null, data => {
        const expectedData = { data: 'deleted' };
        expect(storeDelete).toHaveBeenCalledWith('test', ...Object.values(request));
        expect(data).toEqual(expectedData);
        expect(onDeleted).toHaveBeenCalledWith(expectedData, undefined, 'test.deleted');
        done();
      });
    });

    test('find', done => {
      const request = {
        conditions: 'conditions',
        projection: 'projection',
        options: 'options',
      };

      client.request('test.find', request, null, data => {
        const expectedData = { data: 'found' };
        expect(storeFind).toHaveBeenCalledWith('test', ...Object.values(request));
        expect(data).toEqual(expectedData);
        expect(onFound).toHaveBeenCalledWith(expectedData, undefined, 'test.found');
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

      client.request('test.update', request, null, data => {
        const expectedData = { data: 'updated' };
        expect(storeUpdate).toHaveBeenCalledWith('test', ...Object.values(request));
        expect(data).toEqual(expectedData);
        expect(onUpdated).toHaveBeenCalledWith(expectedData, undefined, 'test.updated');
        done();
      });
    });
  });
});
