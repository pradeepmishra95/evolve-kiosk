import {
 browserLocalPersistence,
 createUserWithEmailAndPassword,
 setPersistence,
 signInWithEmailAndPassword,
 signOut,
 updateProfile,
 type User
} from "firebase/auth"
import { doc, serverTimestamp, setDoc } from "firebase/firestore"
import { auth, db } from "../firebase/firebase"
import { endKioskSession } from "./kioskSessions"
import type { StaffSessionUser } from "../store/authStore"

let persistencePromise: Promise<void> | null = null

const ensurePersistence = () => {
 if (!persistencePromise) {
  persistencePromise = setPersistence(auth, browserLocalPersistence)
 }

 return persistencePromise
}

const mapFirebaseAuthError = (code?: string) => {
 switch (code) {
  case "auth/invalid-email":
   return "Enter a valid email address."
  case "auth/missing-password":
   return "Enter the password."
  case "auth/user-not-found":
  case "auth/invalid-credential":
   return "Email or password is incorrect."
  case "auth/email-already-in-use":
   return "This email is already registered."
  case "auth/weak-password":
   return "Password must be at least 6 characters."
  case "auth/operation-not-allowed":
   return "Email/password sign-in is not enabled in Firebase yet."
  case "auth/too-many-requests":
   return "Too many attempts right now. Please try again shortly."
  default:
   return "We could not complete authentication right now. Please try again."
 }
}

const toStaffSessionUser = (user: User): StaffSessionUser => ({
 uid: user.uid,
 email: user.email || "",
 name: user.displayName || "",
 photoURL: user.photoURL || ""
})

export const signInStaff = async (email: string, password: string) => {
 try {
  await ensurePersistence()
  const credentials = await signInWithEmailAndPassword(auth, email.trim(), password)
  return toStaffSessionUser(credentials.user)
 } catch (error) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : ""
  throw new Error(mapFirebaseAuthError(code))
 }
}

export const signUpStaff = async (
 email: string,
 password: string,
 profile: {
  name: string
  photoURL: string
 }
) => {
 try {
  await ensurePersistence()
  const normalizedEmail = email.trim()
  const normalizedName = profile.name.trim()
  const credentials = await createUserWithEmailAndPassword(auth, email.trim(), password)
  await updateProfile(credentials.user, {
   displayName: normalizedName
  })
  await setDoc(
   doc(db, "staffProfiles", credentials.user.uid),
   {
    uid: credentials.user.uid,
    email: normalizedEmail,
    name: normalizedName,
    photoDataUrl: profile.photoURL,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
   },
   { merge: true }
  )
  await credentials.user.reload()

  return {
   uid: credentials.user.uid,
   email: normalizedEmail,
   name: normalizedName,
   photoURL: profile.photoURL
  }
 } catch (error) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : ""
  throw new Error(mapFirebaseAuthError(code))
 }
}

export const signOutStaff = async () => {
 await endKioskSession()
 await signOut(auth)
}
