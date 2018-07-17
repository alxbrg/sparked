'use strict';

const { EventEmitter } = require('events');
const { is, isEmpty, pipe } = require('ramda');

const { isArrayOf } = require('../_internal');
const Client = require('../client');
const Database = require('../database');
const Transport = require('../transport');

const mixins = require('./mixins');

const CONNECT = 'connect';
const DISCONNECT = 'disconnect';
const ERROR = 'error';
const MESSAGE = 'message';

class Service extends EventEmitter {
  /**
   * If called without `options`, the constructor returns a stateless instance listening
   * to every messages on the in-memory bus.
   *
   * @param {object} [options]
   * @param {object} [options.db]
   * @param {object} [options.transport = new Transport()]
   * @param {array} [options.subjects = ['*', '*.>']]
   */
  constructor ({
    db,
    transport = new Transport(),

    clients = [],
    subjects = [ '*', '*.>' ],
  } = {}) {
    super();

    // Assert arguments
    if (!is(Array, clients) || (!isEmpty(clients) && !isArrayOf(Client, clients)))
      throw new TypeError(`'clients' must be an array of 'sparked.Client'.`);

    if (!is(Array, subjects) || (!isEmpty(subjects) && !isArrayOf(String, subjects)))
      throw new TypeError(`'subjects' must be an array of strings.`);

    if (db != null && !is(Database, db))
      throw new TypeError(`'db' must be an instance of 'sparked.Database'.`);

    if (!is(Transport, transport))
      throw new TypeError(`'transport' must be an instance of 'sparked.Transport'.`);

    this._db = db;
    this._transport = transport;

    this._clients = clients;
    this._subjects = subjects;

    this.connected = false;
  }

  static use (...Mixins) {
    return pipe(...Mixins)(this);
  }

  /**
   * Connects the transport, connects the db if applicable and subscribes to the subjects.
   */
  async connect () {
    if (this.connected) return;

    // TODO: handle connection error
    // Connect transport
    await this._transport.connect();

    // Connect db
    if (this._db) await this._db.connect();

    // Connect clients
    if (!isEmpty(this._clients))
      for (const client of this._clients)
        await client.connect();

    // Subscribe to subjects
    this._subjects.forEach(subject =>
      this._transport.subscribe(subject, this._onMessage.bind(this)));

    return this._onConnect();
  }

  _onConnect () {
    this.connected = true;
    this.emit(CONNECT);
  }

  /**
   * Emits everything received as `message` events.
   */
  _onMessage (...args) {
    this.emit(MESSAGE, ...args);
  }

  /**
   * Disconnects the transport and db if applicable.
   */
  async disconnect () {
    if (!this.connected) return;

    // Disconnect transport
    await this._transport.disconnect();

    // Disconnect db
    if (this._db) await this._db.disconnect();

    return this._onDisconnect();
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

Service.mixins = mixins;

module.exports = Service;
