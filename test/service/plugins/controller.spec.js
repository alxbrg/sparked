'use strict';

const {
  Service,
  Transport,
} = require('../../../src');

const Controller = Service.use(Service.plugins.Controller);

const func = jest.fn().mockImplementation(() => 'result');
func.constructor = Function;
const opts = {
  name: 'service',
  controllers: {
    func,
  },
};

describe('Controller', () => {
  describe('constructor', () => {
    test('throws without valid controllers', () => {
      /* eslint-disable no-new */
      expect(() => { new Controller({ controllers: '' }); }).toThrow();
      /* eslint-enable no-new */
    });

    test('defaults', () => {
      const controller = new Controller(opts);

      expect(controller._transport).toBeInstanceOf(Transport);
      expect(controller._subjects).toEqual(['service.func.call']);
    });
  });

  describe('_onMessage', async () => {
    const controller = new Controller(opts);
    const client = new Transport();
    const onMessage = jest.fn();
    const onCall = jest.fn();

    client.subscribe('service.func.called', onCall);

    controller.on(Controller.MESSAGE, onMessage);
    controller.on(Controller.ERROR, () => {}); // ignore errors

    beforeAll(async () => {
      await controller.connect();
    });

    test('emits call events', () => {
      client.publish('service.func.call', 'message');
      expect(onMessage).toHaveBeenCalledWith('message', undefined, 'service.func.call');
    });

    test('calls controllers', done => {
      func.mockClear();

      client.request('service.func.call', { args: ['arg'] }, null, data => {
        const expected = { data: 'result' };

        expect(func).toHaveBeenCalledWith('arg');
        expect(data).toEqual(expected);
        expect(onCall).toHaveBeenCalledWith(expected, undefined, 'service.func.called');

        done();
      });
    });
  });
});
