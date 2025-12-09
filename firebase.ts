// firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAl513i62QkQ1uWNE9wWeQjyQpRssbo-VE",
  authDomain: "farmdo-5e9cb.firebaseapp.com",
  projectId: "farmdo-5e9cb",
  storageBucket: "farmdo-5e9cb.firebasestorage.app",
  messagingSenderId: "649705136563",
  appId: "1:649705136563:web:37cda00445d76d476f2bc6"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);