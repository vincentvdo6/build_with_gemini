import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";  // database
import { getStorage } from "firebase/storage";        // file storage
import { getAuth } from "firebase/auth";              // authentication

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "buildwithgemini-4c3a2.firebaseapp.com",
  projectId: "buildwithgemini-4c3a2",
  storageBucket: "buildwithgemini-4c3a2.firebasestorage.app",
  messagingSenderId: "660722655587",
  appId: "1:660722655587:web:5cbfc79ce152430040f356"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);