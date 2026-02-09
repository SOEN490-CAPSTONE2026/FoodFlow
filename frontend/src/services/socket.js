import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

let stompClient = null;

/**
 * Connects to the backend STOMP endpoint and subscribes to the user's private queues.
 * @param {Function} onMessage - Called with parsed message payload from /user/queue/messages
 * @param {Function} onClaimNotification - Called with parsed claim notification from /user/queue/claims
 * @param {Function} onClaimCancelled - Called with parsed cancellation from /user/queue/claims/cancelled
 * @param {Function} onNewPostNotification - Called with parsed new post notification from /user/queue/notifications
 * @param {Function} onAchievementUnlocked - Called with parsed achievement notification from /user/queue/achievements
 * @param {Function} onReviewReceived - Called with parsed review notification from /user/queue/reviews
 * @param {Function} onDonationCompleted - Called with parsed donation completion notification from /user/queue/donations/completed
 * @param {Function} onDonationReadyForPickup - Called with parsed ready for pickup notification from /user/queue/donations/ready-for-pickup
 * @param {Function} onDonationExpired - Called with parsed expired donation notification from /user/queue/donations/expired
 * @param {Function} onDonationStatusUpdated - Called with parsed status updated notification from /user/queue/donations/status-updated
 * @param {Function} onDonationStatusChanged - Called with parsed status changed notification from /user/queue/donations/status-changed
 */
export function connectToUserQueue(
  onMessage,
  onClaimNotification,
  onClaimCancelled,
  onNewPostNotification,
  onAchievementUnlocked,
  onReviewReceived,
  onDonationCompleted,
  onDonationReadyForPickup,
  onDonationExpired,
  onDonationStatusUpdated,
  onDonationStatusChanged
) {
  console.log('connectToUserQueue called');

  if (stompClient && stompClient.active) {
    console.log('Returning existing active WebSocket connection');
    return stompClient;
  }

  const token =
    localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
  console.log('JWT Token found:', token ? 'YES' : 'NO');

  const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:8080/ws';
  console.log('WS_URL:', WS_URL);

  // If we have a token, append it as a query param so the backend handshake interceptor can read it.
  const wsUrlWithToken = token
    ? `${WS_URL}?token=${encodeURIComponent(token)}`
    : WS_URL;
  console.log('Final WebSocket URL:', wsUrlWithToken);

  try {
    console.log('Creating new STOMP client...');
    stompClient = new Client({
      webSocketFactory: () => new SockJS(wsUrlWithToken),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      debug: str => {
        // Keep a light debug; remove or guard in production
        console.log('[STOMP]', str);
      },
      reconnectDelay: 5000,
      onConnect: frame => {
        console.log('WebSocket connected successfully');

        // Subscribe to user-specific message queue
        try {
          stompClient.subscribe('/user/queue/messages', msg => {
            if (msg.body) {
              try {
                const payload = JSON.parse(msg.body);
                console.log('Received message:', payload);
                onMessage && onMessage(payload);
              } catch (e) {
                console.error('Failed to parse message body', e);
              }
            }
          });
          console.log('Subscribed to /user/queue/messages');
        } catch (e) {
          console.error('Failed to subscribe to messages', e);
        }

        // Subscribe to claim notifications
        try {
          stompClient.subscribe('/user/queue/claims', msg => {
            if (msg.body) {
              try {
                const payload = JSON.parse(msg.body);
                console.log('Received claim notification:', payload);
                onClaimNotification && onClaimNotification(payload);
              } catch (e) {
                console.error('Failed to parse claim notification', e);
              }
            }
          });
          console.log('Subscribed to /user/queue/claims');
        } catch (e) {
          console.error('Failed to subscribe to claims', e);
        }

        // Subscribe to claim cancellations
        try {
          stompClient.subscribe('/user/queue/claims/cancelled', msg => {
            if (msg.body) {
              try {
                const payload = JSON.parse(msg.body);
                console.log('Received claim cancellation:', payload);
                onClaimCancelled && onClaimCancelled(payload);
              } catch (e) {
                console.error('Failed to parse claim cancellation', e);
              }
            }
          });
          console.log('Subscribed to /user/queue/claims/cancelled');
        } catch (e) {
          console.error('Failed to subscribe to claim cancellations', e);
        }

        // Subscribe to new post notifications (for receivers)
        try {
          stompClient.subscribe('/user/queue/notifications', msg => {
            if (msg.body) {
              try {
                const payload = JSON.parse(msg.body);
                console.log('Received new post notification:', payload);
                onNewPostNotification && onNewPostNotification(payload);
              } catch (e) {
                console.error('Failed to parse new post notification', e);
              }
            }
          });
          console.log('Subscribed to /user/queue/notifications');
        } catch (e) {
          console.error('Failed to subscribe to new post notifications', e);
        }

        // Subscribe to achievement unlock notifications
        try {
          stompClient.subscribe('/user/queue/achievements', msg => {
            if (msg.body) {
              try {
                const payload = JSON.parse(msg.body);
                console.log('Received achievement notification:', payload);
                onAchievementUnlocked && onAchievementUnlocked(payload);
              } catch (e) {
                console.error('Failed to parse achievement notification', e);
              }
            }
          });
          console.log('Subscribed to /user/queue/achievements');
        } catch (e) {
          console.error('Failed to subscribe to achievement notifications', e);
        }

        // Subscribe to review notifications
        try {
          stompClient.subscribe('/user/queue/reviews', msg => {
            if (msg.body) {
              try {
                const payload = JSON.parse(msg.body);
                console.log('Received review notification:', payload);
                onReviewReceived && onReviewReceived(payload);
              } catch (e) {
                console.error('Failed to parse review notification', e);
              }
            }
          });
          console.log('Subscribed to /user/queue/reviews');
        } catch (e) {
          console.error('Failed to subscribe to review notifications', e);
        }

        // Subscribe to donation completion notifications
        try {
          stompClient.subscribe('/user/queue/donations/completed', msg => {
            if (msg.body) {
              try {
                const payload = JSON.parse(msg.body);
                console.log(
                  'Received donation completion notification:',
                  payload
                );
                onDonationCompleted && onDonationCompleted(payload);
              } catch (e) {
                console.error(
                  'Failed to parse donation completion notification',
                  e
                );
              }
            }
          });
          console.log('Subscribed to /user/queue/donations/completed');
        } catch (e) {
          console.error(
            'Failed to subscribe to donation completion notifications',
            e
          );
        }

        // Subscribe to donation ready for pickup notifications
        try {
          stompClient.subscribe(
            '/user/queue/donations/ready-for-pickup',
            msg => {
              if (msg.body) {
                try {
                  const payload = JSON.parse(msg.body);
                  console.log(
                    'Received donation ready for pickup notification:',
                    payload
                  );
                  onDonationReadyForPickup && onDonationReadyForPickup(payload);
                } catch (e) {
                  console.error(
                    'Failed to parse donation ready for pickup notification',
                    e
                  );
                }
              }
            }
          );
          console.log('Subscribed to /user/queue/donations/ready-for-pickup');
        } catch (e) {
          console.error(
            'Failed to subscribe to donation ready for pickup notifications',
            e
          );
        }

        // Subscribe to donation expired notifications
        try {
          stompClient.subscribe(
            '/user/queue/donations/expired',
            msg => {
              if (msg.body) {
                try {
                  const payload = JSON.parse(msg.body);
                  console.log('Received donation expired notification:', payload);
                  onDonationExpired && onDonationExpired(payload);
                } catch (e) {
                  console.error(
                    'Failed to parse donation expired notification',
                    e
                  );
                }
              }
            }
          );
          console.log('Subscribed to /user/queue/donations/expired');
        } catch (e) {
          console.error(
            'Failed to subscribe to donation expired notifications',
            e
          );
        }

        // Subscribe to donation status updated notifications (for donors)
        try {
          stompClient.subscribe(
            '/user/queue/donations/status-updated',
            msg => {
              if (msg.body) {
                try {
                  const payload = JSON.parse(msg.body);
                  console.log(
                    'Received donation status updated notification:',
                    payload
                  );
                  onDonationStatusUpdated && onDonationStatusUpdated(payload);
                } catch (e) {
                  console.error(
                    'Failed to parse donation status updated notification',
                    e
                  );
                }
              }
            }
          );
          console.log('Subscribed to /user/queue/donations/status-updated');
        } catch (e) {
          console.error(
            'Failed to subscribe to donation status updated notifications',
            e
          );
        }

        // Subscribe to donation status changed notifications (for receivers)
        try {
          stompClient.subscribe(
            '/user/queue/donations/status-changed',
            msg => {
              if (msg.body) {
                try {
                  const payload = JSON.parse(msg.body);
                  console.log(
                    'Received donation status changed notification:',
                    payload
                  );
                  onDonationStatusChanged && onDonationStatusChanged(payload);
                } catch (e) {
                  console.error(
                    'Failed to parse donation status changed notification',
                    e
                  );
                }
              }
            }
          );
          console.log('Subscribed to /user/queue/donations/status-changed');
        } catch (e) {
          console.error(
            'Failed to subscribe to donation status changed notifications',
            e
          );
        }
      },
      onStompError: frame => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
      },
      onWebSocketError: event => {
        console.error('WebSocket error occurred:', event);
      },
      onDisconnect: () => {
        console.log('WebSocket disconnected');
      },
    });

    console.log('STOMP client created, calling activate()...');
    stompClient.activate();
    console.log('stompClient.activate() called successfully');
    return stompClient;
  } catch (error) {
    console.error('ERROR creating or activating STOMP client:', error);
    throw error;
  }
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
