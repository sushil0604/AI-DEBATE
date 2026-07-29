import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
} from "firebase/auth";

// Replace with your project's config from Firebase Console > Project Settings
const firebaseConfig = {
  apiKey: "AIzaSyBmvzNgzxLFtxDtfHX2uMNHMtIAZomapNg",
  authDomain: "ai-debate-19032.firebaseapp.com",
  projectId: "ai-debate-19032",
  storageBucket: "ai-debate-19032.firebasestorage.app",
  messagingSenderId: "1039830091111",
  appId: "1:1039830091111:web:2f983464cfaad9faaa1bc2",
  measurementId: "G-MK6D8F7X84"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();