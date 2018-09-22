'use strict';

const { Service } = require('../../../src');

const Api = Service.use(Service.mixins.Api);

describe('Api', () => {
  const server = () => ({ listen: () => {} });

  describe('constructor', () => {
    test('invalid options', () => {
      /* eslint-disable no-new */
      expect(() => { new Api(); }).toThrow();
      expect(() => { new Api({ server: 1 }); }).toThrow();
      expect(() => { new Api({ server: () => ({ listen: 1 }) }); }).toThrow();
      expect(() => { new Api({ server, host: 1 }); }).toThrow();
      expect(() => { new Api({ server, port: true }); }).toThrow();
      /* eslint-enable no-new */
    });

    test('valid options', () => {
      const host = 'host';
      const port = 4000;
      const api = new Api({ server, host, port });

      expect(api.host).toEqual(host);
      expect(api.port).toEqual(port);
    });

    test('defaults', () => {
      const api = new Api({ server });

      expect(api.host).toEqual('localhost');
      expect(api.port).toEqual(8080);
    });
  });

  test('connect/disconnect', async () => {
    const api = new Api({ server });

    // Connect
    const onListening = jest.fn();
    api.on(Api.SERVER_LISTENING, onListening);
    await api.connect();

    expect(api.connected).toBe(true);
    expect(api.listening).toBe(true);
    expect(onListening).toHaveBeenCalledTimes(1);

    // Disconnect
    const onClose = jest.fn();
    api.on(Api.SERVER_CLOSE, onClose);
    await api.disconnect();

    expect(api.connected).toBe(false);
    expect(api.listening).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
