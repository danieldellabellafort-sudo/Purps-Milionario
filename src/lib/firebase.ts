import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCYN0efB4QjPytoCfbmi_ze-_kICX8HmWY",
  authDomain: "purps-72c7f.firebaseapp.com",
  databaseURL: "https://purps-72c7f-default-rtdb.firebaseio.com",
  projectId: "purps-72c7f",
  storageBucket: "purps-72c7f.firebasestorage.app",
  messagingSenderId: "410785323533",
  appId: "1:410785323533:web:3ad96ee91f689cfd901344",
  measurementId: "G-NNNKHG15SM"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export default app;
