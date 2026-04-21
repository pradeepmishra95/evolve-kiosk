import type { UserPurpose, UserStatus } from "../types/domain"

/** A confirmed journey intent — UserPurpose without the unset empty string. */
export type JourneyKind = Exclude<UserPurpose, "">

/**
 * Coarse classification of the user at kiosk entry.
 * Derived from UserStatus: "new" maps to "new", everything else is "returning".
 */
export type CustomerType = "new" | "returning"

export const deriveCustomerType = (status: UserStatus): CustomerType =>
  status === "new" ? "new" : "returning"

/** Type guard: purpose is a confirmed JourneyKind (not the empty unset string). */
export const isJourneyKind = (purpose: UserPurpose): purpose is JourneyKind =>
  purpose !== ""

/** True if this journey requires payment and consent (trial, enroll, renew). */
export const isBookingJourney = (purpose: UserPurpose): boolean =>
  purpose === "trial" || purpose === "enroll" || purpose === "renew"

/** True if this journey is enquiry-only and does not proceed to payment. */
export const isEnquiryJourney = (purpose: UserPurpose): boolean =>
  purpose === "enquiry"
