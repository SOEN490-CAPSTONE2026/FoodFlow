import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

let stompClient = null;

/**
 * Connects to the backend STOMP endpoint and subscribes to the user's private queue.
 * onMessage is called with parsed message payload when a message arrives.
 */
export function connectToUserQueue(onMessage) {
  if (stompClient && stompClient.active) {
    return stompClient;
  }

  const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
  const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:8080/ws';

  // If we have a token, append it as a query param so the backend handshake interceptor can read it.
  const wsUrlWithToken = token ? `${WS_URL}?token=${encodeURIComponent(token)}` : WS_URL;

  stompClient = new Client({
    webSocketFactory: () => new SockJS(wsUrlWithToken),
    connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
    debug: (str) => {
      // Keep a light debug; remove or guard in production
      // console.log('[STOMP]', str);
    },
    reconnectDelay: 5000,
    onConnect: (frame) => {
      // Subscribe to user-specific queue. Spring will deliver messages for the authenticated principal.
      // Server destination will typically be /user/queue/messages (adjust if your backend uses a different path)
      try {
        stompClient.subscribe('/user/queue/messages', (msg) => {
          if (msg.body) {
            try {
              const payload = JSON.parse(msg.body);
              onMessage && onMessage(payload);
            } catch (e) {
              console.error('Failed to parse STOMP message body', e);
            }
          }
        });
      } catch (e) {
        console.error('STOMP subscribe error', e);
      }
    },
    onStompError: (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    },
  });

  stompClient.activate();
  return stompClient;
}

export function disconnect() {
  if (stompClient) {
    try {
      stompClient.deactivate();
    } catch (e) {
      console.warn('Error while disconnecting stompClient', e);
    }
    stompClient = null;
  }
}
