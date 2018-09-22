'use strict';

const { Model, Transport } = require('../src');

const name = 'Test';

describe('Model', () => {
  describe('constructor', () => {
    test('throws with invalid arguments', () => {
      /* eslint-disable no-new */
      expect(() => { new Model(); }).toThrow();
      expect(() => { new Model({ transport: {} }); }).toThrow();
      /* eslint-enable no-new */
    });
  });

  describe('connect/disconnect', () => {
    const model = new Model({ name });

    const onConnect = jest.fn();
    const onDisconnect = jest.fn();
    model.on(Transport.CONNECT, onConnect);
    model.on(Transport.DISCONNECT, onDisconnect);

    test('connects transport', async () => {
      await model.connect();

      expect(model.connected).toBe(true);
      expect(onConnect).toHaveBeenCalledTimes(1);
    });

    test('disconnects transport', async () => {
      await model.disconnect();

      expect(model.connected).toBe(false);
      expect(onConnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('actions', () => {
    const transport = new Transport();
    const request = jest.fn();
    transport.request = request;

    const model = new Model({ name, transport });

    beforeAll(async () => {
      await model.connect();
    });

    test('create', async () => {
      request.mockClear();
      const args = { objects: 'objects', projection: 'projection', options: 'options' };

      model.create(...Object.keys(args));

      expect(request).toHaveBeenCalledWith(
        'test.create',
        args,
        undefined,
        expect.any(Function)
      );
    });

    test('delete', async () => {
      request.mockClear();
      const args = {
        conditions: 'conditions',
        projection: 'projection',
        options: 'options',
      };

      model.delete(...Object.keys(args));

      expect(request).toHaveBeenCalledWith(
        'test.delete',
        args,
        undefined,
        expect.any(Function)
      );
    });

    test('find', async () => {
      request.mockClear();
      const args = {
        conditions: 'conditions',
        projection: 'projection',
        options: 'options',
      };

      model.find(...Object.keys(args));

      expect(request).toHaveBeenCalledWith(
        'test.find',
        args,
        undefined,
        expect.any(Function)
      );
    });

    test('update', async () => {
      request.mockClear();
      const args = {
        conditions: 'conditions',
        updates: 'updates',
        projection: 'projection',
        options: 'options',
      };

      model.update(...Object.keys(args));

      expect(request).toHaveBeenCalledWith(
        'test.update',
        args,
        undefined,
        expect.any(Function)
      );
    });
  });

  describe('events', () => {
    const transport = new Transport();

    const model = new Model({ name });

    beforeAll(async () => {
      await model.connect();
    });

    test('on `created`', () => {
      const onCreated = jest.fn();
      model.on(Model.CREATED, onCreated);

      transport.publish('test.created', 'message');

      expect(onCreated).toHaveBeenCalledWith('message');
    });

    test('on `deleted`', () => {
      const onDeleted = jest.fn();
      model.on(Model.DELETED, onDeleted);

      transport.publish('test.deleted', 'message');

      expect(onDeleted).toHaveBeenCalledWith('message');
    });

    test('on `found`', () => {
      const onFound = jest.fn();
      model.on(Model.FOUND, onFound);

      transport.publish('test.found', 'message');

      expect(onFound).toHaveBeenCalledWith('message');
    });

    test('on `updated`', () => {
      const onUpdated = jest.fn();
      model.on(Model.UPDATED, onUpdated);

      transport.publish('test.updated', 'message');

      expect(onUpdated).toHaveBeenCalledWith('message');
    });
  });
});
