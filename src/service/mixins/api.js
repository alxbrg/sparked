'use strict';

const { promisify } = require('util');
const { is } = require('ramda');

const SERVER_LISTENING = 'server_listening';
const SERVER_CLOSE = 'server_close';

const Api = Super => {
  Super.SERVER_LISTENING = SERVER_LISTENING;
  Super.SERVER_CLOSE = SERVER_CLOSE;

  return class extends Super {
    constructor (options = {}) {
      const {
        server,
        host = 'localhost',
        port = 8080,
      } = options;

      if (
        typeof server !== 'object' ||
        typeof server.listen !== 'function' ||
        typeof server.close !== 'function'
      ) throw new TypeError(
        `'server' must be a server object with 'listen' & 'close' methods.`
      );

      if (!is(String, host))
        throw new TypeError(`'host' must a string.`);

      if (!is(Number, port))
        throw new TypeError(`'port' must a string.`);

      super(options);

      this.host = host;
      this.port = port;

      this._listen = promisify(server.listen.bind(server));
      this._close = promisify(server.close.bind(server));

      this.listening = false;
    }

    async _onConnect () {
      await this._listen(this.port, this.host);

      this.listening = true;
      this.emit(SERVER_LISTENING);
      super._onConnect();
    }

    async _onDisconnect () {
      await this._close();

      this.listening = false;
      this.emit(SERVER_CLOSE);
      super._onDisconnect();
    }
  };
};

module.exports = Api;
