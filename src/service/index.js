'use strict';

const { EventEmitter } = require('events');
const { is, isEmpty, pipe } = require('ramda');

const { isArrayOf } = require('../_internal');
const Client = require('../client');
const Store = require('../store');
const Transport = require('../transport');

const plugins = require('./plugins');

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
   * @param {object} [options.store]
   * @param {object} [options.transport = new Transport()]
   * @param {array} [options.subjects = ['*', '*.>']]
   */
  constructor ({
    name,
    store,
    transport = new Transport(),

    clients = [],
    subjects = [],
  } = {}) {
    super();

    // Assert arguments
    if (!is(String, name))
      throw new TypeError(`'name' must be a string.`);

    if (store != null && !is(Store, store))
      throw new TypeError(`'store' must be an instance of 'sparked.Store'.`);

    if (!is(Transport, transport))
      throw new TypeError(`'transport' must be an instance of 'sparked.Transport'.`);

    if (!is(Array, clients) || (!isEmpty(clients) && !isArrayOf(Client, clients)))
      throw new TypeError(`'clients' must be an array of 'sparked.Client'.`);

    if (!is(Array, subjects) || (!isEmpty(subjects) && !isArrayOf(String, subjects)))
      throw new TypeError(`'subjects' must be an array of strings.`);

    this.name = name;

    this._store = store;
    this._transport = transport;

    this._clients = clients;
    this._subjects = subjects;

    this.connected = false;
  }

  /**
   * Returns a new class composing one or several plugins with this class.
   *
   * @param  {...function} plugins unary function(s) returning classes
   *
   * @returns {class} class
   */
  static use (...plugins) {
    plugins.forEach(Plugin => {
      if (!is(Function, Plugin) || Plugin.length !== 1)
        throw new TypeError(`'plugins' must be unary functions returning classes.`);
    });

    return pipe(...plugins)(this);
  }

  /**
   * Connects the transport, connects the store if applicable and subscribes to the
   * subjects.
   */
  async connect () {
    if (this.connected) return;

    // TODO: handle connection error
    // Connect transport
    await this._transport.connect();

    // Connect store
    if (this._store) await this._store.connect();

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
   * Emits every 'message' events and provides a hook for plugins or extensions.
   *
   * @param {object} message
   * @param {string} [replyTo]
   * @param {string} subject
   */
  async _onMessage (message, replyTo, subject) {
    this.emit(MESSAGE, message, replyTo, subject);
  }

  /**
   * Disconnects the transport and store if applicable.
   */
  async disconnect () {
    if (!this.connected) return;

    // Disconnect transport
    await this._transport.disconnect();

    // Disconnect store
    if (this._store) await this._store.disconnect();

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

Service.plugins = plugins;

module.exports = Service;
