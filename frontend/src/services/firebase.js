// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCJBJqzAUkzs9Hb_6cbBT5TTaEo4KKUbVc",
  authDomain: "foodflow-2026.firebaseapp.com",
  projectId: "foodflow-2026",
  storageBucket: "foodflow-2026.firebasestorage.app",
  messagingSenderId: "75633139386",
  appId: "1:75633139386:web:3cc7e8ddd208bf52dbec83",
  measurementId: "G-NNSDLTMQ29"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

export { app, analytics, auth };
