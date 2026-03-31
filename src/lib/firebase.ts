import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC7qsYVd35vuqwcQ51pSCSr9jMbN24k5Ks",
  authDomain: "purps-2a873.firebaseapp.com",
  projectId: "purps-2a873",
  storageBucket: "purps-2a873.firebasestorage.app",
  messagingSenderId: "749518140433",
  appId: "1:749518140433:web:4067ae906e7f7f45ccedb0",
  measurementId: "G-FJJWPWRNE6"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export default app;
