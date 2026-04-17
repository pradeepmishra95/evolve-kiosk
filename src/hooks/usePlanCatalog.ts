"use client"

import { useEffect, useState } from "react"
import { emptyPlanCatalog, subscribePlanCatalog, type PlanCatalogData } from "../services/planCatalog"

export interface UsePlanCatalogState extends PlanCatalogData {
 loading: boolean
 error: string | null
}

const sharedState: UsePlanCatalogState = {
 ...emptyPlanCatalog(),
 loading: true,
 error: null
}

const listeners = new Set<() => void>()

let sharedSubscriptionActive = false

const notifyListeners = () => {
 listeners.forEach((listener) => listener())
}

const ensureSharedSubscription = () => {
 if (sharedSubscriptionActive) {
  return
 }

 sharedSubscriptionActive = true

 subscribePlanCatalog(
  (catalog) => {
   Object.assign(sharedState, catalog, {
    loading: false,
    error: null
   })
   notifyListeners()
  },
  (error) => {
   Object.assign(sharedState, {
    loading: false,
    error: error.message
   })
   notifyListeners()
  }
 )
}

export const usePlanCatalog = () => {
 const [state, setState] = useState<UsePlanCatalogState>(() => sharedState)

 useEffect(() => {
  let cancelled = false

  ensureSharedSubscription()

  const listener = () => {
   if (!cancelled) {
    setState({ ...sharedState })
   }
  }

  listeners.add(listener)
  listener()

  return () => {
   cancelled = true
   listeners.delete(listener)
  }
 }, [])

 return state
}
