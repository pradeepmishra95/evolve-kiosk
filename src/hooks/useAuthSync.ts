"use client"

import { useEffect } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { doc, onSnapshot } from "firebase/firestore"
import { auth, db } from "../firebase/firebase"
import { clearStoredKioskSession, ensureKioskSession, getStoredKioskSession } from "../services/kioskSessions"
import { useAuthStore } from "../store/authStore"

export const useAuthSync = () => {
 const setUser = useAuthStore((state) => state.setUser)
 const setChecked = useAuthStore((state) => state.setChecked)
 const setLoading = useAuthStore((state) => state.setLoading)

 useEffect(() => {
  setLoading(true)

  let cancelled = false
  let unsubscribeProfile: (() => void) | null = null

  const unsubscribe = onAuthStateChanged(auth, (user) => {
   unsubscribeProfile?.()
   unsubscribeProfile = null

   if (!user) {
    clearStoredKioskSession()

    if (!cancelled) {
     setUser(null)
     setChecked(true)
     setLoading(false)
    }
    return
   }

   unsubscribeProfile = onSnapshot(
    doc(db, "staffProfiles", user.uid),
    async (profileSnapshot) => {
     const profileData = profileSnapshot.exists() ? profileSnapshot.data() : null
     const nextUser = {
      uid: user.uid,
      email: user.email || "",
      name: String(profileData?.name || user.displayName || ""),
      photoURL: String(profileData?.photoDataUrl || user.photoURL || "")
     }

     try {
      const session = await ensureKioskSession(nextUser)

      if (!cancelled) {
       setUser({
        ...nextUser,
        sessionId: session.sessionId,
        sessionStartedAtClient: session.startedAtClient
       })
       setChecked(true)
       setLoading(false)
      }
     } catch (error) {
      console.error("Failed to sync the kiosk session:", error)

      if (!cancelled) {
       const cachedSession = getStoredKioskSession(user.uid)

       setUser({
        ...nextUser,
        sessionId: cachedSession?.sessionId || "",
        sessionStartedAtClient: cachedSession?.startedAtClient || ""
       })
       setChecked(true)
       setLoading(false)
      }
     }
    },
    async (error) => {
     console.error("Failed to load staff profile:", error)
     const fallbackUser = {
      uid: user.uid,
      email: user.email || "",
      name: user.displayName || "",
      photoURL: user.photoURL || ""
     }

     try {
      const session = await ensureKioskSession(fallbackUser)

      if (!cancelled) {
       setUser({
        ...fallbackUser,
        sessionId: session.sessionId,
        sessionStartedAtClient: session.startedAtClient
       })
       setChecked(true)
       setLoading(false)
      }
     } catch (sessionError) {
      console.error("Failed to sync the fallback kiosk session:", sessionError)

      if (!cancelled) {
       const cachedSession = getStoredKioskSession(user.uid)

       setUser({
        ...fallbackUser,
        sessionId: cachedSession?.sessionId || "",
        sessionStartedAtClient: cachedSession?.startedAtClient || ""
       })
       setChecked(true)
       setLoading(false)
      }
     }
    }
   )
  })

  return () => {
   cancelled = true
   unsubscribeProfile?.()
   unsubscribe()
  }
 }, [setChecked, setLoading, setUser])
}
