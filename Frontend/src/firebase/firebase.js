// Firebase core
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Firebase auth
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";

import axios from "axios";

/* =======================
   Firebase Configuration
   ======================= */

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID, // ✅ REQUIRED
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// 🔴 Hard fail if misconfigured (prevents white screen mystery)
if (!firebaseConfig.projectId) {
  throw new Error(
    "Firebase config error: REACT_APP_FIREBASE_PROJECT_ID is missing"
  );
}

/* =======================
   Initialize Firebase
   ======================= */

const app = initializeApp(firebaseConfig);

// Analytics ONLY in browser (Vercel-safe)
if (typeof window !== "undefined") {
  getAnalytics(app);
}

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

/* =======================
   API Base URL
   ======================= */

const API_BASE =
  process.env.REACT_APP_API_LINK ||
  "https://peaceful-gdg-backend.vercel.app";

/* =======================
   Auth Functions
   ======================= */

export async function LoginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const headers = {
      Authorization: `Bearer ${user.accessToken}`,
    };

    await axios.post(
      `${API_BASE}/api/signupWithGoogle`,
      {},
      { headers, withCredentials: true }
    );

    return true;
  } catch (err) {
    console.error("Google login failed:", err.message);
    return false;
  }
}

export async function LoginWithEmail(email, password) {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    return true;
  } catch (err) {
    console.error("Email login failed:", err.message);
    throw err;
  }
}

export async function SignupWithEmail(email, password) {
  try {
    const result = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = result.user;

    const headers = {
      Authorization: `Bearer ${user.accessToken}`,
    };

    await axios.post(
      `${API_BASE}/api/signup`,
      {},
      { headers, withCredentials: true }
    );

    return true;
  } catch (err) {
    console.error("Signup failed:", err.message);
    throw err;
  }
}

export { auth };
