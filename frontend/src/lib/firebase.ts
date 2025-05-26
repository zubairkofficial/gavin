import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyByKAsAvxmmpnAPRGdy5Y-CvtK52g2Qfn8",
  authDomain: "gavin-ai-5b7ea.firebaseapp.com",
  projectId: "gavin-ai-5b7ea",
  storageBucket: "gavin-ai-5b7ea.firebasestorage.app",
  messagingSenderId: "1019148744998",
  appId: "1:1019148744998:web:f61695452a5d39e48ba9e7",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider(); 