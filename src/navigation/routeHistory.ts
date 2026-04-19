"use client"

const ROUTE_HISTORY_STORAGE_KEY = "evolve-kiosk-route-history"

interface RouteHistorySnapshot {
 currentPath: string
 previousPath: string
}

type RouteTrackingWindow = Window &
 typeof globalThis & {
  __evolveKioskRouteTrackingInitialized?: boolean
 }

const getDefaultSnapshot = (): RouteHistorySnapshot => ({
 currentPath: "",
 previousPath: ""
})

const readRouteHistorySnapshot = (): RouteHistorySnapshot => {
 if (typeof window === "undefined") {
  return getDefaultSnapshot()
 }

 const rawValue = window.sessionStorage.getItem(ROUTE_HISTORY_STORAGE_KEY)

 if (!rawValue) {
  return getDefaultSnapshot()
 }

 try {
  const parsedValue = JSON.parse(rawValue) as Partial<RouteHistorySnapshot>

  return {
   currentPath: typeof parsedValue.currentPath === "string" ? parsedValue.currentPath : "",
   previousPath: typeof parsedValue.previousPath === "string" ? parsedValue.previousPath : ""
  }
 } catch {
  window.sessionStorage.removeItem(ROUTE_HISTORY_STORAGE_KEY)
  return getDefaultSnapshot()
 }
}

const writeRouteHistorySnapshot = (snapshot: RouteHistorySnapshot) => {
 if (typeof window === "undefined") {
  return
 }

 window.sessionStorage.setItem(ROUTE_HISTORY_STORAGE_KEY, JSON.stringify(snapshot))
}

export const syncRouteHistory = (pathname: string) => {
 if (typeof window === "undefined" || !pathname) {
  return
 }

 const trackingWindow = window as RouteTrackingWindow

 if (!trackingWindow.__evolveKioskRouteTrackingInitialized) {
  trackingWindow.__evolveKioskRouteTrackingInitialized = true
  writeRouteHistorySnapshot({
   currentPath: pathname,
   previousPath: ""
  })
  return
 }

 const snapshot = readRouteHistorySnapshot()

 if (snapshot.currentPath === pathname) {
  return
 }

 writeRouteHistorySnapshot({
  currentPath: pathname,
  previousPath: snapshot.currentPath
 })
}

export const getPreviousRoutePath = (pathname: string) => {
 if (typeof window === "undefined") {
  return ""
 }

 const snapshot = readRouteHistorySnapshot()

 if (snapshot.currentPath !== pathname) {
  return ""
 }

 return snapshot.previousPath
}
