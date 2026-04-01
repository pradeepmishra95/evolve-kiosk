// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD8j2g1_fY0622wmXmhXBMXd9UVuH7XG0Y",
  authDomain: "evolve-kiosk.firebaseapp.com",
  projectId: "evolve-kiosk",
  storageBucket: "evolve-kiosk.firebasestorage.app",
  messagingSenderId: "1023763588652",
  appId: "1:1023763588652:web:65b67d5e2846dba09b9389",
  measurementId: "G-L5D8WDMG88"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

// Initialize Firestore
export const db = getFirestore(app)