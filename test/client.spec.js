'use strict';

const { Client, Transport } = require('../src');

describe('Client', () => {
  describe('constructor', () => {
    test('throws with invalid arguments', () => {
      /* eslint-disable no-new */
      expect(() => { new Client(); }).toThrow();
      expect(() => { new Client({ transport: {} }); }).toThrow();
      /* eslint-enable no-new */
    });
  });

  describe('connect/disconnect', () => {
    const client = new Client({
      schema: { name: 'Test' },
    });

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

  describe('actions', () => {
    const transport = new Transport();
    const request = jest.fn();
    transport.request = request;

    const client = new Client({
      schema: {
        name: 'Test',
        definition: {
          field: String,
        },
      },
      transport,
    });

    beforeAll(async () => {
      await client.connect();
    });

    test('create', async () => {
      request.mockClear();
      const args = { objects: 'objects', projection: 'projection', options: 'options' };

      client.create(...Object.keys(args));

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

      client.delete(...Object.keys(args));

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

      client.find(...Object.keys(args));

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

      client.update(...Object.keys(args));

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

    const client = new Client({
      schema: {
        name: 'Test',
        definition: {
          field: String,
        },
      },
    });

    beforeAll(async () => {
      await client.connect();
    });

    test('on `create`', () => {
      const onCreate = jest.fn();
      client.on(Client.CREATE, onCreate);

      transport.publish('create.test', 'message');

      expect(onCreate).toHaveBeenCalledWith('message');
    });

    test('on `delete`', () => {
      const onDelete = jest.fn();
      client.on(Client.DELETE, onDelete);

      transport.publish('delete.test', 'message');

      expect(onDelete).toHaveBeenCalledWith('message');
    });

    test('on `find`', () => {
      const onFind = jest.fn();
      client.on(Client.FIND, onFind);

      transport.publish('find.test', 'message');

      expect(onFind).toHaveBeenCalledWith('message');
    });

    test('on `update`', () => {
      const onUpdate = jest.fn();
      client.on(Client.UPDATE, onUpdate);

      transport.publish('update.test', 'message');

      expect(onUpdate).toHaveBeenCalledWith('message');
    });
  });
});
