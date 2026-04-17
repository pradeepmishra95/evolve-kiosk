"use client"

import { useEffect } from "react"

const SERVICE_WORKER_URL = "/sw.js"

export default function ServiceWorkerRegistration() {
 useEffect(() => {
  if (process.env.NODE_ENV !== "production") {
   return
  }

  if (!("serviceWorker" in navigator)) {
   return
  }

  const registerServiceWorker = async () => {
   try {
    const registration = await navigator.serviceWorker.register(SERVICE_WORKER_URL, {
     scope: "/"
    })

    registration.update().catch(() => {
     // A failed update check should not block the initial registration.
    })
   } catch (error) {
    console.error("Service worker registration failed:", error)
   }
  }

  registerServiceWorker()
 }, [])

 return null
}
