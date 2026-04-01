"use client"

import { lazy, Suspense, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useUserStore, type UserState } from "../store/userStore"
import { validateAge, validateName, validatePhoneNumber } from "../utils/validation"
import RouteFallback from "./RouteFallback"

const WelcomeScreen = lazy(() => import("../screens/Welcome/WelcomeScreen"))
const PhoneCheckScreen = lazy(() => import("../screens/phoneCheck/PhoneCheckScreen"))
const ReturnUserScreen = lazy(() => import("../screens/ReturnUser/ReturnUserScreen"))
const PrimaryGoalScreen = lazy(() => import("../screens/PrimaryGoal/PrimaryGoalScreen"))
const SpecificGoalScreen = lazy(() => import("../screens/SpecificGoal/SpecificGoalScreen"))
const UserDetailsScreen = lazy(() => import("../screens/UserDetails/UserDetailsScreen"))
const ExperienceScreen = lazy(() => import("../screens/Experience/ExperienceScreen"))
const InjuryScreen = lazy(() => import("../screens/Injury/InjuryScreen"))
const InjuryDetailsScreen = lazy(() => import("../screens/InjuryDetails/InjuryDetailsScreen"))
const ExerciseTypeScreen = lazy(() => import("../screens/ExerciseType/ExerciseTypeScreen"))
const EnquiryScreen = lazy(() => import("../enquiry/EnquiryScreen"))
const ProgramSelectionScreen = lazy(() => import("../screens/ProgramSelection/ProgramSelectionScreen"))
const PlanSelectionScreen = lazy(() => import("../screens/PlanSelection/PlanSelectionScreen"))
const PersonalTrainingSelectionScreen = lazy(() => import("../screens/PersonalTrainingSelectionScreen"))
const BatchTypeScreen = lazy(() => import("../screens/BatchType/BatchTypeScreen"))
const TimeSelectionScreen = lazy(() => import("../screens/TimeSelection/TimeSelectionScreen"))
const ReviewScreen = lazy(() => import("../screens/Review/ReviewScreen"))
const PaymentScreen = lazy(() => import("../screens/Payment/PaymentScreen"))
const UpiPaymentScreen = lazy(() => import("../screens/Payment/UpiPaymentScreen"))
const CashPaymentScreen = lazy(() => import("../screens/Payment/CashPaymentScreen"))
const SuccessScreen = lazy(() => import("../screens/Success/SuccessScreen"))
const AdminDashboard = lazy(() => import("../screens/admin/AdminDashboard"))

const routeComponents = {
 "/": WelcomeScreen,
 "/admin": AdminDashboard,
 "/batch-type": BatchTypeScreen,
 "/enquiry": EnquiryScreen,
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
 "/return-user": ReturnUserScreen,
 "/review": ReviewScreen,
 "/specific-goal": SpecificGoalScreen,
 "/success": SuccessScreen,
 "/time-selection": TimeSelectionScreen,
 "/user-details": UserDetailsScreen
} as const

export type KioskRoute = keyof typeof routeComponents

const hasValidPhone = (state: UserState) => validatePhoneNumber(state.phone).isValid

const hasValidUserDetails = (state: UserState) =>
 validateName(state.name).isValid &&
 validatePhoneNumber(state.phone).isValid &&
 validateAge(state.age).isValid &&
 Boolean(state.gender)

const isExistingMemberFlow = (state: UserState) =>
 state.status === "member" || state.status === "trial"

const getExerciseTypeRedirect = (state: UserState) => {
 if (!hasValidPhone(state)) {
  return "/phone"
 }

 if (isExistingMemberFlow(state)) {
  return null
 }

 if (state.purpose !== "trial" && state.purpose !== "enroll" && state.purpose !== "enquiry") {
  return "/return-user"
 }

 if (!hasValidUserDetails(state)) {
  return "/user-details"
 }

 if (!state.injuryAnswered) {
  return "/injury"
 }

 if (state.injury && !state.injuryDetails.trim()) {
  return "/injury-details"
 }

 return null
}

const getExperienceRedirect = (state: UserState) => {
 const redirect = getExerciseTypeRedirect(state)

 if (redirect) {
  return redirect
 }

 if (!state.exerciseType) {
  return "/exercise-type"
 }

 return null
}

const getProgramRedirect = (state: UserState) => {
 const redirect = getExperienceRedirect(state)

 if (redirect) {
  return redirect
 }

 if (!state.experience) {
  return "/experience"
 }

 return null
}

const getBatchTypeRedirect = (state: UserState) => {
 const redirect = getProgramRedirect(state)

 if (redirect) {
  return redirect
 }

 if (!state.program) {
  return "/program"
 }

 if (!state.duration) {
  return state.program === "Personal Training" ? "/personal-training" : "/plan"
 }

 return null
}

const getPaymentRedirect = (state: UserState) => {
 if (state.purpose === "enquiry") {
  const redirect = getBatchTypeRedirect(state)

  if (redirect) {
   return redirect
  }

  if (!state.batchTime) {
   return "/time-selection"
  }

  return "/review"
 }

 if (state.purpose === "trial") {
  return "/review"
 }

 const redirect = getBatchTypeRedirect(state)

 if (redirect) {
  return redirect
 }

 if (!state.batchTime) {
  return "/time-selection"
 }

 return null
}

const getManualPaymentRedirect = (
 state: UserState,
 method: UserState["paymentMethod"],
 status: UserState["paymentStatus"]
) => {
 const redirect = getPaymentRedirect(state)

 if (redirect) {
  return redirect
 }

 if (!state.paymentReference || state.paymentMethod !== method || state.paymentStatus !== status) {
  return "/payment"
 }

 return null
}

const getEnquiryRedirect = (state: UserState) => {
 if (!hasValidPhone(state)) {
  return "/phone"
 }

 if (state.purpose !== "enquiry") {
  return "/return-user"
 }

 const redirect = getBatchTypeRedirect(state)

 if (redirect) {
  return redirect
 }

 if (!state.batchTime) {
  return "/time-selection"
 }

 return "/review"
}

const getRouteRedirect = (route: KioskRoute, state: UserState) => {
 switch (route) {
  case "/":
  case "/goal":
  case "/specific-goal":
  case "/phone":
  case "/admin":
   return null
  case "/return-user":
   return hasValidPhone(state) ? null : "/phone"
  case "/user-details":
   if (!hasValidPhone(state)) return "/phone"
   if (state.purpose !== "trial" && state.purpose !== "enroll" && state.purpose !== "enquiry") return "/return-user"
   return null
  case "/injury":
   if (!hasValidPhone(state)) return "/phone"
   if (state.purpose !== "trial" && state.purpose !== "enroll" && state.purpose !== "enquiry") return "/return-user"
   if (!hasValidUserDetails(state)) return "/user-details"
   return null
  case "/injury-details":
   if (!hasValidPhone(state)) return "/phone"
   if (state.purpose !== "trial" && state.purpose !== "enroll" && state.purpose !== "enquiry") return "/return-user"
   if (!hasValidUserDetails(state)) return "/user-details"
   if (!state.injuryAnswered) return "/injury"
   if (!state.injury) return "/exercise-type"
   return null
  case "/exercise-type":
   return getExerciseTypeRedirect(state)
  case "/experience":
   return getExperienceRedirect(state)
  case "/enquiry":
   return getEnquiryRedirect(state)
  case "/program":
   return getProgramRedirect(state)
  case "/plan": {
   const redirect = getProgramRedirect(state)

   if (redirect) return redirect
   if (!state.program) return "/program"
   if (state.purpose === "trial") return "/batch-type"
   if (state.program === "Personal Training") return "/personal-training"
   return null
  }
  case "/personal-training": {
   const redirect = getProgramRedirect(state)

   if (redirect) return redirect
   if (state.program !== "Personal Training") return "/program"
   return null
  }
  case "/batch-type":
   return getBatchTypeRedirect(state)
  case "/time-selection": {
   const redirect = getBatchTypeRedirect(state)

   if (redirect) return redirect
   if (!state.batchType) return "/batch-type"
   return null
  }
  case "/review":
   if (state.status === "member" && state.program && state.duration && state.batchType && state.batchTime) {
    return null
   }

   {
    const redirect = getBatchTypeRedirect(state)

    if (redirect) return redirect
    if (!state.batchTime) return "/time-selection"
    return null
   }
  case "/payment":
   return getPaymentRedirect(state)
  case "/payment/upi":
   return getManualPaymentRedirect(state, "upi", "upi_pending")
  case "/payment/cash":
   return getManualPaymentRedirect(state, "cash", "cash_pending")
  case "/success":
   if (state.purpose === "enquiry") {
    const redirect = getBatchTypeRedirect(state)

    if (redirect) return redirect
    if (!state.batchTime) return "/time-selection"
    return validateName(state.name).isValid && hasValidPhone(state) ? null : "/user-details"
   }

   if (state.purpose === "trial") {
    const redirect = getBatchTypeRedirect(state)

    if (redirect) return redirect
    if (!state.batchTime) return "/time-selection"
    return state.paymentStatus === "free" ? null : "/review"
   }

   {
    const redirect = getPaymentRedirect(state)

   if (redirect) return redirect
   return state.paymentStatus === "paid" && Boolean(state.paymentMethod) ? null : "/payment"
   }
 }

 return null
}

function useViewportHeightSync() {
 useEffect(() => {
  const syncViewportHeight = () => {
   document.documentElement.style.setProperty("--app-height", `${window.innerHeight}px`)
  }

  syncViewportHeight()

  window.addEventListener("resize", syncViewportHeight)
  window.addEventListener("orientationchange", syncViewportHeight)
  window.visualViewport?.addEventListener("resize", syncViewportHeight)

  return () => {
   window.removeEventListener("resize", syncViewportHeight)
   window.removeEventListener("orientationchange", syncViewportHeight)
   window.visualViewport?.removeEventListener("resize", syncViewportHeight)
  }
 }, [])
}

function useKioskSessionManager() {
 const pathname = usePathname()
 const router = useRouter()
 const reset = useUserStore((state) => state.reset)

 useEffect(() => {
  if (pathname === "/admin") {
   return
  }

  const timeoutMs = 60_000
  let timeoutId = 0

  const restartTimer = () => {
   window.clearTimeout(timeoutId)
   timeoutId = window.setTimeout(() => {
    reset()
    router.replace("/")
   }, timeoutMs)
  }

  restartTimer()

  const events: Array<keyof WindowEventMap> = ["pointerdown", "touchstart", "keydown"]

  events.forEach((eventName) => {
   window.addEventListener(eventName, restartTimer, { passive: true })
  })

  return () => {
   window.clearTimeout(timeoutId)
   events.forEach((eventName) => {
    window.removeEventListener(eventName, restartTimer)
   })
  }
 }, [pathname, reset, router])
}

export default function RouteScreen({ route }: { route: KioskRoute }) {
 useViewportHeightSync()
 useKioskSessionManager()

 const pathname = usePathname()
 const router = useRouter()
 const state = useUserStore()
 const redirect = getRouteRedirect(route, state)
 const Screen = routeComponents[route]

 useEffect(() => {
  if (redirect && redirect !== pathname) {
   router.replace(redirect)
  }
 }, [pathname, redirect, router])

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
