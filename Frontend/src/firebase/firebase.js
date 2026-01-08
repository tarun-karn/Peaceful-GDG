// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import axios from "axios";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey:
    (typeof process !== "undefined" && process.env?.REACT_APP_FIREBASE_API_KEY) ||
    "",
  authDomain:
    (typeof process !== "undefined" &&
      process.env?.REACT_APP_FIREBASE_AUTH_DOMAIN) ||
    "",
  projectId:
    (typeof process !== "undefined" &&
      process.env?.REACT_APP_FIREBASE_PROJECT_ID) ||
    "",
  storageBucket:
    (typeof process !== "undefined" &&
      process.env?.REACT_APP_FIREBASE_STORAGE_BUCKET) ||
    "",
  messagingSenderId:
    (typeof process !== "undefined" &&
      process.env?.REACT_APP_FIREBASE_MESSAGING_SENDER_ID) ||
    "",
  appId:
    (typeof process !== "undefined" && process.env?.REACT_APP_FIREBASE_APP_ID) ||
    "",
  measurementId:
    (typeof process !== "undefined" &&
      process.env?.REACT_APP_FIREBASE_MEASUREMENT_ID) ||
    "",
};

// Initialize Firebase
// console.log(firebaseConfig)
const app = initializeApp(firebaseConfig);
getAnalytics(app);

const provider = new GoogleAuthProvider();
const auth = getAuth();

async function LoginWithGoogle() {
  auth.languageCode = "it";

  try {
    const data = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(data);
    const token = credential.accessToken;
    console.log(credential);
    const user = data.user;
    console.log(user);
    //  //from here we will send data to backend to store the email
    // const info = getAdditionalUserInfo(data).isNewUser; //If this is true we will send the mail along with uid of firebase and uuid of chat
    //  // If this is false we will just user the access token...
    const headers = {
      token: "Bearer " + user.accessToken,
    };
    console.log(headers);

    const signup = await axios.post(
      ((typeof process !== "undefined" && process.env?.REACT_APP_API_LINK) ||
        "https://peaceful-gdg-backend.vercel.app") + "/signupWithGoogle",
      {},
      { headers, withCredentials: true }
    );

    return true;
  } catch (error) {
    console.log(error.message);
    return false;
  }
}

async function LoginWithEmail(email, password) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const credential = result.user;
    console.log(credential);
  } catch (error) {
    console.log(error.message);
    throw error; // Re-throw the error so it can be caught in the calling function
  }
}

async function SignupWithEmail(email, password) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;
    const headers = {
      token: "Bearer " + user.accessToken,
    };
    console.log(headers);

    // One vulnerability here
    // If signup fails, you might want to handle it appropriately (e.g., show an error message to the user)
    await axios.post(
      ((typeof process !== "undefined" && process.env?.REACT_APP_API_LINK) ||
        "https://peaceful-gdg-backend.vercel.app") + "/signup",
      {},
      {
        headers,
        withCredentials: true,
      }
    );
  } catch (error) {
    // Handle signup error (e.g., display an error message to the user)
    console.error(error);
    throw error; // Re-throw the error so it can be caught in the calling function
  }
}

export { LoginWithGoogle, LoginWithEmail, SignupWithEmail };
