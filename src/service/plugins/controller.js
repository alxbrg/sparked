'use strict';

const { is, isEmpty } = require('ramda');

const {
  isArrayOf,
  actions: { CALL },
  events: { CALLED },
} = require('../../_internal');

const Manager = Super => {
  Super.CALL = CALL;
  Super.CALLED = CALLED;

  return class extends Super {
    /**
     * Constructs a service that ties functions to subjects, allowing them to be called
     * remotely via the message bus.
     *
     * @param {object} options
     * @param {object} options.controllers
     */
    constructor (options = {}) {
      const { controllers = {} } = options;

      if (
        !is(Object, controllers) ||
        (!isEmpty(controllers) && !isArrayOf(Function, Object.values(controllers)))
      )
        throw new TypeError(`'controllers' must be an object mapping keys to functions.`);

      super(options);

      this._subjects = this._subjects.concat(
        Object.keys(controllers).map(ctrl => `${this.name}.${ctrl}.${CALL}`)
      );
      this._controllers = controllers;
    }

    async _onMessage (message, replyTo, subject) {
      await super._onMessage(message, replyTo, subject);

      // Call controller
      const [ , controllerName ] = subject.split('.');
      const controller = this._controllers[controllerName];

      if (is(Function, controller)) {
        const { args = [] } = message;
        let reply;

        try {
          const data = await controller.call(this, ...args);
          reply = { data };
        } catch (error) {
          reply = { error };
        }

        // Reply to request
        this._transport.publish(replyTo, reply);

        // Publish a 'called' event
        this._transport.publish(`${this.name}.${controllerName}.${CALLED}`, reply);
      }
    }
  };
};

module.exports = Manager;
