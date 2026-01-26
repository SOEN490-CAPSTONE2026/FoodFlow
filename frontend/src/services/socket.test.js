// Import AFTER mocks so the module under test sees them
import * as stompModule from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import * as socketService from './socket';

jest.mock('sockjs-client', () => {
  const mockCtor = jest.fn(function mockSock(url) {
    return { url };
  });
  return {
    __esModule: true,
    default: mockCtor,
    __getMock: () => mockCtor,
  };
});

jest.mock('@stomp/stompjs', () => {
  const clients = [];
  const Client = function (options) {
    const subscriptions = [];
    const instance = {
      active: false,
      options,
      activate: jest.fn(function () {
        instance.active = true;
      }),
      deactivate: jest.fn(function () {
        instance.active = false;
      }),
      subscribe: jest.fn((destination, cb) => {
        subscriptions.push({ destination, cb });
        return { unsubscribe: jest.fn() };
      }),
      __getSubscriptions: () => subscriptions,
    };
    clients.push(instance);
    return instance;
  };
  return {
    Client,
    __getLastClient: () => clients[clients.length - 1],
    __getAllClients: () => clients.slice(),
  };
});

describe('socket service', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    process.env = { ...OLD_ENV };
    delete process.env.REACT_APP_WS_URL;
    // ensure module-level client is cleared between tests
    try {
      socketService.disconnect();
    } catch (_) {
      // Ignore disconnect errors in tests
    }
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  const triggerConnect = () => {
    const client = stompModule.__getLastClient();
    expect(client).toBeTruthy();
    client.options?.onConnect?.({});
    return client;
  };

  test('creates client, activates, subscribes to all queues, and calls callbacks on JSON payloads', () => {
    const onMessage = jest.fn();
    const onClaim = jest.fn();
    const onCancel = jest.fn();
    const onNewPost = jest.fn();

    socketService.connectToUserQueue(onMessage, onClaim, onCancel, onNewPost);

    const client = stompModule.__getLastClient();
    expect(client).toBeTruthy();
    expect(client.activate).toHaveBeenCalledTimes(1);

    client.options.webSocketFactory();
    expect(SockJS).toHaveBeenCalledWith('http://localhost:8080/ws');

    triggerConnect();
    const subs = client.__getSubscriptions();
    const topics = subs.map(s => s.destination).sort();
    expect(topics).toEqual(
      [
        '/user/queue/messages',
        '/user/queue/claims',
        '/user/queue/claims/cancelled',
        '/user/queue/notifications',
      ].sort()
    );

    subs
      .find(s => s.destination === '/user/queue/messages')
      .cb({ body: JSON.stringify({ a: 1 }) });
    subs
      .find(s => s.destination === '/user/queue/claims')
      .cb({ body: JSON.stringify({ claim: true }) });
    subs
      .find(s => s.destination === '/user/queue/claims/cancelled')
      .cb({ body: JSON.stringify({ cancelled: 1 }) });
    subs
      .find(s => s.destination === '/user/queue/notifications')
      .cb({ body: JSON.stringify({ type: 'NEW_POST', postId: 123 }) });

    expect(onMessage).toHaveBeenCalledWith({ a: 1 });
    expect(onClaim).toHaveBeenCalledWith({ claim: true });
    expect(onCancel).toHaveBeenCalledWith({ cancelled: 1 });
    expect(onNewPost).toHaveBeenCalledWith({ type: 'NEW_POST', postId: 123 });
  });

  test('ignores messages without a body', () => {
    const onMessage = jest.fn();
    const onClaim = jest.fn();
    const onCancel = jest.fn();
    const onNewPost = jest.fn();

    socketService.connectToUserQueue(onMessage, onClaim, onCancel, onNewPost);
    const client = triggerConnect();
    client.__getSubscriptions().forEach(s => s.cb({}));

    expect(onMessage).not.toHaveBeenCalled();
    expect(onClaim).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
    expect(onNewPost).not.toHaveBeenCalled();
  });

  test('appends token to WS URL and sets Authorization header when present', () => {
    localStorage.setItem('jwtToken', 'abc.def.ghi');
    process.env.REACT_APP_WS_URL = 'https://api.example.com/ws';

    socketService.connectToUserQueue(jest.fn(), jest.fn(), jest.fn());

    const client = stompModule.__getLastClient();

    client.options.webSocketFactory();
    expect(SockJS).toHaveBeenCalledWith(
      'https://api.example.com/ws?token=abc.def.ghi'
    );

    expect(client.options.connectHeaders).toEqual({
      Authorization: 'Bearer abc.def.ghi',
    });
  });

  test('reuses existing active client instead of constructing a new one', () => {
    const baseLen = stompModule.__getAllClients().length;

    const first = socketService.connectToUserQueue(
      jest.fn(),
      jest.fn(),
      jest.fn()
    );
    const lenAfterFirst = stompModule.__getAllClients().length;
    expect(lenAfterFirst).toBe(baseLen + 1);

    // Mark as active to trigger reuse path
    const lastClient = stompModule.__getLastClient();
    lastClient.active = true;

    const second = socketService.connectToUserQueue(
      jest.fn(),
      jest.fn(),
      jest.fn()
    );
    const lenAfterSecond = stompModule.__getAllClients().length;

    // Should reuse existing => length unchanged, same instance returned
    expect(lenAfterSecond).toBe(lenAfterFirst);
    expect(second).toBe(first);
  });

  test('disconnect deactivates and resets so a new client is created next time', () => {
    const baseLen = stompModule.__getAllClients().length;

    socketService.connectToUserQueue(jest.fn(), jest.fn(), jest.fn());
    const first = stompModule.__getLastClient();
    const lenAfterFirst = stompModule.__getAllClients().length;
    expect(lenAfterFirst).toBe(baseLen + 1);
    expect(first.deactivate).not.toHaveBeenCalled();

    socketService.disconnect();
    expect(first.deactivate).toHaveBeenCalledTimes(1);

    socketService.connectToUserQueue(jest.fn(), jest.fn(), jest.fn());
    const second = stompModule.__getLastClient();
    const lenAfterSecond = stompModule.__getAllClients().length;

    // After reconnect, we should see exactly one more instance vs base
    expect(second).not.toBe(first);
    expect(lenAfterSecond).toBe(baseLen + 2);
  });
});
