// Create mock implementations for Firebase SDK functions
const mockInitializeApp = jest.fn((config) => ({ 
  name: '[DEFAULT]',
  options: config 
}));

const mockGetAnalytics = jest.fn((app) => ({ 
  app,
  measurementId: 'G-NNSDLTMQ29'
}));

const mockGetAuth = jest.fn((app) => ({ 
  app,
  currentUser: null
}));

// Mock Firebase SDK functions to test the actual firebase.js initialization
jest.mock('firebase/app', () => ({
  initializeApp: mockInitializeApp,
}));

jest.mock('firebase/analytics', () => ({
  getAnalytics: mockGetAnalytics,
}));

jest.mock('firebase/auth', () => ({
  getAuth: mockGetAuth,
}));

// Unmock the firebase.js module to test the actual code
jest.unmock('../firebase');

describe('Firebase Configuration', () => {
  let firebaseModule;

  beforeAll(() => {
    // Require firebase module once to execute the actual code
    firebaseModule = require('../firebase');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('exports app instance', () => {
    expect(firebaseModule).toHaveProperty('app');
    expect(firebaseModule.app).toBeDefined();
    expect(firebaseModule.app).not.toBeNull();
  });

  test('exported app has name property', () => {
    expect(firebaseModule.app).toHaveProperty('name');
    expect(firebaseModule.app.name).toBe('[DEFAULT]');
  });

  test('exported app has options with configuration', () => {
    expect(firebaseModule.app).toHaveProperty('options');
    expect(firebaseModule.app.options).toBeDefined();
  });

  test('app options contains apiKey', () => {
    expect(firebaseModule.app.options.apiKey).toBe('AIzaSyCJBJqzAUkzs9Hb_6cbBT5TTaEo4KKUbVc');
  });

  test('app options contains correct authDomain', () => {
    expect(firebaseModule.app.options.authDomain).toBe('foodflow-2026.firebaseapp.com');
  });

  test('app options contains correct projectId', () => {
    expect(firebaseModule.app.options.projectId).toBe('foodflow-2026');
  });

  test('app options contains correct storageBucket', () => {
    expect(firebaseModule.app.options.storageBucket).toBe('foodflow-2026.firebasestorage.app');
  });

  test('app options contains correct messagingSenderId', () => {
    expect(firebaseModule.app.options.messagingSenderId).toBe('75633139386');
  });

  test('app options contains correct appId', () => {
    expect(firebaseModule.app.options.appId).toBe('1:75633139386:web:3cc7e8ddd208bf52dbec83');
  });

  test('app options contains correct measurementId', () => {
    expect(firebaseModule.app.options.measurementId).toBe('G-NNSDLTMQ29');
  });

  test('exports analytics instance', () => {
    expect(firebaseModule).toHaveProperty('analytics');
    expect(firebaseModule.analytics).toBeDefined();
    expect(firebaseModule.analytics).not.toBeNull();
  });

  test('exported analytics has app reference', () => {
    expect(firebaseModule.analytics).toHaveProperty('app');
    expect(firebaseModule.analytics.app).toBeDefined();
  });

  test('exports auth instance', () => {
    expect(firebaseModule).toHaveProperty('auth');
    expect(firebaseModule.auth).toBeDefined();
    expect(firebaseModule.auth).not.toBeNull();
  });

  test('exported auth has expected methods', () => {
    expect(firebaseModule.auth).toHaveProperty('app');
    expect(firebaseModule.auth).toHaveProperty('currentUser');
  });

  test('exports all three main Firebase services', () => {
    expect(Object.keys(firebaseModule)).toContain('app');
    expect(Object.keys(firebaseModule)).toContain('analytics');
    expect(Object.keys(firebaseModule)).toContain('auth');
  });

  test('app options has all required configuration keys', () => {
    const requiredKeys = [
      'apiKey',
      'authDomain',
      'projectId',
      'storageBucket',
      'messagingSenderId',
      'appId',
      'measurementId',
    ];

    requiredKeys.forEach(key => {
      expect(firebaseModule.app.options).toHaveProperty(key);
      expect(firebaseModule.app.options[key]).toBeTruthy();
    });
  });
});
