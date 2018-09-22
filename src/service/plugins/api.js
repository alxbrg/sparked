'use strict';

const { is } = require('ramda');

const SERVER_LISTENING = 'server_listening';
const SERVER_CLOSE = 'server_close';

const Api = Super => {
  Super.SERVER_LISTENING = SERVER_LISTENING;
  Super.SERVER_CLOSE = SERVER_CLOSE;

  return class extends Super {
    constructor (options = {}) {
      super(options);

      const {
        server,
        host = 'localhost',
        port = 8080,
      } = options;

      if (!is(Function)) throw new TypeError(`'server' must be a function.`);

      if (!is(String, host))
        throw new TypeError(`'host' must a string.`);

      if (!is(String, port) && !is(Number, port))
        throw new TypeError(`'port' must a string or a number.`);

      // Provide `this` as context to the server
      this._server = server(this);

      if (!is(Function, this._server.listen))
        throw new TypeError(
          `'server' must a return a server with a 'listen' function.`
        );

      this.host = host;
      this.port = port;

      this.listening = false;
    }

    async _onConnect () {
      await this._server.listen(this.port, this.host);

      this.listening = true;
      this.emit(SERVER_LISTENING);
      super._onConnect();
    }

    async _onDisconnect () {
      if (is(Function, this._server.close)) await this._server.close();

      this.listening = false;
      this.emit(SERVER_CLOSE);
      super._onDisconnect();
    }
  };
};

module.exports = Api;
