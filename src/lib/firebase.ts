import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Fallback empty config to prevent crash if file is missing during dev
const firebaseConfig = {
  apiKey: "placeholder",
  authDomain: "placeholder",
  projectId: "placeholder",
  storageBucket: "placeholder",
  messagingSenderId: "placeholder",
  appId: "placeholder"
};

// In a real app, this would be imported from firebase-applet-config.json
// But since the setup tool failed, we will use environment variables or a placeholder
// so the app at least renders the UI.

let app;
try {
  // @ts-ignore - this file might not exist yet if set_up_firebase fails
  import config from '../../firebase-applet-config.json';
  app = initializeApp(config);
} catch (e) {
  console.warn("Firebase config not found. Please run 'set_up_firebase' again.");
  app = initializeApp(firebaseConfig);
}

export const auth = getAuth(app);
export const db = getFirestore(app);
