'use strict';

const { EventEmitter } = require('events');
const { is, isEmpty } = require('ramda');

const { isArrayOf } = require('../_internal');
const Database = require('../database');
const Transport = require('../transport');

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
    db,
    transport = new Transport(),

    clients = [],
    stateful = false,
    subjects = [ '*', '*.>' ],
  } = {}) {
    super();

    // if (!is(Array, clients) || (!isEmpty(clients) && !isArrayOf(String, clients)))
    //   throw new TypeError(`'clients' must be an array of clients`);
    if (!is(Boolean, stateful))
      throw new TypeError(`'stateful' must be a boolean.`);
    if (!is(Array, subjects) || (!isEmpty(subjects) && !isArrayOf(String, subjects)))
      throw new TypeError(`'subjects' must be an array of strings.`);

    if (stateful && !is(Database, db))
      throw new TypeError(`'db' must be an instance of 'sparked.Database'.`);
    if (!is(Transport, transport))
      throw new TypeError(`'transport' must be an instance of 'sparked.Transport'.`);

    this._db = db;
    this._transport = transport;

    this._clients = clients;
    this._stateful = stateful;
    this._subjects = subjects;

    this.connected = false;
  }

  async connect () {
    if (this.connected) return;

    // TODO: handle connection error
    await this._transport.connect();
    if (this._stateful) await this._db.connect();

    // Subscribe to subjects
    this._subjects.forEach(subject =>
      this._transport.subscribe(subject, this._onMessage.bind(this)));

    this.connected = true;
    this.emit(CONNECT);
  }

  _onMessage (...args) {
    this.emit(MESSAGE, ...args);
  }

  async disconnect () {
    if (!this.connected) return;

    await this._transport.disconnect();
    if (this._stateful) await this._db.disconnect();

    this.connected = false;
    this.emit(DISCONNECT);
  }
}

Service.CONNECT = CONNECT;
Service.DISCONNECT = DISCONNECT;
Service.ERROR = ERROR;
Service.MESSAGE = MESSAGE;

module.exports = Service;
