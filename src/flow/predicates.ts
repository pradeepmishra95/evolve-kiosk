import type { UserState } from "../store/userStore"
import { hasCompletedExperienceQuestionnaire } from "../utils/experience"
import { validateAge, validateInjuryDetails, validateName, validatePhoneNumber } from "../utils/validation"
import { isBookingJourney } from "./journeyTypes"
import { isPersonalTrainingLabel } from "../utils/labelMatch"

export const hasValidUserDetails = (state: UserState): boolean =>
  validateName(state.name).isValid &&
  validatePhoneNumber(state.phone, state.countryCode).isValid &&
  validateAge(state.age).isValid &&
  Boolean(state.gender)

export const hasCompletedIntake = (state: UserState): boolean =>
  hasValidUserDetails(state) &&
  Boolean(state.lookingFor) &&
  Boolean(state.referenceSource) &&
  state.injuryAnswered &&
  (!state.injury || validateInjuryDetails(state.injuryDetails).isValid) &&
  Boolean(state.priorExerciseExperience) &&
  hasCompletedExperienceQuestionnaire(state) &&
  Boolean(state.exerciseType)

export const hasCompletedBatchSelection = (state: UserState): boolean =>
  Boolean(state.batchType) && Boolean(state.batchTime)

export const hasSelectedPlan = (state: UserState): boolean =>
  Boolean(state.selectedPlanId || state.program)

export const hasProfilePhoto = (state: UserState): boolean =>
  Boolean(state.profilePhotoUrl || state.profilePhotoStoragePath)

export const shouldRequireProfilePhoto = (state: UserState): boolean =>
  state.status === "new" && state.purpose === "enroll"

export const isExistingMemberFlow = (state: UserState): boolean =>
  state.status === "member" || state.status === "trial"

// Delegates to isBookingJourney (journeyTypes.ts) — previously a duplicate definition.
export const isBookingPurpose = isBookingJourney

// True when the selected program in state is a Personal Training program.
// Used by guards and back-nav; screens that need to detect PT from a plan object
// (PlanSelectionScreen, planPricing.ts) use their own local isPersonalTrainingPlan check.
export const isPersonalTrainingProgram = (state: UserState): boolean =>
  isPersonalTrainingLabel(state.program)
