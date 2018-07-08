'use strict';

const { EventEmitter } = require('events');
const { is, isEmpty } = require('ramda');
const { isNilOrEmpty } = require('ramda-adjunct');

const { isArrayOf } = require('../_internal');
const _Database = require('../database');
const _Transport = require('../transport');

const CONNECT = 'connect';
const DISCONNECT = 'disconnect';
const ERROR = 'error';
const MESSAGE = 'message';

class Service extends EventEmitter {
  /**
   * If called without `options`, the constructor returns a stateless instance listening
   * to every messages on the in-memory bus.
   *
   * @param {object} options
   */
  constructor ({
    dbOptions: {
      Database = _Database,

      adapter: dbAdapter = undefined,
      db = undefined,
      schemas,
      type: dbType = undefined,
    } = {},

    transportOptions: {
      Transport = _Transport,

      adapter: transportAdapter = undefined,
      type: transportType = undefined,
    } = {},

    clients = [],
    stateful = false,
    subjects = [ '*', '*.>' ],
  } = {}) {
    super();

    // if (!is(Array, clients) || (!isEmpty(clients) && !isArrayOf(String, clients)))
    //   throw new TypeError(`'clients' must be an array of clients`);
    if (!is(Boolean, stateful))
      throw new TypeError(`'stateful' must be a boolean`);
    if (!is(Array, subjects) || (!isEmpty(subjects) && !isArrayOf(String, subjects)))
      throw new TypeError(`'subjects' must be an array of strings`);

    this._clients = clients;
    this._stateful = stateful;
    this._subjects = subjects;

    if (this._stateful) {
      // TODO: type-check schemas
      if (isNilOrEmpty(schemas))
        throw new TypeError(`Stateful services require schema definitions.`);

      this._db = new Database({
        adapter: dbAdapter,
        db,
        schemas,
        type: dbType,
      });
    }

    this._transport = new Transport({
      adapter: transportAdapter,
      type: transportType,
    });

    this.connected = false;
  }

  async connect () {
    if (this.connected) return;

    await this._transport.connect();
    if (this._stateful) await this._db.connect();

    this._onConnect();
  }

  _onConnect () {
    this.connected = true;
    this.emit(CONNECT);

    // Subscribe to subjects
    this._subjects.forEach(subject =>
      this._transport.subscribe(subject, this._onMessage.bind(this)));

    // TODO: instantiate the clients
  }

  _onMessage (...args) {
    this.emit(MESSAGE, ...args);
  }

  async disconnect () {
    if (!this.connected) return;

    await this._transport.disconnect();
    if (this._stateful) await this._db.disconnect();

    this._onDisconnect();
  }

  _onDisconnect () {
    this.connected = false;
    this.emit(DISCONNECT);
  }
}

Service.CONNECT = CONNECT;
Service.DISCONNECT = DISCONNECT;
Service.ERROR = ERROR;
Service.MESSAGE = MESSAGE;

module.exports = Service;
