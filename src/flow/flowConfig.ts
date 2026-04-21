import { ROUTES, type KioskRoute } from "./routes"
import type { JourneyKind } from "./journeyTypes"

export type RouteFlowMeta = {
  /**
   * Journeys this route participates in.
   * Empty array means the route is a universal entry point (not journey-specific).
   */
  journeys: JourneyKind[]
  /**
   * Possible back-navigation targets in preference order.
   * Multiple entries because the correct target can depend on flow state.
   * Phase 4 will use these to replace the static switch in BackButton.
   * Not enforced yet.
   */
  backCandidates: KioskRoute[]
  /**
   * Known issue from Phase 1 audit. Removed once fixed in a later phase.
   */
  auditNote?: string
}

export const FLOW_CONFIG: Record<KioskRoute, RouteFlowMeta> = {
  [ROUTES.WELCOME]: {
    journeys: [],
    backCandidates: [],
  },
  [ROUTES.PHONE]: {
    journeys: [],
    backCandidates: [ROUTES.WELCOME],
  },
  [ROUTES.GOAL]: {
    journeys: ["enquiry"],
    backCandidates: [ROUTES.PHONE],
    auditNote: "back candidate not wired in BackButton — no back button shown",
  },
  [ROUTES.SPECIFIC_GOAL]: {
    journeys: ["enquiry"],
    backCandidates: [ROUTES.GOAL],
    auditNote: "back candidate not wired in BackButton — no back button shown",
  },
  [ROUTES.RETURN_USER]: {
    journeys: ["trial", "enroll", "renew"],
    backCandidates: [ROUTES.PHONE],
  },
  [ROUTES.USER_DETAILS]: {
    journeys: ["enroll", "enquiry", "trial"],
    backCandidates: [ROUTES.PHONE],
  },
  [ROUTES.EXPERIENCE]: {
    journeys: ["enroll", "enquiry"],
    backCandidates: [ROUTES.USER_DETAILS],
    auditNote: "guard redirects completed users to /program; only reachable as sub-step inside UserDetailsScreen",
  },
  [ROUTES.INJURY]: {
    journeys: ["enroll", "enquiry"],
    backCandidates: [ROUTES.USER_DETAILS],
    auditNote: "guard redirects completed users to /program; only reachable as sub-step inside UserDetailsScreen",
  },
  [ROUTES.INJURY_DETAILS]: {
    journeys: ["enroll", "enquiry"],
    backCandidates: [ROUTES.INJURY],
    auditNote: "guard redirects completed users to /program; only reachable as sub-step inside UserDetailsScreen",
  },
  [ROUTES.EXERCISE_TYPE]: {
    journeys: ["enroll", "enquiry"],
    backCandidates: [ROUTES.USER_DETAILS],
    auditNote: "guard redirects completed users to /program; only reachable as sub-step inside UserDetailsScreen",
  },
  [ROUTES.PROFILE_PHOTO]: {
    journeys: ["enroll"],
    backCandidates: [ROUTES.USER_DETAILS],
  },
  [ROUTES.PROGRAM]: {
    journeys: ["enroll", "enquiry", "trial", "renew"],
    backCandidates: [ROUTES.PROFILE_PHOTO, ROUTES.USER_DETAILS],
    auditNote: "BackButton always returns /profile-photo regardless of flow variant (trial/renew never visit it)",
  },
  [ROUTES.PLAN]: {
    journeys: ["enroll", "enquiry", "trial", "renew"],
    backCandidates: [ROUTES.PROGRAM, ROUTES.REVIEW],
  },
  [ROUTES.PERSONAL_TRAINING]: {
    journeys: ["enroll", "trial"],
    backCandidates: [ROUTES.PLAN],
  },
  [ROUTES.BATCH_TYPE]: {
    journeys: ["enroll", "trial"],
    backCandidates: [ROUTES.PLAN],
    auditNote: "route guard unconditionally redirects to /program — route is unreachable",
  },
  [ROUTES.TIME_SELECTION]: {
    journeys: ["enroll", "trial"],
    backCandidates: [ROUTES.BATCH_TYPE],
    auditNote: "route guard unconditionally redirects to /program — route is unreachable",
  },
  [ROUTES.ENQUIRY]: {
    journeys: ["enquiry"],
    backCandidates: [ROUTES.REVIEW],
    auditNote: "getEnquiryRedirect never returns null — route is unreachable",
  },
  [ROUTES.ENQUIRY_THANK_YOU]: {
    journeys: ["enquiry"],
    backCandidates: [],
  },
  [ROUTES.REVIEW]: {
    journeys: ["enroll", "enquiry", "trial", "renew"],
    backCandidates: [ROUTES.PLAN, ROUTES.PERSONAL_TRAINING],
  },
  [ROUTES.PAYMENT]: {
    journeys: ["enroll", "trial", "renew"],
    backCandidates: [ROUTES.REVIEW],
  },
  [ROUTES.PAYMENT_CASH]: {
    journeys: ["enroll", "trial", "renew"],
    backCandidates: [ROUTES.PAYMENT],
  },
  [ROUTES.PAYMENT_UPI]: {
    journeys: ["enroll", "trial", "renew"],
    backCandidates: [ROUTES.PAYMENT],
  },
  [ROUTES.CONSENT]: {
    journeys: ["enroll", "trial", "renew"],
    backCandidates: [ROUTES.PAYMENT],
  },
  [ROUTES.SUCCESS]: {
    journeys: ["enroll", "enquiry", "trial", "renew"],
    backCandidates: [],
  },
}
