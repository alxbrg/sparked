'use strict';

const { EventEmitter } = require('events');
const { is, isEmpty } = require('ramda');

const Transport = require('../transport');
const {
  isArrayOf,

  actions: {
    CALL,
    CREATE,
    DELETE,
    FIND,
    UPDATE,
  },

  events: {
    CALLED,
    CREATED,
    DELETED,
    FOUND,
    UPDATED,
  },
} = require('../_internal');

const CONNECT = 'connect';
const DISCONNECT = 'disconnect';

class Client extends EventEmitter {
  /**
   *
   * @param {object} options
   * @param {object} [options.transport]
   */
  constructor ({
    transport = new Transport(),
  } = {}) {
    super();

    if (!is(Transport, transport))
      throw new TypeError(`'transport' must be an instance of sparked.Transport.`);

    this._transport = transport;

    this.connected = false;
  }

  /**
   * Connects the transport.
   */
  async connect () {
    if (this.connected) return;

    await this._transport.connect();

    this.connected = true;
    this.emit(CONNECT);
  }

  /**
   * Attach listeners to:
   *  - calls to `controllers`
   *  - all CRUD operations performed on `models`
   *
   * @param {object} options
   * @param {object} [options.controllers] e.g.: { `<service>.<controller>`: () => {} }
   * @param {object} [options.models]
   */
  watch ({ controllers = {}, models = {} } = {}) {
    if (isEmpty(controllers) && isEmpty(models))
      throw new TypeError(`One of 'constructors' or 'models' must be set.`);

    const isValid = x =>
      is(Object, x) &&
      (isEmpty(x) || isArrayOf(Function, Object.values(x)));

    if (!isValid(controllers) || !isValid(models)) throw new TypeError(
      `'controllers' and 'models' must be objects mapping keys to functions.`
    );

    // Subscribe to calls
    Object.keys(controllers).forEach(ctrlName => {
      this._transport.subscribe(
        `${ctrlName}.${CALLED}`,
        message => this.emit(ctrlName, message)
      );

      this.on(ctrlName, controllers[ctrlName]);
    });

    // Subscribe to the models' CRUD events
    Object.keys(models).forEach(modelName => {
      [
        CREATED,
        DELETED,
        FOUND,
        UPDATED,
      ].map(event => this._transport.subscribe(
        `${modelName}.${event}`,
        message => this.emit(modelName, event, message)
      ));

      this.on(modelName, models[modelName]);
    });
  }

  /**
   * Calls a controller method on a remote service.
   *
   * @param {string} controllerSlug a string identifying a service's controller (format:
   * `<service>.<controller>`)
   * @param {...any} args
   *
   * @returns {promise} object(s) | error
   */
  call (controllerSlug, ...args) {
    return this._request(`${controllerSlug}.${CALL}`, { args });
  }

  /**
   * Requests the insert of an object or objects into the data store.
   *
   * @param {string} modelName
   * @param {array} objects object(s) to insert
   * @param {object} [projection] optional fields to return
   * @param {object} [options]
   *
   * @returns {promise} object(s) | error
   */
  create (modelName, objects, projection, options) {
    return this._crud(modelName, CREATE, { objects, projection, options });
  }

  /**
   * Requests the deletion of the objects matching the conditions.
   *
   * @param {string} modelName
   * @param {object} conditions
   * @param {object} [projection] optional fields to return
   * @param {object} [options]
   *
   * @returns {promise} object(s) | error
   */
  delete (modelName, conditions, projection, options) {
    return this._crud(modelName, DELETE, { conditions, projection, options });
  }

  /**
   * Requests all objects matching the conditions.
   *
   * @param {string} modelName
   * @param {object} conditions
   * @param {object} [projection] optional fields to return
   * @param {object} [options]
   *
   * @returns {promise} object(s) | error
   */
  find (modelName, conditions, projection, options) {
    return this._crud(modelName, FIND, { conditions, projection, options });
  }

  /**
   * Requests the update of the objects matching the conditions.
   *
   * @param {string} modelName
   * @param {object} conditions
   * @param {object} updates updates to perform
   * @param {object} [projection] optional fields to return
   * @param {object} [options]
   *
   * @returns {promise} object(s) | error
   */
  update (modelName, conditions, updates, projection, options) {
    return this._crud(modelName, UPDATE, { conditions, updates, projection, options });
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

  /**
   * Wraps transport requests in promises that resolve with the reply or reject when
   * errors are returned.
   *
   * @param {string} subject
   * @param {objet} message
   *
   * @returns {promise} object(s) | error
   */
  _request (subject, message) {
    return new Promise((resolve, reject) => {
      this._transport.request(
        subject,
        message,
        this._options,
        ({ error, data }) => {
          if (error) reject(new Error(error));
          resolve(data);
        });
    });
  }

  /**
   * Makes a request to create | delete | find | update the underlying entities.
   *
   * @param {string} modelName
   * @param {string} action
   * @param {object} args
   *
   * @returns {promise} object(s) | error
   */
  _crud (modelName, action, args) {
    return this._request(`${modelName}.${action}`, args);
  }
}

Client.CONNECT = CONNECT;
Client.DISCONNECT = DISCONNECT;

Client.CALL = CALL;
Client.CREATE = CREATE;
Client.DELETE = DELETE;
Client.FIND = FIND;
Client.UPDATE = UPDATE;

Client.CALLED = CALLED;
Client.CREATED = CREATED;
Client.DELETED = DELETED;
Client.FOUND = FOUND;
Client.UPDATED = UPDATED;

module.exports = Client;
