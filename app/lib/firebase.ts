import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCW1aH2CWkc8Rr1ATT_gQ7OvHPrPLmXmr4",
  authDomain: "tamim-gym-8e5ca.firebaseapp.com",
  projectId: "tamim-gym-8e5ca",
  storageBucket: "tamim-gym-8e5ca.firebasestorage.app",
  messagingSenderId: "1060909153909",
  appId: "1:1060909153909:web:0fc6a9510ad8768fbc823c",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
