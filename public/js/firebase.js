import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: "movie-app-application.firebaseapp.com",
  projectId: "movie-app-application",
  storageBucket: "movie-app-application.firebasestorage.app",
  messagingSenderId: "776065797209",
  appId: "1:776065797209:web:b902e0dafb732c81d57548"
};


const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };