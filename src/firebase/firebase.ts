import { getApp, getApps, initializeApp, type FirebaseOptions } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { getStorage } from "firebase/storage"

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

const missingFirebaseEnvKeys = requiredFirebaseEnvKeys.filter((key) => !firebaseEnvConfig[key])

if (missingFirebaseEnvKeys.length > 0) {
 throw new Error(
  `Missing Firebase client environment variables: ${missingFirebaseEnvKeys.join(", ")}. Add them to .env.local.`
 )
}

const firebaseConfig: FirebaseOptions = {
 apiKey: firebaseEnvConfig.apiKey,
 authDomain: firebaseEnvConfig.authDomain,
 projectId: firebaseEnvConfig.projectId,
 storageBucket: firebaseEnvConfig.storageBucket,
 messagingSenderId: firebaseEnvConfig.messagingSenderId,
 appId: firebaseEnvConfig.appId,
 measurementId: firebaseEnvConfig.measurementId
}

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
