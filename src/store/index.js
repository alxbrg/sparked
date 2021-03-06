'use strict';

const { EventEmitter } = require('events');

const {
  InMemory,
} = require('./adapters');

const CONNECT = 'connect';
const DISCONNECT = 'disconnect';

const IN_MEMORY = 'in-memory';
const MONGO = 'mongo';
const MYSQL = 'mysql';

class Store extends EventEmitter {
  /**
   * @param {object} options
   * @param {object} [options.adapter] optional custom adapter
   * @param {object} [options.store] option custom data-store client
   * @param {array} options.schemas array of schemas
   * @param {string} [options.type] data-store type ('in-memory', 'mongo' or 'mysql' -
   * defaults to 'in-memory')
   */
  constructor ({
    adapter,
    store,
    schemas,
    type = IN_MEMORY,
  }) {
    super();

    const options = { store, schemas };

    // Pick data-store adapter
    if (adapter)
      this._adapter = adapter;
    else switch (type) {
      case IN_MEMORY:
        this._adapter = new InMemory(options);
        break;
      // case MONGO:
      //   this._adapter = new Mongo(options);
      //   break;
      // case MYSQL:
      //   this._adapter = new MySQL(options);
      //   break;
      default:
        throw new TypeError(
          `'type' must be one of: '${IN_MEMORY}' | '${MONGO}' | '${MYSQL}'.`
        );
    }

    this.options = options;
    this._schemas = schemas;
    this.type = type;

    this.connected = false;
  }

  /**
   * Connects to the data store using the options passed to the constructor.
   */
  async connect () {
    if (this.connected) return;

    await this._adapter.connect();
    this.connected = true;
    this.emit(CONNECT);
  }

  /**
   * Shuts down the data-store connection.
   */
  async disconnect () {
    if (!this.connected) return;

    await this._adapter.disconnect();
    this.connected = false;
    this.emit(DISCONNECT);
  }

  /**
   * Performs an insert of an object or objects into the data store.
   *
   * @param {string} model
   * @param {(array|object)} objects object(s) to insert
   * @param {object} [projection] optional fields to return
   * @param {object} [options]
   *
   * @returns {promise} created objects
   */
  create (model, objects, projection, options) {
    return this._adapter.create(model, objects, projection, options);
  }

  /**
   * Deletes all objects matching the conditions.
   *
   * @param {string} model
   * @param {object} conditions
   * @param {object} [projection] optional fields to return
   * @param {object} [options]
   *
   * @returns {promise} created objects
   */
  delete (model, conditions, projection, options) {
    return this._adapter.delete(model, conditions, projection, options);
  }

  /**
   * Finds all objects matching the conditions.
   *
   * @param {string} model
   * @param {object} conditions
   * @param {object} [projection] optional fields to return
   * @param {object} [options]
   *
   * @returns {promise} created objects
   */
  find (model, conditions, projection, options) {
    return this._adapter.find(model, conditions, projection, options);
  }

  /**
   * Updates all objects matching the conditions.
   *
   * @param {string} model
   * @param {object} conditions
   * @param {object} updates updates to perform
   * @param {object} [projection] optional fields to return
   * @param {object} [options]
   *
   * @returns {promise} created objects
   */
  update (model, conditions, updates, projection, options) {
    return this._adapter.update(model, conditions, updates, projection, options);
  }
}

Store.CONNECT = CONNECT;
Store.DISCONNECT = DISCONNECT;

Store.IN_MEMORY = IN_MEMORY;
Store.MONGO = MONGO;
Store.MYSQL = MYSQL;

module.exports = Store;
