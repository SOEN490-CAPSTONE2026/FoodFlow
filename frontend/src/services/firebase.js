// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyCJBJqzAUkzs9Hb_6cbBT5TTaEo4KKUbVc',
  authDomain: 'foodflow-2026.firebaseapp.com',
  projectId: 'foodflow-2026',
  storageBucket: 'foodflow-2026.firebasestorage.app',
  messagingSenderId: '75633139386',
  appId: '1:75633139386:web:3cc7e8ddd208bf52dbec83',
  measurementId: 'G-NNSDLTMQ29',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth is always initialized — required for OTP / forgot-password, independent of analytics consent.
const auth = getAuth(app);

// Analytics is lazily initialized — getAnalytics() must NOT be called until the user has
// explicitly accepted cookies, because Firebase auto-fires session_start / first_visit events
// the moment getAnalytics() runs, before any setAnalyticsCollectionEnabled(false) call can stop them.
let _analytics = null;
const getAnalyticsInstance = () => {
  if (!_analytics) {
    _analytics = getAnalytics(app);
  }
  return _analytics;
};

/** True only after consent has been given and getAnalyticsInstance() has been called. */
const isAnalyticsInitialized = () => _analytics !== null;

export { app, auth, getAnalyticsInstance, isAnalyticsInitialized };
