// Unmock the global socket mock from setupTests.js so we can test the real implementation
// Import the socket service after unmocking
import * as socketService from './socket';

// Import mocked modules after they're set up
import SockJS from 'sockjs-client';
import * as stompModule from '@stomp/stompjs';

jest.unmock('./socket');

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
    const onAchievement = jest.fn();
    const onReview = jest.fn();

    socketService.connectToUserQueue(
      onMessage,
      onClaim,
      onCancel,
      onNewPost,
      onAchievement,
      onReview
    );

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
        '/user/queue/achievements',
        '/user/queue/donations/completed',
        '/user/queue/donations/expired',
        '/user/queue/donations/ready-for-pickup',
        '/user/queue/donations/status-changed',
        '/user/queue/donations/status-updated',
        '/user/queue/reviews',
        '/user/queue/verification/approved',
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
    subs
      .find(s => s.destination === '/user/queue/achievements')
      .cb({ body: JSON.stringify({ achievementId: 99 }) });

    expect(onMessage).toHaveBeenCalledWith({ a: 1 });
    expect(onClaim).toHaveBeenCalledWith({ claim: true });
    expect(onCancel).toHaveBeenCalledWith({ cancelled: 1 });
    expect(onNewPost).toHaveBeenCalledWith({ type: 'NEW_POST', postId: 123 });
    expect(onAchievement).toHaveBeenCalledWith({ achievementId: 99 });
  });

  test('ignores messages without a body', () => {
    const onMessage = jest.fn();
    const onClaim = jest.fn();
    const onCancel = jest.fn();
    const onNewPost = jest.fn();

    socketService.connectToUserQueue(
      onMessage,
      onClaim,
      onCancel,
      onNewPost,
      null,
      null
    );
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

    socketService.connectToUserQueue(
      jest.fn(),
      jest.fn(),
      jest.fn(),
      null,
      null,
      null
    );

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

    socketService.connectToUserQueue(
      jest.fn(),
      jest.fn(),
      jest.fn(),
      null,
      null,
      null
    );
    const first = stompModule.__getLastClient();
    const lenAfterFirst = stompModule.__getAllClients().length;
    expect(lenAfterFirst).toBe(baseLen + 1);
    expect(first.deactivate).not.toHaveBeenCalled();

    socketService.disconnect();
    expect(first.deactivate).toHaveBeenCalledTimes(1);

    socketService.connectToUserQueue(
      jest.fn(),
      jest.fn(),
      jest.fn(),
      null,
      null,
      null
    );
    const second = stompModule.__getLastClient();
    const lenAfterSecond = stompModule.__getAllClients().length;

    // After reconnect, we should see exactly one more instance vs base
    expect(second).not.toBe(first);
    expect(lenAfterSecond).toBe(baseLen + 2);
  });

  test('handles JSON parse errors gracefully for /user/queue/messages', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const onMessage = jest.fn();

    socketService.connectToUserQueue(onMessage);
    const client = triggerConnect();

    const messageSub = client
      .__getSubscriptions()
      .find(s => s.destination === '/user/queue/messages');
    messageSub.cb({ body: 'invalid json{' });

    expect(onMessage).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to parse message body',
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
  });

  test('handles JSON parse errors gracefully for /user/queue/claims', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const onClaim = jest.fn();

    socketService.connectToUserQueue(null, onClaim);
    const client = triggerConnect();

    const claimSub = client
      .__getSubscriptions()
      .find(s => s.destination === '/user/queue/claims');
    claimSub.cb({ body: 'not valid json' });

    expect(onClaim).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to parse claim notification',
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
  });

  test('handles JSON parse errors gracefully for /user/queue/claims/cancelled', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const onCancel = jest.fn();

    socketService.connectToUserQueue(null, null, onCancel);
    const client = triggerConnect();

    const cancelSub = client
      .__getSubscriptions()
      .find(s => s.destination === '/user/queue/claims/cancelled');
    cancelSub.cb({ body: '{bad json' });

    expect(onCancel).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to parse claim cancellation',
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
  });

  test('handles JSON parse errors gracefully for /user/queue/notifications', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const onNewPost = jest.fn();

    socketService.connectToUserQueue(null, null, null, onNewPost);
    const client = triggerConnect();

    const notifSub = client
      .__getSubscriptions()
      .find(s => s.destination === '/user/queue/notifications');
    notifSub.cb({ body: 'malformed' });

    expect(onNewPost).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to parse new post notification',
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
  });

  test('handles JSON parse errors gracefully for /user/queue/achievements', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const onAchievement = jest.fn();

    socketService.connectToUserQueue(null, null, null, null, onAchievement);
    const client = triggerConnect();

    const achievementSub = client
      .__getSubscriptions()
      .find(s => s.destination === '/user/queue/achievements');
    achievementSub.cb({ body: '}{' });

    expect(onAchievement).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to parse achievement notification',
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
  });

  test('handles JSON parse errors gracefully for /user/queue/reviews', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const onReview = jest.fn();

    socketService.connectToUserQueue(null, null, null, null, null, onReview);
    const client = triggerConnect();

    const reviewSub = client
      .__getSubscriptions()
      .find(s => s.destination === '/user/queue/reviews');
    reviewSub.cb({ body: 'bad' });

    expect(onReview).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to parse review notification',
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
  });

  test('handles JSON parse errors for /user/queue/donations/completed', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const onDonationCompleted = jest.fn();

    socketService.connectToUserQueue(
      null,
      null,
      null,
      null,
      null,
      null,
      onDonationCompleted
    );
    const client = triggerConnect();

    const donationSub = client
      .__getSubscriptions()
      .find(s => s.destination === '/user/queue/donations/completed');
    donationSub.cb({ body: 'invalid' });

    expect(onDonationCompleted).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to parse donation completion notification',
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
  });

  test('handles JSON parse errors for /user/queue/donations/ready-for-pickup', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const onDonationReadyForPickup = jest.fn();

    socketService.connectToUserQueue(
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      onDonationReadyForPickup
    );
    const client = triggerConnect();

    const readySub = client
      .__getSubscriptions()
      .find(s => s.destination === '/user/queue/donations/ready-for-pickup');
    readySub.cb({ body: 'bad json' });

    expect(onDonationReadyForPickup).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to parse donation ready for pickup notification',
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
  });

  test('handles JSON parse errors for /user/queue/donations/expired', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const onDonationExpired = jest.fn();

    socketService.connectToUserQueue(
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      onDonationExpired
    );
    const client = triggerConnect();

    const expiredSub = client
      .__getSubscriptions()
      .find(s => s.destination === '/user/queue/donations/expired');
    expiredSub.cb({ body: '{]' });

    expect(onDonationExpired).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to parse donation expired notification',
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
  });

  test('handles JSON parse errors for /user/queue/donations/status-updated', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const onDonationStatusUpdated = jest.fn();

    socketService.connectToUserQueue(
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      onDonationStatusUpdated
    );
    const client = triggerConnect();

    const statusUpdatedSub = client
      .__getSubscriptions()
      .find(s => s.destination === '/user/queue/donations/status-updated');
    statusUpdatedSub.cb({ body: 'corrupted' });

    expect(onDonationStatusUpdated).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to parse donation status updated notification',
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
  });

  test('handles JSON parse errors for /user/queue/donations/status-changed', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const onDonationStatusChanged = jest.fn();

    socketService.connectToUserQueue(
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      onDonationStatusChanged
    );
    const client = triggerConnect();

    const statusChangedSub = client
      .__getSubscriptions()
      .find(s => s.destination === '/user/queue/donations/status-changed');
    statusChangedSub.cb({ body: 'not-json' });

    expect(onDonationStatusChanged).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to parse donation status changed notification',
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
  });

  test('handles JSON parse errors for /user/queue/verification/approved', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const onVerificationApproved = jest.fn();

    socketService.connectToUserQueue(
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      onVerificationApproved
    );
    const client = triggerConnect();

    const verificationSub = client
      .__getSubscriptions()
      .find(s => s.destination === '/user/queue/verification/approved');
    verificationSub.cb({ body: '][{' });

    expect(onVerificationApproved).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to parse verification approved notification',
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
  });

  test('calls all donation-related callbacks with valid JSON', () => {
    const onDonationCompleted = jest.fn();
    const onDonationReadyForPickup = jest.fn();
    const onDonationExpired = jest.fn();
    const onDonationStatusUpdated = jest.fn();
    const onDonationStatusChanged = jest.fn();
    const onVerificationApproved = jest.fn();

    socketService.connectToUserQueue(
      null,
      null,
      null,
      null,
      null,
      null,
      onDonationCompleted,
      onDonationReadyForPickup,
      onDonationExpired,
      onDonationStatusUpdated,
      onDonationStatusChanged,
      onVerificationApproved
    );
    const client = triggerConnect();
    const subs = client.__getSubscriptions();

    subs
      .find(s => s.destination === '/user/queue/donations/completed')
      .cb({ body: JSON.stringify({ donationId: 1 }) });
    expect(onDonationCompleted).toHaveBeenCalledWith({ donationId: 1 });

    subs
      .find(s => s.destination === '/user/queue/donations/ready-for-pickup')
      .cb({ body: JSON.stringify({ donationId: 2 }) });
    expect(onDonationReadyForPickup).toHaveBeenCalledWith({ donationId: 2 });

    subs
      .find(s => s.destination === '/user/queue/donations/expired')
      .cb({ body: JSON.stringify({ donationId: 3 }) });
    expect(onDonationExpired).toHaveBeenCalledWith({ donationId: 3 });

    subs
      .find(s => s.destination === '/user/queue/donations/status-updated')
      .cb({ body: JSON.stringify({ donationId: 4 }) });
    expect(onDonationStatusUpdated).toHaveBeenCalledWith({ donationId: 4 });

    subs
      .find(s => s.destination === '/user/queue/donations/status-changed')
      .cb({ body: JSON.stringify({ donationId: 5 }) });
    expect(onDonationStatusChanged).toHaveBeenCalledWith({ donationId: 5 });

    subs
      .find(s => s.destination === '/user/queue/verification/approved')
      .cb({ body: JSON.stringify({ userId: 99 }) });
    expect(onVerificationApproved).toHaveBeenCalledWith({ userId: 99 });
  });

  test('calls onStompError handler when broker reports an error', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    socketService.connectToUserQueue(jest.fn());
    const client = stompModule.__getLastClient();

    const frame = {
      headers: { message: 'Authentication failed' },
      body: 'Invalid credentials',
    };
    client.options.onStompError(frame);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Broker reported error: Authentication failed'
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Additional details: Invalid credentials'
    );
    consoleErrorSpy.mockRestore();
  });

  test('calls onWebSocketError handler when WebSocket error occurs', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    socketService.connectToUserQueue(jest.fn());
    const client = stompModule.__getLastClient();

    const event = { type: 'error', message: 'Connection failed' };
    client.options.onWebSocketError(event);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'WebSocket error occurred:',
      event
    );
    consoleErrorSpy.mockRestore();
  });

  test('calls onDisconnect handler when WebSocket disconnects', () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    socketService.connectToUserQueue(jest.fn());
    const client = stompModule.__getLastClient();

    client.options.onDisconnect();

    expect(consoleLogSpy).toHaveBeenCalledWith('WebSocket disconnected');
    consoleLogSpy.mockRestore();
  });

  test('disconnect handles deactivate errors gracefully', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    socketService.connectToUserQueue(jest.fn());
    const client = stompModule.__getLastClient();

    const deactivateError = new Error('Deactivate failed');
    client.deactivate.mockImplementation(() => {
      throw deactivateError;
    });

    socketService.disconnect();

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Error while disconnecting stompClient',
      deactivateError
    );
    consoleWarnSpy.mockRestore();
  });

  test('disconnect does nothing when stompClient is null', () => {
    socketService.disconnect();
    socketService.disconnect();
    // Should not throw
  });

  test('uses token from sessionStorage when localStorage is empty', () => {
    sessionStorage.setItem('jwtToken', 'session-token-123');

    socketService.connectToUserQueue(jest.fn());
    const client = stompModule.__getLastClient();

    client.options.webSocketFactory();
    expect(SockJS).toHaveBeenCalledWith(
      'http://localhost:8080/ws?token=session-token-123'
    );
  });

  test('calls debug function when STOMP sends debug messages', () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    socketService.connectToUserQueue(jest.fn());
    const client = stompModule.__getLastClient();

    const debugFn = client.options.debug;
    debugFn('STOMP connection established');

    expect(consoleLogSpy).toHaveBeenCalledWith(
      '[STOMP]',
      'STOMP connection established'
    );
    consoleLogSpy.mockRestore();
  });

  test('handles subscription errors for messages queue', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    socketService.connectToUserQueue(jest.fn());
    const client = stompModule.__getLastClient();

    const subscribeError = new Error('Subscription failed');
    client.subscribe.mockImplementationOnce(() => {
      throw subscribeError;
    });

    client.options.onConnect({});

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to subscribe to messages',
      subscribeError
    );
    consoleErrorSpy.mockRestore();
  });

  test('handles subscription errors for claims queue', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    socketService.connectToUserQueue(null, jest.fn());
    const client = stompModule.__getLastClient();

    const subscribeError = new Error('Subscription failed');
    client.subscribe
      .mockImplementationOnce(() => ({ destination: '/user/queue/messages' }))
      .mockImplementationOnce(() => {
        throw subscribeError;
      });

    client.options.onConnect({});

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to subscribe to claims',
      subscribeError
    );
    consoleErrorSpy.mockRestore();
  });

  test('handles subscription errors for claim cancellations queue', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    socketService.connectToUserQueue(null, null, jest.fn());
    const client = stompModule.__getLastClient();

    const subscribeError = new Error('Subscription failed');
    client.subscribe
      .mockImplementationOnce(() => ({ destination: '/user/queue/messages' }))
      .mockImplementationOnce(() => ({ destination: '/user/queue/claims' }))
      .mockImplementationOnce(() => {
        throw subscribeError;
      });

    client.options.onConnect({});

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to subscribe to claim cancellations',
      subscribeError
    );
    consoleErrorSpy.mockRestore();
  });

  test('handles subscription errors for notifications queue', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    socketService.connectToUserQueue(null, null, null, jest.fn());
    const client = stompModule.__getLastClient();

    const subscribeError = new Error('Subscription failed');
    client.subscribe
      .mockImplementationOnce(() => ({ destination: '/user/queue/messages' }))
      .mockImplementationOnce(() => ({ destination: '/user/queue/claims' }))
      .mockImplementationOnce(() => ({
        destination: '/user/queue/claims/cancelled',
      }))
      .mockImplementationOnce(() => {
        throw subscribeError;
      });

    client.options.onConnect({});

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to subscribe to new post notifications',
      subscribeError
    );
    consoleErrorSpy.mockRestore();
  });

  test('handles subscription errors for achievements queue', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    socketService.connectToUserQueue(null, null, null, null, jest.fn());
    const client = stompModule.__getLastClient();

    const subscribeError = new Error('Subscription failed');
    let callCount = 0;
    client.subscribe.mockImplementation(() => {
      callCount++;
      if (callCount === 5) {
        throw subscribeError;
      }
      return { destination: 'dummy' };
    });

    client.options.onConnect({});

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to subscribe to achievement notifications',
      subscribeError
    );
    consoleErrorSpy.mockRestore();
  });

  test('handles subscription errors for reviews queue', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    socketService.connectToUserQueue(null, null, null, null, null, jest.fn());
    const client = stompModule.__getLastClient();

    const subscribeError = new Error('Subscription failed');
    let callCount = 0;
    client.subscribe.mockImplementation(() => {
      callCount++;
      if (callCount === 6) {
        throw subscribeError;
      }
      return { destination: 'dummy' };
    });

    client.options.onConnect({});

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to subscribe to review notifications',
      subscribeError
    );
    consoleErrorSpy.mockRestore();
  });

  test('handles subscription errors for donation completed queue', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    socketService.connectToUserQueue(
      null,
      null,
      null,
      null,
      null,
      null,
      jest.fn()
    );
    const client = stompModule.__getLastClient();

    const subscribeError = new Error('Subscription failed');
    let callCount = 0;
    client.subscribe.mockImplementation(() => {
      callCount++;
      if (callCount === 7) {
        throw subscribeError;
      }
      return { destination: 'dummy' };
    });

    client.options.onConnect({});

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to subscribe to donation completion notifications',
      subscribeError
    );
    consoleErrorSpy.mockRestore();
  });

  test('handles subscription errors for donation ready-for-pickup queue', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    socketService.connectToUserQueue(
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      jest.fn()
    );
    const client = stompModule.__getLastClient();

    const subscribeError = new Error('Subscription failed');
    let callCount = 0;
    client.subscribe.mockImplementation(() => {
      callCount++;
      if (callCount === 8) {
        throw subscribeError;
      }
      return { destination: 'dummy' };
    });

    client.options.onConnect({});

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to subscribe to donation ready for pickup notifications',
      subscribeError
    );
    consoleErrorSpy.mockRestore();
  });

  test('handles subscription errors for donation expired queue', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    socketService.connectToUserQueue(
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      jest.fn()
    );
    const client = stompModule.__getLastClient();

    const subscribeError = new Error('Subscription failed');
    let callCount = 0;
    client.subscribe.mockImplementation(() => {
      callCount++;
      if (callCount === 9) {
        throw subscribeError;
      }
      return { destination: 'dummy' };
    });

    client.options.onConnect({});

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to subscribe to donation expired notifications',
      subscribeError
    );
    consoleErrorSpy.mockRestore();
  });

  test('handles subscription errors for donation status-updated queue', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    socketService.connectToUserQueue(
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      jest.fn()
    );
    const client = stompModule.__getLastClient();

    const subscribeError = new Error('Subscription failed');
    let callCount = 0;
    client.subscribe.mockImplementation(() => {
      callCount++;
      if (callCount === 10) {
        throw subscribeError;
      }
      return { destination: 'dummy' };
    });

    client.options.onConnect({});

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to subscribe to donation status updated notifications',
      subscribeError
    );
    consoleErrorSpy.mockRestore();
  });

  test('handles subscription errors for donation status-changed queue', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    socketService.connectToUserQueue(
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      jest.fn()
    );
    const client = stompModule.__getLastClient();

    const subscribeError = new Error('Subscription failed');
    let callCount = 0;
    client.subscribe.mockImplementation(() => {
      callCount++;
      if (callCount === 11) {
        throw subscribeError;
      }
      return { destination: 'dummy' };
    });

    client.options.onConnect({});

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to subscribe to donation status changed notifications',
      subscribeError
    );
    consoleErrorSpy.mockRestore();
  });

  test('handles subscription errors for verification approved queue', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    socketService.connectToUserQueue(
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      jest.fn()
    );
    const client = stompModule.__getLastClient();

    const subscribeError = new Error('Subscription failed');
    let callCount = 0;
    client.subscribe.mockImplementation(() => {
      callCount++;
      if (callCount === 12) {
        throw subscribeError;
      }
      return { destination: 'dummy' };
    });

    client.options.onConnect({});

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to subscribe to verification approved notifications',
      subscribeError
    );
    consoleErrorSpy.mockRestore();
  });

  test('subscription callbacks handle messages without a body correctly', () => {
    const onDonationCompleted = jest.fn();
    const onDonationReadyForPickup = jest.fn();
    const onDonationExpired = jest.fn();
    const onDonationStatusUpdated = jest.fn();
    const onDonationStatusChanged = jest.fn();
    const onVerificationApproved = jest.fn();

    socketService.connectToUserQueue(
      null,
      null,
      null,
      null,
      null,
      null,
      onDonationCompleted,
      onDonationReadyForPickup,
      onDonationExpired,
      onDonationStatusUpdated,
      onDonationStatusChanged,
      onVerificationApproved
    );
    const client = triggerConnect();
    const subs = client.__getSubscriptions();

    // Send messages without body
    subs.find(s => s.destination === '/user/queue/donations/completed').cb({});
    subs
      .find(s => s.destination === '/user/queue/donations/ready-for-pickup')
      .cb({});
    subs.find(s => s.destination === '/user/queue/donations/expired').cb({});
    subs
      .find(s => s.destination === '/user/queue/donations/status-updated')
      .cb({});
    subs
      .find(s => s.destination === '/user/queue/donations/status-changed')
      .cb({});
    subs
      .find(s => s.destination === '/user/queue/verification/approved')
      .cb({});

    // None of the callbacks should be called
    expect(onDonationCompleted).not.toHaveBeenCalled();
    expect(onDonationReadyForPickup).not.toHaveBeenCalled();
    expect(onDonationExpired).not.toHaveBeenCalled();
    expect(onDonationStatusUpdated).not.toHaveBeenCalled();
    expect(onDonationStatusChanged).not.toHaveBeenCalled();
    expect(onVerificationApproved).not.toHaveBeenCalled();
  });

  test('logs received messages for all subscription types', () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    const onReview = jest.fn();
    const onDonationCompleted = jest.fn();
    const onDonationReadyForPickup = jest.fn();
    const onDonationExpired = jest.fn();
    const onDonationStatusUpdated = jest.fn();
    const onDonationStatusChanged = jest.fn();
    const onVerificationApproved = jest.fn();

    socketService.connectToUserQueue(
      null,
      null,
      null,
      null,
      null,
      onReview,
      onDonationCompleted,
      onDonationReadyForPickup,
      onDonationExpired,
      onDonationStatusUpdated,
      onDonationStatusChanged,
      onVerificationApproved
    );
    const client = triggerConnect();
    const subs = client.__getSubscriptions();

    subs
      .find(s => s.destination === '/user/queue/reviews')
      .cb({ body: JSON.stringify({ reviewId: 1 }) });
    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Received review notification:',
      {
        reviewId: 1,
      }
    );

    subs
      .find(s => s.destination === '/user/queue/donations/completed')
      .cb({ body: JSON.stringify({ donationId: 1 }) });
    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Received donation completion notification:',
      { donationId: 1 }
    );

    subs
      .find(s => s.destination === '/user/queue/donations/ready-for-pickup')
      .cb({ body: JSON.stringify({ donationId: 2 }) });
    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Received donation ready for pickup notification:',
      { donationId: 2 }
    );

    subs
      .find(s => s.destination === '/user/queue/donations/expired')
      .cb({ body: JSON.stringify({ donationId: 3 }) });
    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Received donation expired notification:',
      { donationId: 3 }
    );

    subs
      .find(s => s.destination === '/user/queue/donations/status-updated')
      .cb({ body: JSON.stringify({ donationId: 4 }) });
    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Received donation status updated notification:',
      { donationId: 4 }
    );

    subs
      .find(s => s.destination === '/user/queue/donations/status-changed')
      .cb({ body: JSON.stringify({ donationId: 5 }) });
    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Received donation status changed notification:',
      { donationId: 5 }
    );

    subs
      .find(s => s.destination === '/user/queue/verification/approved')
      .cb({ body: JSON.stringify({ userId: 99 }) });
    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Received verification approved notification:',
      { userId: 99 }
    );

    consoleLogSpy.mockRestore();
  });
});
