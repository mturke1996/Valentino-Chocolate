import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Validate environment variables
const requiredEnvVars = {
  VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check for missing environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value || value.includes('XXXX') || value.includes('your-'))
  .map(([key]) => key);

if (missingVars.length > 0 && import.meta.env.MODE === 'production') {
  console.error('❌ Missing or invalid Firebase environment variables:', missingVars);
  console.error('Please add these variables in Netlify Dashboard → Site settings → Environment variables');
}

const firebaseConfig = {
  apiKey: requiredEnvVars.VITE_FIREBASE_API_KEY || 'demo-key',
  authDomain: requiredEnvVars.VITE_FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  projectId: requiredEnvVars.VITE_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: requiredEnvVars.VITE_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: requiredEnvVars.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: requiredEnvVars.VITE_FIREBASE_APP_ID || '1:123456789:web:demo',
};

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  // Create a dummy app to prevent crashes
  app = initializeApp({
    apiKey: 'demo-key',
    authDomain: 'demo.firebaseapp.com',
    projectId: 'demo-project',
    storageBucket: 'demo-project.appspot.com',
    messagingSenderId: '123456789',
    appId: '1:123456789:web:demo',
  });
}

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;

