import type { UserState } from "../store/userStore"
import { ROUTES, type KioskRoute } from "./routes"
import { hasProfilePhoto, shouldRequireProfilePhoto } from "./predicates"

export function getPreviousRoute(route: KioskRoute, state: UserState): KioskRoute | null {
  switch (route) {
    // PHONE is always preceded by WELCOME (unconditional forward)
    case ROUTES.PHONE:
      return ROUTES.WELCOME

    // RETURN_USER is always preceded by PHONE (unconditional forward)
    case ROUTES.RETURN_USER:
      return ROUTES.PHONE

    // USER_DETAILS has multiple entry paths: PHONE (PhoneCheckScreen), GOAL, SPECIFIC_GOAL, and
    // REVIEW (edit-details shortcut). Cannot safely derive from state alone.
    // Preserving existing /phone fallback — correct for the PHONE→USER_DETAILS path.
    // Session history handles GOAL, SPECIFIC_GOAL, and REVIEW entry cases during normal navigation.
    case ROUTES.USER_DETAILS:
      return ROUTES.PHONE

    // PROFILE_PHOTO has exactly one forward path leading to it: USER_DETAILS (enroll+no-photo)
    case ROUTES.PROFILE_PHOTO:
      return ROUTES.USER_DETAILS

    // Fixed: was /profile-photo for all cases — incorrect for non-enroll flows.
    // PROGRAM is reachable from EXERCISE_TYPE, PROFILE_PHOTO, or USER_DETAILS; derive from state.
    // PROFILE_PHOTO branch only applies to new-member enroll (same rule as shouldRequireProfilePhoto).
    case ROUTES.PROGRAM:
      if (state.exerciseType) {
        return ROUTES.EXERCISE_TYPE
      }
      if (shouldRequireProfilePhoto(state) && hasProfilePhoto(state)) {
        return ROUTES.PROFILE_PHOTO
      }
      return ROUTES.USER_DETAILS

    // PERSONAL_TRAINING is always entered from PLAN (PlanSelectionScreen is the only navigator).
    // The guard at /personal-training also requires isPersonalTrainingProgram(state), so this
    // back route is unambiguous.
    case ROUTES.PERSONAL_TRAINING:
      return ROUTES.PLAN

    // Preserved: enquiry users land on PLAN from REVIEW; everyone else from PROGRAM
    case ROUTES.PLAN:
      return state.status === "enquiry" || state.purpose === "enquiry"
        ? ROUTES.REVIEW
        : ROUTES.PROGRAM

    // Preserved: correct existing mappings
    case ROUTES.REVIEW:
      return ROUTES.PLAN

    case ROUTES.PAYMENT:
      return ROUTES.REVIEW

    case ROUTES.PAYMENT_CASH:
    case ROUTES.PAYMENT_UPI:
      return ROUTES.PAYMENT

    case ROUTES.CONSENT:
      return ROUTES.PAYMENT

    default:
      return null
  }
}
