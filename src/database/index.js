'use strict';

const {
  InMemoryStore,
} = require('./adapters');

const Model = require('./model');

const IN_MEMORY = 'in-memory';
const MONGO = 'mongo';
const MYSQL = 'mysql';

class Database {
  /**
   * @param {object} options
   * @param {object} [options.adapter] optional custom adapter
   * @param {object} [options.db] option custom database client
   * @param {array} options.schemas array of schemas
   * @param {string} options.type database type ('in-memory', 'mongo' or 'mysql')
   */
  constructor ({
    adapter,
    db,
    schemas,
    type,
  }) {
    const options = { db, schemas };

    // Pick database adapter
    if (adapter)
      this._adapter = adapter;
    else switch (type) {
      case IN_MEMORY:
        this._adapter = new InMemoryStore(options);
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

    // Build models
    this.models = {};
    for (const { name, definition } of schemas)
      this.models[name] = new Model({
        adapter: this._adapter,
        name,
        schema: definition,
      });

    this.connected = false;
    this.options = options;
    this.type = type;
  }

  /**
   * Connects to the database using the options passed to the constructor.
   */
  async connect () {
    if (!this.connected) {
      await this._adapter.connect();
      this.connected = true;
    }
  }

  /**
   * Shuts down the database connection.
   */
  async disconnect () {
    if (this.connected) {
      await this._adapter.disconnect();
      this.connected = false;
    }
  }
}

Database.IN_MEMORY = IN_MEMORY;
Database.MONGO = MONGO;
Database.MYSQL = MYSQL;

module.exports = Database;
