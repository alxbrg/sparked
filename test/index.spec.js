'use strict';

const {
  Model,
  Store,
  Service,
} =  require('../src');

const modelNames = ['Test'];

const Manager = Service.use(Service.plugins.Manager);

describe('integration', () => {
  const model = new Model({ name: modelNames[0] });
  const store = new Store({ modelNames });
  const manager = new Manager({ store });

  const onCreated = jest.fn();
  const onDeleted = jest.fn();
  const onFound = jest.fn();
  const onUpdated = jest.fn();

  model.on(Model.CREATED, onCreated);
  model.on(Model.DELETED, onDeleted);
  model.on(Model.FOUND, onFound);
  model.on(Model.UPDATED, onUpdated);

  beforeAll(async () => {
    await model.connect();
    await manager.connect();
  });

  test('CRUD actions and events', async () => {
    const object = { field: 'created' };
    const expected = [{ ...object, id: 1 }];

    // Create
    const created = await model.create(object);
    expect(created).toEqual(expected);

    // Find
    const found = await model.find(object);
    expect(found).toEqual(expected);

    // Update
    const updatedExpected = [{ ...expected[0], updated: true }];
    const updated = await model.update(object, { $set: { updated: true } });
    expect(updated).toEqual(updatedExpected);

    // Delete
    const deleted = await model.delete(object);
    expect(deleted).toEqual(updatedExpected);
    expect(await model.find(object)).toEqual([]);

    // Events
    expect(onCreated).toHaveBeenCalledWith({ data: expected });
    expect(onFound).toHaveBeenCalledWith({ data: expected });
    expect(onUpdated).toHaveBeenCalledWith({ data: updatedExpected });
    expect(onDeleted).toHaveBeenCalledWith({ data: updatedExpected });
  });
});
