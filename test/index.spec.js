'use strict';

const {
  Client,
  Database,
  Service,
} =  require('../src');

const schemas = [{
  name: 'Test',
  definition: {
    field: String,
  },
}];

const Manager = Service.use(Service.mixins.Manager);

describe('integration', () => {
  const client = new Client({ schema: schemas[0] });
  const db = new Database({ schemas });
  const manager = new Manager({ db });

  const onCreated = jest.fn();
  const onDeleted = jest.fn();
  const onFound = jest.fn();
  const onUpdated = jest.fn();

  client.on(Client.CREATED, onCreated);
  client.on(Client.DELETED, onDeleted);
  client.on(Client.FOUND, onFound);
  client.on(Client.UPDATED, onUpdated);

  beforeAll(async () => {
    await client.connect();
    await manager.connect();
  });

  test('CRUD actions and events', async () => {
    const object = { field: 'created' };
    const expected = [{ ...object, id: 1 }];

    // Create
    const created = await client.create(object);
    expect(created).toEqual(expected);

    // Find
    const found = await client.find(object);
    expect(found).toEqual(expected);

    // Update
    const updatedExpected = [{ ...expected[0], updated: true }];
    const updated = await client.update(object, { $set: { updated: true } });
    expect(updated).toEqual(updatedExpected);

    // Delete
    const deleted = await client.delete(object);
    expect(deleted).toEqual(updatedExpected);
    expect(await client.find(object)).toEqual([]);

    // Events
    expect(onCreated).toHaveBeenCalledWith({ data: expected });
    expect(onFound).toHaveBeenCalledWith({ data: expected });
    expect(onUpdated).toHaveBeenCalledWith({ data: updatedExpected });
    expect(onDeleted).toHaveBeenCalledWith({ data: updatedExpected });
  });
});
