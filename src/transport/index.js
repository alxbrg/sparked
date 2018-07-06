'use strict';

const { EventEmitter } = require('events');

const {
  InMemoryTransport,
} = require('./adapters');

const CONNECT = 'connect';
const DISCONNECT = 'disconnect';
const IN_MEMORY = 'in-memory';
const NATS = 'nats';

class Transport extends EventEmitter {
  /**
   * @param {object} options
   * @param {object} [options.adapter] optional custom adapter
   * @param {string} options.type transport type ('in-memory' or 'nats')
   */
  constructor ({
    adapter,
    type,
    ...options
  }) {
    super();

    // Pick database adapter
    if (adapter)
      this._adapter = adapter;
    else switch (type) {
      case IN_MEMORY:
        this._adapter = new InMemoryTransport(options);
        break;
      // case NATS:
      //   this._adapter = new Nats(options);
      //   break;
      default:
        throw new TypeError(`'type' must be one of: '${IN_MEMORY}' | '${NATS}'.`);
    }
  }

  get connected () {
    return this._adapter.connected;
  }

  get disconnected () {
    return this._adapter.disconnected;
  }

  /**
   * Connects to the message bus.
   */
  async connect () {
    await this._adapter.connect();
    this.emit(CONNECT);
  }

  /**
   * Disconnects from the message bus.
   */
  async disconnect () {
    await this._adapter.disconnect();
    this.emit(DISCONNECT);
  }

  /**
   * Subscribe callback.
   *
   * @callback callback
   * @param {*} message
   * @param {string} replyTo
   * @param {string} subject
   */

  /**
   * Subscribes to a subject. The passed callback is called when a message is published
   * to that subject.
   *
   * @param {string} subject
   * @param {callback} callback
   *
   * @returns {string} sid of the subscriber
   */
  subscribe (subject, callback) {
    return this._adapter.subscribe(subject, callback);
  }

  /**
   * Unsubscribes a subscriber by its sid.
   *
   * @param {string} sid subscriber id
   */
  unsubscribe (sid) {
    return this._adapter.unsubscribe(sid);
  }

  /**
   * Publish a message to the given subject.
   *
   * @param {string} subject
   * @param {*} message
   * @param {string} [replyTo]
   */
  publish (subject, message, replyTo) {
    return this._adapter.publish(subject, message, replyTo);
  }

  /**
   * Subscribe to an ad hoc subject to get a reply after publishing using this ad hoc
   * subject as the replyTo.
   *
   * @param {string} subject
   * @param {*} message
   * @param {object} options
   * @param {callback} callback
   */
  request (subject, message, options, callback) {
    return this._adapter.request(subject, message, options, callback);
  }
}

Transport.CONNECT = CONNECT;
Transport.DISCONNECT = DISCONNECT;
Transport.IN_MEMORY = IN_MEMORY;
Transport.NATS = NATS;

module.exports = Transport;
