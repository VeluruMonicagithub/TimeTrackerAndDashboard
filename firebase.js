// Firebase initialization helper (compat mode)
// This file initializes Firebase using the compat globals (loaded via CDN in index.html).
// It exposes `window.auth` and `window.db` so existing scripts using compat API work.

// Use `window.FIREBASE_CONFIG` if provided (via firebase-config.js), otherwise use the
// inline fallback config below. For security, avoid committing production credentials.
const firebaseConfig = window.FIREBASE_CONFIG || {
  apiKey: "AIzaSyCzPw_wb787xaPffOWbJMaWxr9pMDO7De8",
  authDomain: "timetrackerapp-e7263.firebaseapp.com",
  projectId: "timetrackerapp-e7263",
  storageBucket: "timetrackerapp-e7263.firebasestorage.app",
  messagingSenderId: "313559529802",
  appId: "1:313559529802:web:b872aac0eebc3fbcec29b3"
};

if (!window.firebase) {
  console.warn('Firebase compat SDK not loaded. Ensure firebase-app-compat.js and friends are included in index.html.');
} else {
  try {
    // initializeApp is available on the compat global
    firebase.initializeApp(firebaseConfig);
    // expose compat auth and firestore instances expected by app.js
    window.auth = firebase.auth();
    window.db = firebase.firestore();
    console.log('Firebase initialized (compat). auth and db globals are available.');
  } catch (e) {
    console.error('Firebase init error', e);
  }
}