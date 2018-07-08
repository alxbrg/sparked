'use strict';

const { isNilOrEmpty } = require('ramda-adjunct');
const Service = require('./service');

const CREATE = 'create';
const DELETE = 'delete';
const FIND = 'find';
const UPDATE = 'update';

class Manager extends Service {
  constructor (options) {
    const {
      dbOptions: {
        schemas,
      },
    } = options;

    const subjects = schemas.reduce((acc, { name: model }) => ([
      ...acc,
      `${model}.${CREATE}`,
      `${model}.${FIND}`,
      `${model}.${UPDATE}`,
    ]), []);

    super({
      subjects,
      stateful: true,
      ...options,
    });
  }

  async _onMessage (message, replyTo, subject) {
    const [ model, action ] = subject.split('.');
    if (isNilOrEmpty(model) || isNilOrEmpty(action)) return;

    let data = [];

    try {
      switch (action) {
        case DELETE:
          data = await this._delete(model, message);
          break;
        case CREATE:
          data = await this._create(model, message);
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

  _delete (model, { objects, projection, options }) {
    return this._db.delete(model, objects, projection, options);
  }

  _create (model, { conditions, projection, options }) {
    return this._db.create(model, conditions, projection, options);
  }

  _find (model, { conditions, projection, options }) {
    return this._db.find(model, conditions, projection, options);
  }

  _update (model, { conditions, projection, options }) {
    return this._db.find(model, conditions, projection, options);
  }

  _reply (replyTo, reply) {
    return this._transport.publish(replyTo, { reply });
  }
}

Manager.CREATE = CREATE;
Manager.DELETE = DELETE;
Manager.FIND = FIND;
Manager.UPDATE = UPDATE;

module.exports = Manager;
