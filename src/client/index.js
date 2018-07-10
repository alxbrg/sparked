'use strict';

const { EventEmitter } = require('events');
const { is } = require('ramda');

const {
  constants: {
    CREATE,
    DELETE,
    FIND,
    UPDATE,
  },
} = require('../_internal');

const Transport = require('../transport');

const CONNECT = 'connect';
const DISCONNECT = 'disconnect';

class Client extends EventEmitter {
  constructor ({
    schema,
    transport = new Transport(),
  } = {}) {
    super();

    if (!is(Transport, transport))
      throw new TypeError(`'transport' must be an instance of Transport.`);
    if (schema == null)
      throw new TypeError(`'schema' must be set.`);

    this._schema = schema;
    this._transport = transport;

    this.connected = false;
  }

  async connect () {
    if (this.connected) return;

    await this._transport.connect();

    // Subscribe to entity action events
    // TODO: handle disconnections
    [
      CREATE,
      DELETE,
      FIND,
      UPDATE,
    ].map(action => this._transport.subscribe(
      `${action}.${this._schema.name.toLowerCase()}`,
      message => this.emit(action, message)
    ));

    this.connected = true;
    this.emit(CONNECT);
  }

  _request (action, message) {
    return new Promise((resolve, reject) => {
      this._transport.request(
        `${this._schema.name.toLowerCase()}.${action}`,
        message,
        this._options,
        ({ error, data }) => {
          if (error) reject(error);
          resolve(data);
        });
    });
  }

  create (objects, projection, options) {
    return this._request(CREATE, { objects, projection, options });
  }

  delete (conditions, projection, options) {
    return this._request(DELETE, { conditions, projection, options });
  }

  find (conditions, projection, options) {
    return this._request(FIND, { conditions, projection, options });
  }

  update (conditions, updates, projection, options) {
    return this._request(UPDATE, { conditions, updates, projection, options });
  }

  async disconnect () {
    if (!this.connected) return;

    await this._transport.disconnect();

    this.connected = false;
    this.emit(DISCONNECT);
  }
}

Client.CREATE = CREATE;
Client.DELETE = DELETE;
Client.FIND = FIND;
Client.UPDATE = UPDATE;

Client.CONNECT = CONNECT;
Client.DISCONNECT = DISCONNECT;

module.exports = Client;
