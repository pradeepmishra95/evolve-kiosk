import { getApp, getApps, initializeApp, type FirebaseOptions } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { getStorage } from "firebase/storage"

const firebaseDefaultConfig: FirebaseOptions = {
  apiKey: "AIzaSyD8j2g1_fY0622wmXmhXBMXd9UVuH7XG0Y",
  authDomain: "evolve-kiosk.firebaseapp.com",
  projectId: "evolve-kiosk",
  storageBucket: "evolve-kiosk.firebasestorage.app",
  messagingSenderId: "1023763588652",
  appId: "1:1023763588652:web:65b67d5e2846dba09b9389",
  measurementId: "G-L5D8WDMG88"
}

const firebaseEnvConfig = {
 apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() || "",
 authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() || "",
 projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() || "",
 storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() || "",
 messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim() || "",
 appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim() || "",
 measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?.trim() || undefined
}

const requiredFirebaseEnvKeys = [
 "apiKey",
 "authDomain",
 "projectId",
 "storageBucket",
 "messagingSenderId",
 "appId"
] as const

const hasCompleteFirebaseEnvConfig = requiredFirebaseEnvKeys.every((key) => Boolean(firebaseEnvConfig[key]))
const hasPartialFirebaseEnvConfig = requiredFirebaseEnvKeys.some((key) => Boolean(firebaseEnvConfig[key]))

if (hasPartialFirebaseEnvConfig && !hasCompleteFirebaseEnvConfig && process.env.NODE_ENV !== "production") {
 console.warn(
  "Firebase client env config is incomplete. Falling back to the bundled kiosk Firebase config."
 )
}

const firebaseConfig: FirebaseOptions = hasCompleteFirebaseEnvConfig
 ? firebaseEnvConfig
 : firebaseDefaultConfig

// Reuse Firebase apps during HMR/dev reloads instead of re-initializing them.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
const consentOtpAppName = "evolve-kiosk-consent-otp"
const consentOtpApp = getApps().some((existingApp) => existingApp.name === consentOtpAppName)
 ? getApp(consentOtpAppName)
 : initializeApp(firebaseConfig, consentOtpAppName)

// Initialize Firestore
export const db = getFirestore(app)
export const auth = getAuth(app)
export const consentOtpAuth = getAuth(consentOtpApp)
export const storage = getStorage(app)
