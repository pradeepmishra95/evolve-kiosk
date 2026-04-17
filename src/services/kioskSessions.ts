import { addDoc, collection, doc, increment, serverTimestamp, updateDoc } from "firebase/firestore"
import { db } from "../firebase/firebase"
import type { StaffSessionUser } from "../store/authStore"

const KIOSK_SESSION_STORAGE_KEY = "evolve_kiosk_staff_session"

export interface KioskSessionInfo {
 sessionId: string
 staffUid: string
 startedAtClient: string
}

const canUseStorage = () => typeof window !== "undefined"

const readStoredKioskSession = (): KioskSessionInfo | null => {
 if (!canUseStorage()) {
  return null
 }

 try {
  const rawSession = window.localStorage.getItem(KIOSK_SESSION_STORAGE_KEY)

  if (!rawSession) {
   return null
  }

  const parsedSession = JSON.parse(rawSession) as Partial<KioskSessionInfo>

  if (typeof parsedSession.sessionId !== "string" || typeof parsedSession.staffUid !== "string") {
   return null
  }

  return {
   sessionId: parsedSession.sessionId,
   staffUid: parsedSession.staffUid,
   startedAtClient:
    typeof parsedSession.startedAtClient === "string"
     ? parsedSession.startedAtClient
     : new Date().toISOString()
  }
 } catch (error) {
  console.error("Failed to read the cached kiosk session:", error)
  return null
 }
}

const writeStoredKioskSession = (session: KioskSessionInfo) => {
 if (!canUseStorage()) {
  return
 }

 window.localStorage.setItem(KIOSK_SESSION_STORAGE_KEY, JSON.stringify(session))
}

export const clearStoredKioskSession = () => {
 if (!canUseStorage()) {
  return
 }

 window.localStorage.removeItem(KIOSK_SESSION_STORAGE_KEY)
}

export const getStoredKioskSession = (staffUid?: string) => {
 const session = readStoredKioskSession()

 if (!session) {
  return null
 }

 if (staffUid && session.staffUid !== staffUid) {
  return null
 }

 return session
}

const createKioskSession = async (staffUser: Pick<StaffSessionUser, "uid" | "email" | "name" | "photoURL">) => {
 const startedAtClient = new Date().toISOString()
 const sessionDoc = await addDoc(collection(db, "kioskSessions"), {
  staffUid: staffUser.uid,
  staffEmail: staffUser.email,
  staffName: staffUser.name,
  staffPhotoURL: staffUser.photoURL || "",
  source: "kiosk",
  status: "active",
  completedFormsCount: 0,
  startedAt: serverTimestamp(),
  startedAtClient,
  lastSeenAt: serverTimestamp(),
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
 })

 const session = {
  sessionId: sessionDoc.id,
  staffUid: staffUser.uid,
  startedAtClient
 }

 writeStoredKioskSession(session)

 return session
}

export const ensureKioskSession = async (staffUser: Pick<StaffSessionUser, "uid" | "email" | "name" | "photoURL">) => {
 const cachedSession = getStoredKioskSession(staffUser.uid)

 if (!cachedSession) {
  return createKioskSession(staffUser)
 }

 try {
  await updateDoc(doc(db, "kioskSessions", cachedSession.sessionId), {
   staffEmail: staffUser.email,
   staffName: staffUser.name,
   staffPhotoURL: staffUser.photoURL || "",
   status: "active",
   lastSeenAt: serverTimestamp(),
   updatedAt: serverTimestamp()
  })

  return cachedSession
 } catch (error) {
  console.error("Failed to refresh the cached kiosk session:", error)
  clearStoredKioskSession()
  return createKioskSession(staffUser)
 }
}

export const endKioskSession = async () => {
 const cachedSession = getStoredKioskSession()

 clearStoredKioskSession()

 if (!cachedSession) {
  return
 }

 try {
  await updateDoc(doc(db, "kioskSessions", cachedSession.sessionId), {
   status: "ended",
   endedAt: serverTimestamp(),
   lastSeenAt: serverTimestamp(),
   updatedAt: serverTimestamp()
  })
 } catch (error) {
  console.error("Failed to end the kiosk session:", error)
 }
}

export const trackKioskSessionCompletion = async (
 sessionId: string,
 details: {
  purpose: string
  program: string
 }
) => {
 if (!sessionId) {
  return
 }

 try {
  await updateDoc(doc(db, "kioskSessions", sessionId), {
   completedFormsCount: increment(1),
   lastCompletedFormAt: serverTimestamp(),
   lastCompletedPurpose: details.purpose,
   lastCompletedProgram: details.program,
   lastSeenAt: serverTimestamp(),
   updatedAt: serverTimestamp()
  })
 } catch (error) {
  console.error("Failed to track the kiosk session completion:", error)
 }
}
