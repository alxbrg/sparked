'use strict';

const {
  Client,
  Client: {
    CREATED,
    DELETED,
    FOUND,
    UPDATED,
  },
  Store,
  Service,
  Service: {
    plugins: {
      Controller,
      Manager,
    },
  },
} =  require('../src');

const modelName = 'test';

const CtrlMngr = Service.use(Manager, Controller);

describe('integration', () => {
  const func = jest.fn().mockImplementation(() => 'result');
  func.constructor = Function;

  const client = new Client();
  const store = new Store({ modelNames: [ modelName ] });
  const service = new CtrlMngr({ name: 'service', store, controllers: { func } });

  const onCreated = jest.fn();
  const onDeleted = jest.fn();
  const onFound = jest.fn();
  const onUpdated = jest.fn();

  const onModelEvent = (event, args) => {
    switch (event) {
      case CREATED:
        onCreated(args);
        break;

      case DELETED:
        onDeleted(args);
        break;

      case FOUND:
        onFound(args);
        break;

      case UPDATED:
        onUpdated(args);
        break;
    }
  };

  client.watch({ models: { [modelName]: onModelEvent } });

  beforeAll(async () => {
    await client.connect();
    await service.connect();
  });

  test('actions and events', async () => {
    const object = { field: 'created' };
    const expected = [{ ...object, id: 1 }];

    // Call
    const result = await client.call('service.func', 'argument');
    expect(func).toHaveBeenCalledWith('argument');
    expect(result).toEqual('result');

    // Create
    const created = await client.create(modelName, object);
    expect(created).toEqual(expected);

    // Find
    const found = await client.find(modelName, object);
    expect(found).toEqual(expected);

    // Update
    const updatedExpected = [{ ...expected[0], updated: true }];
    const updated = await client.update(modelName, object, { $set: { updated: true } });
    expect(updated).toEqual(updatedExpected);

    // Delete
    const deleted = await client.delete(modelName, object);
    expect(deleted).toEqual(updatedExpected);
    expect(await client.find(modelName, object)).toEqual([]);

    // Events
    expect(onCreated).toHaveBeenCalledWith({ data: expected });
    expect(onFound).toHaveBeenCalledWith({ data: expected });
    expect(onUpdated).toHaveBeenCalledWith({ data: updatedExpected });
    expect(onDeleted).toHaveBeenCalledWith({ data: updatedExpected });
  });
});
