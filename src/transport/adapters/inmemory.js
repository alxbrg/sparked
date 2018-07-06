'use strict';

const uuid = require('uuid/v4');

const subsBySid = new Map();
const subsBySubject = new Map();

class InMemoryTransport {
  async connect () {
    this.connected = true;
  }

  async disconnect () {
    this.connected = false;
  }

  subscribe (subject, callback) {
    const sid = uuid();

    const sub = {
      sid,
      subject,
      callback,
    };

    this._addSub(sub);

    return sid;
  }

  unsubscribe (sid) {
    const sub = subsBySid.get(sid);

    if (sub == null) return;

    subsBySid.delete(sid);
    subsBySubject.get(sub.subject).delete(sid);
  }

  publish (subject, message, replyTo) {
    const subs = subsBySubject.get(subject) || new Map();

    for (const sub of subs.values())
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
    subsBySid.set(sub.sid, sub);

    // NB: `subsBySubject` is a map (by subject) of maps (by sid)
    const subjectSubs = subsBySubject.get(sub.subject) || new Map();
    subjectSubs.set(sub.sid, sub);
    subsBySubject.set(sub.subject, subjectSubs);
  }
}

module.exports = InMemoryTransport;
