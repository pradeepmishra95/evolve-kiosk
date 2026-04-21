import type { UserState } from "../store/userStore"
import type { KioskRoute } from "./routes"
import {
  hasCompletedBatchSelection,
  hasCompletedIntake,
  hasProfilePhoto,
  hasSelectedPlan,
  hasValidUserDetails,
  isBookingPurpose,
  isExistingMemberFlow,
  isPersonalTrainingProgram,
  shouldRequireProfilePhoto,
} from "./predicates"

const getExperienceRedirect = (state: UserState): KioskRoute | null => {
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

const getProgramRedirect = (state: UserState): KioskRoute | null => {
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

const getBatchTypeRedirect = (state: UserState): KioskRoute | null => {
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
    return isPersonalTrainingProgram(state) ? "/personal-training" : "/program"
  }

  return null
}

const getPaymentRedirect = (state: UserState): KioskRoute | null => {
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

const getEnquiryRedirect = (state: UserState): KioskRoute => {
  // NOTE (flowConfig audit): getEnquiryRedirect never returns null — /enquiry is currently
  // unreachable. Preserved as-is pending a dedicated fix.
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

export const getRouteRedirect = (route: KioskRoute, state: UserState): KioskRoute | null => {
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
      if (!isPersonalTrainingProgram(state)) return "/program"
      return null
    }

    // NOTE (flowConfig audit): /batch-type and /time-selection unconditionally redirect to
    // /program — both routes are currently unreachable. Preserved as-is pending a dedicated fix.
    case "/batch-type":
      return "/program"

    case "/time-selection":
      return "/program"

    case "/review": {
      const redirect = getBatchTypeRedirect(state)
      if (redirect) return redirect
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
