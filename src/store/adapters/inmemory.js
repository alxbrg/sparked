'use strict';

const Loki = require('lokijs');
const { compose, identity, is, map } = require('ramda');
const { renameKeys } = require('ramda-adjunct');

// Update operators
const ops = {
  $inc: (a, b) => is(Number, a) ? (a || 0) + b : a,
  $mul: (a, b) => is(Number, a) ? (a || 0) * b : a,
  $set: (a, b) => b,
  $unset: () => null,
  $pull: (a, b) => is(Array, a)
    ? a.filter(x => is(Object, b) && is(Array, b.$in)
      ? !b.$in.includes(x) // pull all elements of $in array
      : b !== x)
    : a,
  $push: (a, b) => is(Array, a) ? a.concat(b) : a,
};

class InMemory {
  constructor ({
    schemas,
    store = new Loki(),
  }) {
    this._schemas = schemas;
    this._store = store;

    // Create collections
    this._collections = {};
    for (const { name } of this._schemas) {
      const _name = name.toLowerCase();
      this._collections[_name] = this._store.addCollection(_name, {
        clone: true,
        disableMeta: true,
      });
    }
  }

  async connect () {}

  async disconnect () {}

  async create (collection, objects, projection, options) {
    const created = [].concat(objects) // Allow single object creation
      .map(object => this._collections[collection].insert(object));

    return this._return(created, projection, options);
  }

  async delete (collection, conditions, projection, options) {
    const deleted = this._collections[collection].find(conditions);
    this._collections[collection].remove(deleted);

    return this._return(deleted, projection, options);
  }

  async find (collection, conditions, projection, options) {
    const found = this._collections[collection].find(conditions);
    return this._return(found, projection, options);
  }

  async update (collection, conditions, updates, projection, options) {
    const objects = this._collections[collection].find(conditions);

    const updated = objects.map(object => {
      // Apply each operator/update
      for (const operator in updates) {
        const update = updates[operator];
        const updateFn = ops[operator] || identity;

        for (const key in update)
          // Update the object in place
          object[key] = updateFn(object[key], update[key]);
      }

      return object;
    });

    this._collections[collection].update(updated);
    return this._return(updated, projection, options);
  }

  _return (res, projection = {}, { limit } = {}) {
    return compose(
      map(compose(
        // TODO: apply projection
        renameKeys({ $loki: 'id' }),
      )),
      x => is(Array, x) ? x : [x], // Always return arrays for consistency
    )(res);
  }
}

module.exports = InMemory;
