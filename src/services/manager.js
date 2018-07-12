'use strict';

const Service = require('./service');

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

class Manager extends Service {
  /**
   * Constructs a stateful service listening for create | delete | find | update requests
   * and forwards the queries to a db.
   *
   * @param {object} [options]
   * @param {object} [options.db]
   * @param {object} [options.transport = new Transport()]
   */
  constructor (options = {}) {
    super({
      ...options,
      stateful: true,
    });

    this._subjects = this._db._schemas.reduce((acc, { name }) => {
      const model = name.toLowerCase();
      return [
        ...acc,
        `${model}.${CREATE}`,
        `${model}.${DELETE}`,
        `${model}.${FIND}`,
        `${model}.${UPDATE}`,
      ];
    }, []);
  }

  async _onMessage (message, replyTo, subject) {
    super._onMessage(message, replyTo, subject);

    const [ model, action ] = subject.split('.');

    let data = [];

    try {
      switch (action) {
        case CREATE:
          data = await this._create(model, message);
          break;
        case DELETE:
          data = await this._delete(model, message);
          break;
        case FIND:
          data = await this._find(model, message);
          break;
        case UPDATE:
          data = await this._update(model, message);
          break;
      }
    } catch (error) {
      this._reply(replyTo, { error });
      this.emit(Service.ERROR, error);
    }

    this._reply(replyTo, { data });
  }

  _create (model, { objects, projection, options }) {
    return this._db.create(model, objects, projection, options)
      .then(this._publishEvent.bind(this, model, CREATED));
  }

  _delete (model, { conditions, projection, options }) {
    return this._db.delete(model, conditions, projection, options)
      .then(this._publishEvent.bind(this, model, DELETED));
  }

  _find (model, { conditions, projection, options }) {
    return this._db.find(model, conditions, projection, options)
      .then(this._publishEvent.bind(this, model, FOUND));
  }

  _update (model, { conditions, updates, projection, options }) {
    return this._db.update(model, conditions, updates, projection, options)
      .then(this._publishEvent.bind(this, model, UPDATED));
  }

  _publishEvent (model, event, data) {
    this._transport.publish(`${model}.${event}`, { data });
    return data;
  }

  _reply (replyTo, reply) {
    return this._transport.publish(replyTo, reply);
  }
}

Manager.CREATE = CREATE;
Manager.DELETE = DELETE;
Manager.FIND = FIND;
Manager.UPDATE = UPDATE;

Manager.CREATED = CREATED;
Manager.DELETED = DELETED;
Manager.FOUND = FOUND;
Manager.UPDATED = UPDATED;

module.exports = Manager;
