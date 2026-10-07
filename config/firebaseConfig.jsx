import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence,
  getAuth,
} from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";

// IMPORTANT: Expo Babel (babel-preset-expo) ONLY inlines process.env.EXPO_PUBLIC_*
// when accessed via static dot-notation (never dynamic process.env[name]).
const firebaseConfig = {
  apiKey:
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyBLwq3wVmBL1goLcNnhN4T2Vdad2HWOHKE",
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "coaching-app-e0533.firebaseapp.com",
  projectId:
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ||
    "coaching-app-e0533",
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "coaching-app-e0533.firebasestorage.app",
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    "321313720467",
  appId:
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID ||
    "1:321313720467:web:02cc9099481a9b53a4e566",
  measurementId:
    process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID ||
    "G-5TTMEH52XE",
};

let app = null;
let auth = null;
let db = null;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
} catch (appError) {
  console.warn("Firebase app initialization warning:", appError?.message);
}

if (app) {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  } catch (authError) {
    try {
      auth = getAuth(app);
    } catch (fallbackAuthErr) {
      console.warn("Firebase auth fallback warning:", fallbackAuthErr?.message);
    }
  }

  try {
    db = getFirestore(app);
  } catch (dbError) {
    console.warn("Firebase Firestore warning:", dbError?.message);
  }
}

export { app, auth, db };

