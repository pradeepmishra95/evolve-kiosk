"use client"

import { lazy, Suspense, useEffect, useLayoutEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuthSync } from "../hooks/useAuthSync"
import { useUserStore, type UserState } from "../store/userStore"
import { hasCompletedExperienceQuestionnaire } from "../utils/experience"
import { isPersonalTrainingLabel } from "../utils/labelMatch"
import { validateAge, validateInjuryDetails, validateName, validatePhoneNumber } from "../utils/validation"
import RouteFallback from "./RouteFallback"

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

export type KioskRoute = keyof typeof routeComponents

const hasValidUserDetails = (state: UserState) =>
 validateName(state.name).isValid &&
 validatePhoneNumber(state.phone, state.countryCode).isValid &&
 validateAge(state.age).isValid &&
 Boolean(state.gender)

const hasCompletedIntake = (state: UserState) =>
 hasValidUserDetails(state) &&
 Boolean(state.lookingFor) &&
 Boolean(state.referenceSource) &&
 state.injuryAnswered &&
 (!state.injury || validateInjuryDetails(state.injuryDetails).isValid) &&
 Boolean(state.priorExerciseExperience) &&
 hasCompletedExperienceQuestionnaire(state) &&
 Boolean(state.exerciseType)

const isBookingPurpose = (purpose: UserState["purpose"]) =>
 purpose === "trial" || purpose === "enroll" || purpose === "renew"

const hasCompletedBatchSelection = (state: UserState) =>
 Boolean(state.batchType) && Boolean(state.batchTime)

const hasSelectedPlan = (state: UserState) =>
 Boolean(state.selectedPlanId || state.program)

const hasProfilePhoto = (state: UserState) =>
 Boolean(state.profilePhotoUrl || state.profilePhotoStoragePath)

const shouldRequireProfilePhoto = (state: UserState) =>
 state.status === "new" && state.purpose !== "enquiry"

const isExistingMemberFlow = (state: UserState) =>
 state.status === "member" || state.status === "trial"

const getExperienceRedirect = (state: UserState) => {
 if (isExistingMemberFlow(state)) {
  return null
 }

 if (!isBookingPurpose(state.purpose) && state.purpose !== "enquiry") {
  return "/return-user"
 }

 if (!hasCompletedIntake(state)) {
  return "/user-details"
 }

 return null
}

const getProgramRedirect = (state: UserState) => {
  const redirect = getExperienceRedirect(state)

  if (redirect) {
   return redirect
  }

 if (!state.exerciseType || !state.experience) {
  return "/user-details"
 }

 if (shouldRequireProfilePhoto(state) && !hasProfilePhoto(state)) {
  return "/profile-photo"
 }

 return null
}

const getBatchTypeRedirect = (state: UserState) => {
  const redirect = getProgramRedirect(state)

  if (redirect) {
   return redirect
  }

  if (state.status === "new") {
   if (!hasSelectedPlan(state)) {
    return "/program"
   }

   if (!state.duration || !hasCompletedBatchSelection(state)) {
    return "/plan"
   }
  }

  if (!state.program) {
   return "/program"
  }

  if (!state.duration) {
   return isPersonalTrainingLabel(state.program) ? "/personal-training" : "/program"
  }

  return null
}

const getPaymentRedirect = (state: UserState) => {
 if (state.purpose === "enquiry") {
  const redirect = getBatchTypeRedirect(state)

  if (redirect) {
   return redirect
  }

  if (!hasCompletedBatchSelection(state)) {
   return "/program"
  }

  return "/review"
 }

 const redirect = getBatchTypeRedirect(state)

 if (redirect) {
  return redirect
 }

 if (!hasCompletedBatchSelection(state)) {
  return "/program"
 }

 return null
}

const getEnquiryRedirect = (state: UserState) => {
 if (state.purpose !== "enquiry") {
  return "/return-user"
 }

 const redirect = getBatchTypeRedirect(state)

 if (redirect) {
  return redirect
 }

 if (!hasCompletedBatchSelection(state)) {
  return "/program"
 }

 return "/review"
}

const getRouteRedirect = (route: KioskRoute, state: UserState) => {
 switch (route) {
  case "/":
  case "/goal":
  case "/specific-goal":
  case "/return-user":
   return null
  case "/user-details":
   if (!state.phone) return "/phone"
   return null
  case "/injury":
  case "/injury-details":
  case "/experience":
  case "/exercise-type":
   return hasCompletedIntake(state) ? "/program" : "/user-details"
  case "/profile-photo":
   return getProgramRedirect(state)
  case "/enquiry":
   return getEnquiryRedirect(state)
  case "/program":
   return getProgramRedirect(state)
  case "/plan":
   if (state.status === "new" && !hasSelectedPlan(state)) {
    return "/program"
   }
   return null
  case "/personal-training": {
   const redirect = getProgramRedirect(state)

   if (redirect) return redirect
   if (!isPersonalTrainingLabel(state.program)) return "/program"
   return null
  }
  case "/batch-type":
   return "/program"
  case "/time-selection":
   return "/program"
  case "/review":
   {
    const redirect = getBatchTypeRedirect(state)

    if (redirect) return redirect
    if (!hasCompletedBatchSelection(state)) return "/program"
    return null
   }
  case "/consent": {
   if (state.purpose === "enquiry") {
    return "/review"
   }

   const redirect = getPaymentRedirect(state)

   if (redirect) {
    return redirect
   }

   if (state.paymentStatus !== "paid" || !state.paymentMethod) {
    return "/payment"
   }

   return null
  }
  case "/success":
  if (!state.phone && !state.purpose && state.status === "new") {
   return null
  }

  if (state.purpose === "enquiry") {
   const redirect = getBatchTypeRedirect(state)

    if (redirect) return redirect
   if (!hasCompletedBatchSelection(state)) return "/program"
   return hasValidUserDetails(state) ? null : "/user-details"
  }

  {
   const redirect = getPaymentRedirect(state)

   if (redirect) return redirect
   if (state.paymentStatus !== "paid" || !state.paymentMethod) {
    return "/payment"
   }

   if (!state.consentAgreed) {
    return "/consent"
   }

   return null
  }
 }

 return null
}

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

 const redirect = getRouteRedirect(route, state)
 const Screen = routeComponents[route]

 useEffect(() => {
  if (redirect && redirect !== pathname) {
   router.replace(redirect)
  }
 }, [pathname, redirect, router])

 if (!userHydrated) {
  return <RouteFallback />
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
