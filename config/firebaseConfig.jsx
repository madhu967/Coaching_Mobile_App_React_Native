import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence,
  getAuth,
  Auth,
} from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBLwq3wVmBL1goLcNnhN4T2Vdad2HWOHKE",
  authDomain: "coaching-app-e0533.firebaseapp.com",
  projectId: "coaching-app-e0533",
  storageBucket: "coaching-app-e0533.firebasestorage.app",
  messagingSenderId: "321313720467",
  appId: "1:321313720467:web:02cc9099481a9b53a4e566",
  measurementId: "G-5TTMEH52XE",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth;
try {
  auth = getAuth(app);
} catch (error) {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
}

export { auth };
export const db = getFirestore(app);
