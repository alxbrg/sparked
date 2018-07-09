'use strict';

const uuid = require('uuid/v4');

/**
 * NB: subs are stored in a static map. Although this might be questionable from a design
 * standpoint, it is very convenient as a mocking device and perfectly suited to the
 * intended use-cases.
 */
const _map = new Map();

class InMemoryTransport {
  async connect () {
    this.connected = true;
  }

  async disconnect () {
    this.connected = false;
  }

  subscribe (subject, callback) {
    const sid = uuid();

    // Handle wild cards
    const _subject = `^${subject
      .replace('>',   '[a-zA-Z0-9\\.]+') // '>' full wildcard
      .replace(/\*/g, '[a-zA-Z0-9]+')    // '*' token wildcard
      .replace(/\./g, '\\.')}$`;         // escape dots

    const sub = {
      sid,
      subject: _subject,
      callback,
    };

    this._addSub(sub);

    return sid;
  }

  unsubscribe (sid) {
    _map.delete(sid);
  }

  publish (subject, message, replyTo) {
    const subs = this._getSubsBySubject(subject);

    for (const sub of subs)
      sub.callback(message, replyTo, subject);
  }

  request (subject, message, options, callback) {
    const sid = uuid();

    const sub = {
      sid,
      subject: sid,
      callback,
    };

    this._addSub(sub);

    this.publish(subject, message, sid);

    return sid;
  }

  _addSub (sub) {
    _map.set(sub.sid, sub);
  }

  _getSubsBySubject (subject) {
    return Array.from(_map.values()).filter(({ subject: _subject }) =>
      new RegExp(_subject, 'g').test(subject));
  }
}

module.exports = InMemoryTransport;
