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
    if (options.db == null)
      throw new TypeError(`'db' is required`);

    super(options);

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
          data = await this._onCreate(model, message);
          break;
        case DELETE:
          data = await this._onDelete(model, message);
          break;
        case FIND:
          data = await this._onFind(model, message);
          break;
        case UPDATE:
          data = await this._onUpdate(model, message);
          break;
      }
    } catch (error) {
      this._reply(replyTo, { error });
      this.emit(Service.ERROR, error);
    }

    this._reply(replyTo, { data });
  }

  /**
   * Called when a `create` message is emitted.
   *
   * @param {string} model
   * @param {object} message
   * @param {object} message.objects
   * @param {object} message.projection
   * @param {object} message.options
   */
  _onCreate (model, { objects, projection, options }) {
    return this._create(model, objects, projection, options);
  }

  /**
   * @param {object} model
   * @param {object} objects
   * @param {object} projection
   * @param {object} options
   */
  _create (model, objects, projection, options) {
    return this._db.create(model, objects, projection, options)
      .then(this._publishEvent.bind(this, model, CREATED));
  }

  /**
   * Called when a `delete` message is emitted.
   *
   * @param {string} model
   * @param {object} message
   * @param {object} message.conditions
   * @param {object} message.projection
   * @param {object} message.options
   */
  _onDelete (model, { conditions, projection, options }) {
    return this._delete(model, conditions, projection, options);
  }

  /**
   * @param {object} model
   * @param {object} conditions
   * @param {object} projection
   * @param {object} options
   */
  _delete (model, conditions, projection, options) {
    return this._db.delete(model, conditions, projection, options)
      .then(this._publishEvent.bind(this, model, DELETED));
  }

  /**
   * Called when a `find` message is emitted.
   *
   * @param {string} model
   * @param {object} message
   * @param {object} message.conditions
   * @param {object} message.projection
   * @param {object} message.options
   */
  _onFind (model, { conditions, projection, options }) {
    return this._find(model, conditions, projection, options);
  }

  /**
   * @param {object} model
   * @param {object} conditions
   * @param {object} projection
   * @param {object} options
   */
  _find (model, conditions, projection, options) {
    return this._db.find(model, conditions, projection, options)
      .then(this._publishEvent.bind(this, model, FOUND));
  }

  /**
   * Called when an `update` message is emitted.
   *
   * @param {string} model
   * @param {object} message
   * @param {object} message.objects
   * @param {object} message.projection
   * @param {object} message.options
   */
  _onUpdate (model, { conditions, updates, projection, options }) {
    return this._update(model, conditions, updates, projection, options);
  }

  /**
   * @param {object} model
   * @param {object} conditions
   * @param {object} updates
   * @param {object} projection
   * @param {object} options
   */
  _update (model, conditions, updates, projection, options) {
    return this._db.update(model, conditions, updates, projection, options)
      .then(this._publishEvent.bind(this, model, UPDATED));
  }

  /**
   * Publishes `data` to '`model`.`event`'.
   *
   * @param {string} model
   * @param {string} event
   * @param {array} data
   */
  _publishEvent (model, event, data) {
    this._transport.publish(`${model}.${event}`, { data });
    return data;
  }

  /**
   * @param {string} replyTo
   * @param {object} reply
   */
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
