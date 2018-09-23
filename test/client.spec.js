'use strict';

const { Client, Transport } = require('../src');

const modelName = 'test';

describe('Client', () => {
  describe('constructor', () => {
    test('throws with invalid arguments', () => {
      /* eslint-disable no-new */
      expect(() => { new Client({ transport: null }); }).toThrow();
      /* eslint-enable no-new */
    });
  });

  describe('connect/disconnect', () => {
    const client = new Client();

    const onConnect = jest.fn();
    const onDisconnect = jest.fn();
    client.on(Transport.CONNECT, onConnect);
    client.on(Transport.DISCONNECT, onDisconnect);

    test('connects transport', async () => {
      await client.connect();

      expect(client.connected).toBe(true);
      expect(onConnect).toHaveBeenCalledTimes(1);
    });

    test('disconnects transport', async () => {
      await client.disconnect();

      expect(client.connected).toBe(false);
      expect(onConnect).toHaveBeenCalledTimes(1);
    });
  });

  test('call', async () => {
    const transport = new Transport();
    const request = jest.fn();
    transport.request = request;

    const client = new Client({ transport });

    await client.connect();

    client.call('service.func', 0, 1, 2);

    expect(request).toHaveBeenCalledWith(
      'service.func.call',
      { args: [0, 1, 2] },
      undefined,
      expect.any(Function)
    );
  });

  describe('CRUD actions', () => {
    const transport = new Transport();
    const request = jest.fn();
    transport.request = request;

    const client = new Client({ transport });

    beforeAll(async () => {
      await client.connect();
    });

    test('create', async () => {
      request.mockClear();
      const args = { objects: 'objects', projection: 'projection', options: 'options' };

      client.create(modelName, ...Object.keys(args));

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

      client.delete(modelName, ...Object.keys(args));

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

      client.find(modelName, ...Object.keys(args));

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

      client.update(modelName, ...Object.keys(args));

      expect(request).toHaveBeenCalledWith(
        'test.update',
        args,
        undefined,
        expect.any(Function)
      );
    });
  });

  describe('watch', () => {
    const transport = new Transport();
    const client = new Client();
    const controller = 'service.func';
    const onEvent = jest.fn();
    onEvent.constructor = Function;

    beforeAll(async () => {
      await client.connect();
      client.watch({
        models: { [modelName]: onEvent },
        controllers: { [controller]: onEvent },
      });
    });

    beforeEach(() => {
      onEvent.mockClear();
    });

    test('throws with invalid arguments', () => {
      expect(() => client.watch()).toThrow();
      expect(() => client.watch({})).toThrow();
      expect(() => client.watch({ models: 1 })).toThrow();
      expect(() => client.watch({ models: { model: 1 } })).toThrow();
    });

    test('created', () => {
      transport.publish('test.created', 'message');
      expect(onEvent).toHaveBeenCalledWith('created', 'message');
    });

    test('deleted', () => {
      transport.publish('test.deleted', 'message');
      expect(onEvent).toHaveBeenCalledWith('deleted', 'message');
    });

    test('found', () => {
      transport.publish('test.found', 'message');
      expect(onEvent).toHaveBeenCalledWith('found', 'message');
    });

    test('updated', () => {
      transport.publish('test.updated', 'message');
      expect(onEvent).toHaveBeenCalledWith('updated', 'message');
    });

    test('called', () => {
      transport.publish('service.func.called', 'message');
      expect(onEvent).toHaveBeenCalledWith('message');
    });
  });
});
