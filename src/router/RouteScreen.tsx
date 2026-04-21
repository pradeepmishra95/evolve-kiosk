"use client"

import { lazy, Suspense, useEffect, useLayoutEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuthSync } from "../hooks/useAuthSync"
import { useUserStore } from "../store/userStore"
import { useAuthStore } from "../store/authStore"
import { syncRouteHistory } from "../navigation/routeHistory"
import { getRouteRedirect } from "../flow/getGuardRedirect"
import type { KioskRoute } from "../flow/routes"
import RouteFallback from "./RouteFallback"
import StaffLoginScreen from "../screens/Auth/StaffLoginScreen"

const WelcomeScreen = lazy(() => import("../screens/Welcome/WelcomeScreen"))
const ReturnUserScreen = lazy(() => import("../screens/ReturnUser/ReturnUserScreen"))
const PrimaryGoalScreen = lazy(() => import("../screens/PrimaryGoal/PrimaryGoalScreen"))
const SpecificGoalScreen = lazy(() => import("../screens/SpecificGoal/SpecificGoalScreen"))
const UserDetailsScreen = lazy(() => import("../screens/UserDetails/UserDetailsScreen"))
const ExperienceScreen = lazy(() => import("../screens/Experience/ExperienceScreen"))
const InjuryScreen = lazy(() => import("../screens/Injury/InjuryScreen"))
const InjuryDetailsScreen = lazy(() => import("../screens/InjuryDetails/InjuryDetailsScreen"))
const ExerciseTypeScreen = lazy(() => import("../screens/ExerciseType/ExerciseTypeScreen"))
const ProfilePhotoScreen = lazy(() => import("../screens/ProfilePhoto/ProfilePhotoScreen"))
const EnquiryScreen = lazy(() => import("../enquiry/EnquiryScreen"))
const EnquiryThankYouScreen = lazy(() => import("../screens/EnquiryThankYou/EnquiryThankYouScreen"))
const ProgramSelectionScreen = lazy(() => import("../screens/ProgramSelection/ProgramSelectionScreen"))
const PlanSelectionScreen = lazy(() => import("../screens/PlanSelection/PlanSelectionScreen"))
const PersonalTrainingSelectionScreen = lazy(() => import("../screens/PersonalTrainingSelectionScreen"))
const PhoneCheckScreen = lazy(() => import("../screens/phoneCheck/PhoneCheckScreen"))
const BatchTypeScreen = lazy(() => import("../screens/BatchType/BatchTypeScreen"))
const TimeSelectionScreen = lazy(() => import("../screens/TimeSelection/TimeSelectionScreen"))
const ReviewScreen = lazy(() => import("../screens/Review/ReviewScreen"))
const ConsentScreen = lazy(() => import("../screens/Consent/ConsentScreen"))
const PaymentScreen = lazy(() => import("../screens/Payment/PaymentScreen"))
const UpiPaymentScreen = lazy(() => import("../screens/Payment/UpiPaymentScreen"))
const CashPaymentScreen = lazy(() => import("../screens/Payment/CashPaymentScreen"))
const SuccessScreen = lazy(() => import("../screens/Success/SuccessScreen"))

const routeComponents = {
 "/": WelcomeScreen,
 "/batch-type": BatchTypeScreen,
 "/enquiry": EnquiryScreen,
 "/enquiry-thank-you": EnquiryThankYouScreen,
 "/exercise-type": ExerciseTypeScreen,
 "/experience": ExperienceScreen,
 "/goal": PrimaryGoalScreen,
 "/injury": InjuryScreen,
 "/injury-details": InjuryDetailsScreen,
 "/payment": PaymentScreen,
 "/payment/cash": CashPaymentScreen,
 "/payment/upi": UpiPaymentScreen,
 "/personal-training": PersonalTrainingSelectionScreen,
 "/phone": PhoneCheckScreen,
 "/plan": PlanSelectionScreen,
 "/program": ProgramSelectionScreen,
 "/profile-photo": ProfilePhotoScreen,
 "/return-user": ReturnUserScreen,
 "/review": ReviewScreen,
 "/consent": ConsentScreen,
 "/specific-goal": SpecificGoalScreen,
 "/success": SuccessScreen,
 "/time-selection": TimeSelectionScreen,
 "/user-details": UserDetailsScreen
} as const

export type { KioskRoute } from "../flow/routes"

function useViewportHeightSync() {
 useLayoutEffect(() => {
  let frameId = 0

  const syncViewportHeight = () => {
   const viewportHeight = window.visualViewport?.height ?? window.innerHeight
   document.documentElement.style.setProperty("--app-height", `${Math.round(viewportHeight)}px`)
  }

  const scheduleSync = () => {
   window.cancelAnimationFrame(frameId)
   frameId = window.requestAnimationFrame(syncViewportHeight)
  }

  syncViewportHeight()
  scheduleSync()

  window.addEventListener("resize", scheduleSync)
  window.addEventListener("orientationchange", scheduleSync)
  window.addEventListener("load", scheduleSync)
  window.visualViewport?.addEventListener("resize", scheduleSync)
  window.visualViewport?.addEventListener("scroll", scheduleSync)

  return () => {
   window.cancelAnimationFrame(frameId)
   window.removeEventListener("resize", scheduleSync)
   window.removeEventListener("orientationchange", scheduleSync)
   window.removeEventListener("load", scheduleSync)
   window.visualViewport?.removeEventListener("resize", scheduleSync)
   window.visualViewport?.removeEventListener("scroll", scheduleSync)
  }
 }, [])
}

export default function RouteScreen({ route }: { route: KioskRoute }) {
 useAuthSync()
 useViewportHeightSync()

 const pathname = usePathname()
 const router = useRouter()
 const userHydrated = useUserStore((state) => state.hydrated)
 const state = useUserStore()
 const authChecked = useAuthStore((state) => state.checked)
 const authUser = useAuthStore((state) => state.user)

 const redirect = getRouteRedirect(route, state)
 const Screen = routeComponents[route]

 useEffect(() => {
  if (redirect && redirect !== pathname) {
   router.replace(redirect)
  }
 }, [pathname, redirect, router])

 useEffect(() => {
  syncRouteHistory(pathname)
 }, [pathname])

 if (!authChecked || !userHydrated) {
  return <RouteFallback />
 }

 if (!authUser) {
  return <StaffLoginScreen />
 }

 if (!Screen) {
  return <RouteFallback />
 }

 if (redirect && redirect !== pathname) {
  return <RouteFallback />
 }

 return (
  <Suspense fallback={<RouteFallback />}>
   <Screen />
  </Suspense>
 )
}
