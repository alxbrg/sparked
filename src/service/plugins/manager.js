'use strict';

const Service = require('../index');

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
} = require('../../_internal');

const Manager = Super => {
  Super.CREATE = CREATE;
  Super.DELETE = DELETE;
  Super.FIND = FIND;
  Super.UPDATE = UPDATE;

  Super.CREATED = CREATED;
  Super.DELETED = DELETED;
  Super.FOUND = FOUND;
  Super.UPDATED = UPDATED;

  return class extends Super {
  /**
   * Constructs a stateful service listening for create | delete | find | update requests
   * and forwards the queries to a store.
   *
   * @param {object} [options]
   * @param {object} [options.store]
   * @param {object} [options.transport = new Transport()]
   */
    constructor (options = {}) {
      if (options.store == null)
        throw new TypeError(`'store' is required`);

      super(options);

      this._subjects = this._store._modelNames.reduce((acc, modelName) => {
        const _modelName = modelName.toLowerCase();
        return [
          ...acc,
          `${_modelName}.${CREATE}`,
          `${_modelName}.${DELETE}`,
          `${_modelName}.${FIND}`,
          `${_modelName}.${UPDATE}`,
        ];
      }, options.subjects || []);
    }

    async _onMessage (message, replyTo, subject) {
      super._onMessage(message, replyTo, subject);

      const [ modelName, action ] = subject.split('.');

      let data = [];

      try {
        switch (action) {
          case CREATE:
            data = await this._onCreate(modelName, message);
            break;
          case DELETE:
            data = await this._onDelete(modelName, message);
            break;
          case FIND:
            data = await this._onFind(modelName, message);
            break;
          case UPDATE:
            data = await this._onUpdate(modelName, message);
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
   * @param {string} modelName
   * @param {object} message
   * @param {object} message.objects
   * @param {object} message.projection
   * @param {object} message.options
   */
    _onCreate (modelName, { objects, projection, options }) {
      return this._create(modelName, objects, projection, options);
    }

    /**
   * @param {object} modelName
   * @param {object} objects
   * @param {object} projection
   * @param {object} options
   */
    _create (modelName, objects, projection, options) {
      return this._store.create(modelName, objects, projection, options)
        .then(this._publishEvent.bind(this, modelName, CREATED));
    }

    /**
   * Called when a `delete` message is emitted.
   *
   * @param {string} modelName
   * @param {object} message
   * @param {object} message.conditions
   * @param {object} message.projection
   * @param {object} message.options
   */
    _onDelete (modelName, { conditions, projection, options }) {
      return this._delete(modelName, conditions, projection, options);
    }

    /**
   * @param {object} modelName
   * @param {object} conditions
   * @param {object} projection
   * @param {object} options
   */
    _delete (modelName, conditions, projection, options) {
      return this._store.delete(modelName, conditions, projection, options)
        .then(this._publishEvent.bind(this, modelName, DELETED));
    }

    /**
   * Called when a `find` message is emitted.
   *
   * @param {string} modelName
   * @param {object} message
   * @param {object} message.conditions
   * @param {object} message.projection
   * @param {object} message.options
   */
    _onFind (modelName, { conditions, projection, options }) {
      return this._find(modelName, conditions, projection, options);
    }

    /**
   * @param {object} modelName
   * @param {object} conditions
   * @param {object} projection
   * @param {object} options
   */
    _find (modelName, conditions, projection, options) {
      return this._store.find(modelName, conditions, projection, options)
        .then(this._publishEvent.bind(this, modelName, FOUND));
    }

    /**
   * Called when an `update` message is emitted.
   *
   * @param {string} modelName
   * @param {object} message
   * @param {object} message.objects
   * @param {object} message.projection
   * @param {object} message.options
   */
    _onUpdate (modelName, { conditions, updates, projection, options }) {
      return this._update(modelName, conditions, updates, projection, options);
    }

    /**
   * @param {object} modelName
   * @param {object} conditions
   * @param {object} updates
   * @param {object} projection
   * @param {object} options
   */
    _update (modelName, conditions, updates, projection, options) {
      return this._store.update(modelName, conditions, updates, projection, options)
        .then(this._publishEvent.bind(this, modelName, UPDATED));
    }

    /**
   * Publishes `data` to '`modelName`.`event`'.
   *
   * @param {string} modelName
   * @param {string} event
   * @param {array} data
   */
    _publishEvent (modelName, event, data) {
      this._transport.publish(`${modelName}.${event}`, { data });
      return data;
    }

    /**
   * @param {string} replyTo
   * @param {object} reply
   */
    _reply (replyTo, reply) {
      return this._transport.publish(replyTo, reply);
    }
  };
};

module.exports = Manager;
