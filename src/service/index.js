'use strict';

const { EventEmitter } = require('events');
const { is, isEmpty, pipe } = require('ramda');

const { isArrayOf } = require('../_internal');
const Model = require('../model');
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
    store,
    transport = new Transport(),

    models = [],
    subjects = [ '*', '*.>' ],
  } = {}) {
    super();

    // Assert arguments
    if (!is(Array, models) || (!isEmpty(models) && !isArrayOf(Model, models)))
      throw new TypeError(`'models' must be an array of 'sparked.Model'.`);

    if (!is(Array, subjects) || (!isEmpty(subjects) && !isArrayOf(String, subjects)))
      throw new TypeError(`'subjects' must be an array of strings.`);

    if (store != null && !is(Store, store))
      throw new TypeError(`'store' must be an instance of 'sparked.Store'.`);

    if (!is(Transport, transport))
      throw new TypeError(`'transport' must be an instance of 'sparked.Transport'.`);

    this._store = store;
    this._transport = transport;

    this._models = models;
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

    // Connect models
    if (!isEmpty(this._models))
      for (const model of this._models)
        await model.connect();

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
