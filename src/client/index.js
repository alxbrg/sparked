'use strict';

const { EventEmitter } = require('events');
const { is } = require('ramda');

const {
  actions: {
    CREATE,
    DELETE,
    FIND,
    UPDATE,
  },

  events: {
    CREATED,
    DELETED,
    FOUND,
    UPDATED,
  },
} = require('../_internal');

const Transport = require('../transport');

const CONNECT = 'connect';
const DISCONNECT = 'disconnect';

class Client extends EventEmitter {
  /**
   * Based on a single entity, makes requests to create | delete | find | update objects.
   * Emits created | deleted | found | updated events when reads and writes are performed.
   *
   * @param {object} options
   * @param {object} options.entity
   * @param {object} [options.transport]
   */
  constructor ({
    entity,
    transport = new Transport(),
  } = {}) {
    super();

    if (!is(Transport, transport))
      throw new TypeError(`'transport' must be an instance of Transport.`);
    if (entity == null)
      throw new TypeError(`'entity' must be set.`);

    this.entity = entity.toLowerCase();
    this._transport = transport;

    this.connected = false;
  }

  /**
   * Connects transport and subscribes to create, delete, find and update events related
   * to client's entity.
   */
  async connect () {
    if (this.connected) return;

    await this._transport.connect();

    // Subscribe to entity action events
    // TODO: handle disconnections
    [
      CREATED,
      DELETED,
      FOUND,
      UPDATED,
    ].map(event => this._transport.subscribe(
      `${this.entity}.${event}`,
      message => this.emit(event, message)
    ));

    this.connected = true;
    this.emit(CONNECT);
  }

  /**
   * Makes a request to create | delete | find | update an entity. Resolves with the
   * response and rejects if it contains any error.
   *
   * @param {string} action
   * @param {object} message
   *
   * @returns {promise} object(s) | error
   */
  _request (action, message) {
    return new Promise((resolve, reject) => {
      this._transport.request(
        `${this.entity}.${action}`,
        message,
        this._options,
        ({ error, data }) => {
          if (error) reject(new Error(error));
          resolve(data);
        });
    });
  }

  /**
   * Requests the insert of an object or objects into the data store.
   *
   * @param {array} objects object(s) to insert
   * @param {object} [projection] optional fields to return
   * @param {object} [options]
   *
   * @returns {promise} object(s) | error
   */
  create (objects, projection, options) {
    return this._request(CREATE, { objects, projection, options });
  }

  /**
   * Requests the deletion of the objects matching the conditions.
   *
   * @param {object} conditions
   * @param {object} [projection] optional fields to return
   * @param {object} [options]
   *
   * @returns {promise} object(s) | error
   */
  delete (conditions, projection, options) {
    return this._request(DELETE, { conditions, projection, options });
  }

  /**
   * Requests all objects matching the conditions.
   *
   * @param {object} conditions
   * @param {object} [projection] optional fields to return
   * @param {object} [options]
   *
   * @returns {promise} object(s) | error
   */
  find (conditions, projection, options) {
    return this._request(FIND, { conditions, projection, options });
  }

  /**
   * Requests the update of the objects matching the conditions.
   *
   * @param {object} conditions
   * @param {object} updates updates to perform
   * @param {object} [projection] optional fields to return
   * @param {object} [options]
   *
   * @returns {promise} object(s) | error
   */
  update (conditions, updates, projection, options) {
    return this._request(UPDATE, { conditions, updates, projection, options });
  }

  /**
   * Disconnects the transport.
   */
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

Client.CREATED = CREATED;
Client.DELETED = DELETED;
Client.FOUND = FOUND;
Client.UPDATED = UPDATED;

Client.CONNECT = CONNECT;
Client.DISCONNECT = DISCONNECT;

module.exports = Client;
