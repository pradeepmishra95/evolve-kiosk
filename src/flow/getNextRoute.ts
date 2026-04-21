import type { UserState } from "../store/userStore"
import { ROUTES, type KioskRoute } from "./routes"
import { hasProfilePhoto, shouldRequireProfilePhoto } from "./predicates"

/**
 * Optional discriminator for routes that have multiple possible next steps
 * depending on what the user chose (e.g. InjuryScreen yes/no selection).
 * Unused for linear routes.
 */
export type NextRouteAction = string

/**
 * Returns the canonical next route after `route` given current flow state.
 *
 * Returns null when:
 * - the route has complex branching not yet encoded here, or
 * - the route is a terminal screen (success, thank-you).
 *
 * Screens that receive null continue to use their own inline navigate call.
 *
 * Every entry is verified against the actual screen implementation before
 * being added here.
 */
export function getNextRoute(
  route: KioskRoute,
  state: UserState,
  action?: NextRouteAction
): KioskRoute | null {
  switch (route) {
    // Verified: WelcomeScreen primary button → /phone
    case ROUTES.WELCOME:
      return ROUTES.PHONE

    // Verified: PrimaryGoalScreen → /user-details (does NOT go to /specific-goal)
    case ROUTES.GOAL:
      return ROUTES.USER_DETAILS

    // Verified: SpecificGoalScreen → /user-details
    case ROUTES.SPECIFIC_GOAL:
      return ROUTES.USER_DETAILS

    // Verified: UserDetailsScreen → /profile-photo only for new-member enroll with no saved photo;
    // returning enrollers (status !== "new"), all other purposes, and enroll-with-photo go to /program.
    // Rule is the same as shouldRequireProfilePhoto (status === "new" && purpose === "enroll").
    case ROUTES.USER_DETAILS:
      if (shouldRequireProfilePhoto(state) && !hasProfilePhoto(state)) {
        return ROUTES.PROFILE_PHOTO
      }
      return ROUTES.PROGRAM

    // Verified: InjuryScreen → /injury-details when injury=true, → /experience when false
    // action must be passed by the screen: "injury" | "no-injury"
    case ROUTES.INJURY:
      return action === "injury" ? ROUTES.INJURY_DETAILS : ROUTES.EXPERIENCE

    // Verified: InjuryDetailsScreen → /experience (unconditional)
    case ROUTES.INJURY_DETAILS:
      return ROUTES.EXPERIENCE

    // Verified: ExperienceScreen → /exercise-type (unconditional)
    case ROUTES.EXPERIENCE:
      return ROUTES.EXERCISE_TYPE

    // Verified: ExerciseTypeScreen → /program (unconditional)
    case ROUTES.EXERCISE_TYPE:
      return ROUTES.PROGRAM

    // Verified: ProfilePhotoScreen → /program (unconditional)
    case ROUTES.PROFILE_PHOTO:
      return ROUTES.PROGRAM

    // Verified: ProgramSelectionScreen → /plan (unconditional)
    case ROUTES.PROGRAM:
      return ROUTES.PLAN

    // Verified: PersonalTrainingSelectionScreen → /review (all paths: trial and non-trial)
    case ROUTES.PERSONAL_TRAINING:
      return ROUTES.REVIEW

    // All other routes: not yet migrated or branch-heavy. Screens use their own inline navigate.
    default:
      return null
  }
}
