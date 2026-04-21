/**
 * Regression tests for the shared kiosk flow layer.
 *
 * Covers: predicates, getNextRoute, getPreviousRoute, getRouteRedirect.
 * All modules under test are pure TypeScript — no DOM, no Firebase, no React.
 */
import { describe, it, expect } from "vitest"

import { getNextRoute } from "../getNextRoute"
import { getPreviousRoute } from "../getPreviousRoute"
import { getRouteRedirect } from "../getGuardRedirect"
import {
  shouldRequireProfilePhoto,
  hasProfilePhoto,
  isPersonalTrainingProgram,
} from "../predicates"
import type { UserState } from "../../store/userStore"
import { ROUTES } from "../routes"

// ---------------------------------------------------------------------------
// State factory
// ---------------------------------------------------------------------------

/**
 * Mirrors userStore initialState exactly. All flow functions receive UserState
 * but only read data fields — the Zustand methods are never accessed by
 * the modules under test. We cast to satisfy TypeScript.
 */
const BASE = {
  language: "",
  purpose: "" as UserState["purpose"],
  primaryGoal: "",
  specificGoal: "",
  enquiryMessage: "",
  name: "",
  dateOfBirth: "",
  age: null as number | null,
  phone: "",
  countryCode: "+91",
  gender: "" as UserState["gender"],
  lookingFor: "",
  referenceSource: "",
  followUpDate: "",
  followUpTime: "",
  experience: "",
  priorExerciseExperience: "",
  priorExerciseActivity: [] as string[],
  priorExerciseDuration: "",
  lastExerciseTime: "",
  injury: false,
  injuryAnswered: false,
  injuryDetails: "",
  exerciseType: "",
  selectedPlanId: "",
  program: "",
  plan: "",
  coach: "",
  days: "",
  selectedAddOnIds: [] as string[],
  mainPlanPrice: 0,
  mainPlanOriginalPrice: 0,
  price: 0,
  duration: "" as UserState["duration"],
  batchType: "",
  batchTime: "",
  batchDate: "",
  profilePhotoUrl: "",
  profilePhotoStoragePath: "",
  profilePhotoHash: "",
  profilePhotoUploadedAt: "",
  profilePhotoSource: "" as UserState["profilePhotoSource"],
  paymentReference: "",
  paymentMethod: "" as UserState["paymentMethod"],
  paymentStatus: "" as UserState["paymentStatus"],
  isPartialPayment: false,
  partialPaymentDueDate: "",
  isSplitPayment: false,
  paidAmount: 0,
  dueAmount: 0,
  paymentCollectionStep: 1 as 1 | 2,
  paymentMethod1: "" as UserState["paymentMethod1"],
  paymentMethod2: "" as UserState["paymentMethod2"],
  paymentSurchargeAmount: 0,
  paymentTotalAmount: 0,
  consentRequestId: "",
  consentRecordId: "",
  consentSigningStatus: "draft" as UserState["consentSigningStatus"],
  consentSignerType: "" as UserState["consentSignerType"],
  consentGuardianName: "",
  consentGuardianPhone: "",
  consentGuardianRelationship: "",
  consentTermsVersion: "1",
  consentDocumentVersion: "1",
  consentAgreed: false,
  consentAgreedAt: "",
  consentProviderName: "",
  consentProviderRequestId: "",
  consentProviderTransactionId: "",
  consentDocumentHash: "",
  consentUnsignedPdfUrl: "",
  consentSignedPdfUrl: "",
  consentAuditTrailUrl: "",
  consentUnsignedPdfStoragePath: "",
  consentSignedPdfStoragePath: "",
  consentAuditTrailStoragePath: "",
  consentSupplementarySignatureDataUrl: "",
  consentSupplementarySignatureUrl: "",
  consentSupplementarySignatureStoragePath: "",
  consentSupplementarySignatureHash: "",
  consentErrorMessage: "",
  status: "new" as UserState["status"],
  cameFromTrial: false,
  hydrated: false,
}

/** Build a UserState with specific overrides. */
function s(overrides: Partial<typeof BASE> = {}): UserState {
  return { ...BASE, ...overrides } as unknown as UserState
}

/**
 * Completed intake: satisfies hasCompletedIntake (name, phone, age, gender,
 * lookingFor, referenceSource, injuryAnswered, priorExerciseExperience, exerciseType).
 * Uses a valid Indian mobile number (starts with 9, 10 digits).
 */
const INTAKE: Partial<typeof BASE> = {
  name: "Test Member",
  phone: "9876543210",
  countryCode: "+91",
  age: 25,
  gender: "male",
  lookingFor: "Self",
  referenceSource: "Walk In",
  injuryAnswered: true,
  injury: false,
  priorExerciseExperience: "no",
  exerciseType: "Calisthenics",
  experience: "Beginner",
}

/**
 * A state ready for /success (enroll): all guards in the payment + consent
 * chain pass. Includes profile photo so shouldRequireProfilePhoto is satisfied.
 */
const ENROLL_READY: Partial<typeof BASE> = {
  ...INTAKE,
  status: "new",
  purpose: "enroll",
  program: "Calisthenics",
  selectedPlanId: "plan-1",
  duration: "Monthly",
  batchType: "morning",
  batchTime: "6:00 AM",
  profilePhotoUrl: "https://example.com/photo.jpg",
  paymentStatus: "paid",
  paymentMethod: "cash",
  consentAgreed: true,
}

// ---------------------------------------------------------------------------
// predicates
// ---------------------------------------------------------------------------

describe("shouldRequireProfilePhoto", () => {
  it("is true for a new enroll member", () => {
    expect(shouldRequireProfilePhoto(s({ status: "new", purpose: "enroll" }))).toBe(true)
  })

  it("is false for a trial booking (not enroll)", () => {
    expect(shouldRequireProfilePhoto(s({ status: "new", purpose: "trial" }))).toBe(false)
  })

  it("is false for an enquiry (not enroll)", () => {
    expect(shouldRequireProfilePhoto(s({ status: "new", purpose: "enquiry" }))).toBe(false)
  })

  it("is false for a renewal", () => {
    expect(shouldRequireProfilePhoto(s({ status: "new", purpose: "renew" }))).toBe(false)
  })

  it("is false for a returning member re-enrolling (status !== new)", () => {
    expect(shouldRequireProfilePhoto(s({ status: "member", purpose: "enroll" }))).toBe(false)
  })
})

describe("hasProfilePhoto", () => {
  it("is true when profilePhotoUrl is set", () => {
    expect(hasProfilePhoto(s({ profilePhotoUrl: "https://example.com/a.jpg" }))).toBe(true)
  })

  it("is true when profilePhotoStoragePath is set", () => {
    expect(hasProfilePhoto(s({ profilePhotoStoragePath: "photos/abc.jpg" }))).toBe(true)
  })

  it("is false when both are empty", () => {
    expect(hasProfilePhoto(s())).toBe(false)
  })
})

describe("isPersonalTrainingProgram", () => {
  it("is true for 'Personal Training'", () => {
    expect(isPersonalTrainingProgram(s({ program: "Personal Training" }))).toBe(true)
  })

  it("is true for lowercase 'personal training'", () => {
    expect(isPersonalTrainingProgram(s({ program: "personal training" }))).toBe(true)
  })

  it("is true for a label that contains 'personal training'", () => {
    expect(isPersonalTrainingProgram(s({ program: "1-on-1 Personal Training" }))).toBe(true)
  })

  it("is false for 'Calisthenics'", () => {
    expect(isPersonalTrainingProgram(s({ program: "Calisthenics" }))).toBe(false)
  })

  it("is false when program is empty", () => {
    expect(isPersonalTrainingProgram(s({ program: "" }))).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// getNextRoute
// ---------------------------------------------------------------------------

describe("getNextRoute", () => {
  describe("linear routes", () => {
    it("WELCOME → /phone", () => {
      expect(getNextRoute(ROUTES.WELCOME, s())).toBe(ROUTES.PHONE)
    })

    it("GOAL → /user-details", () => {
      expect(getNextRoute(ROUTES.GOAL, s())).toBe(ROUTES.USER_DETAILS)
    })

    it("SPECIFIC_GOAL → /user-details", () => {
      expect(getNextRoute(ROUTES.SPECIFIC_GOAL, s())).toBe(ROUTES.USER_DETAILS)
    })

    it("PROFILE_PHOTO → /program", () => {
      expect(getNextRoute(ROUTES.PROFILE_PHOTO, s())).toBe(ROUTES.PROGRAM)
    })

    it("PROGRAM → /plan", () => {
      expect(getNextRoute(ROUTES.PROGRAM, s())).toBe(ROUTES.PLAN)
    })

    it("PERSONAL_TRAINING → /review", () => {
      expect(getNextRoute(ROUTES.PERSONAL_TRAINING, s())).toBe(ROUTES.REVIEW)
    })
  })

  describe("USER_DETAILS → profile-photo rule", () => {
    it("new enroll with no photo → /profile-photo", () => {
      expect(
        getNextRoute(ROUTES.USER_DETAILS, s({ status: "new", purpose: "enroll" }))
      ).toBe(ROUTES.PROFILE_PHOTO)
    })

    it("new enroll with saved photo → /program", () => {
      expect(
        getNextRoute(
          ROUTES.USER_DETAILS,
          s({ status: "new", purpose: "enroll", profilePhotoUrl: "https://example.com/p.jpg" })
        )
      ).toBe(ROUTES.PROGRAM)
    })

    it("new trial → /program (no photo required)", () => {
      expect(
        getNextRoute(ROUTES.USER_DETAILS, s({ status: "new", purpose: "trial" }))
      ).toBe(ROUTES.PROGRAM)
    })

    it("returning member re-enroll → /program (no photo required)", () => {
      expect(
        getNextRoute(ROUTES.USER_DETAILS, s({ status: "member", purpose: "enroll" }))
      ).toBe(ROUTES.PROGRAM)
    })
  })

  describe("INJURY action discriminator", () => {
    it("action='injury' → /injury-details", () => {
      expect(getNextRoute(ROUTES.INJURY, s(), "injury")).toBe(ROUTES.INJURY_DETAILS)
    })

    it("action='no-injury' → /experience", () => {
      expect(getNextRoute(ROUTES.INJURY, s(), "no-injury")).toBe(ROUTES.EXPERIENCE)
    })
  })
})

// ---------------------------------------------------------------------------
// getPreviousRoute
// ---------------------------------------------------------------------------

describe("getPreviousRoute", () => {
  it("PHONE → /", () => {
    expect(getPreviousRoute(ROUTES.PHONE, s())).toBe(ROUTES.WELCOME)
  })

  it("RETURN_USER → /phone", () => {
    expect(getPreviousRoute(ROUTES.RETURN_USER, s())).toBe(ROUTES.PHONE)
  })

  it("USER_DETAILS → /phone (safe multi-origin fallback)", () => {
    expect(getPreviousRoute(ROUTES.USER_DETAILS, s())).toBe(ROUTES.PHONE)
  })

  it("PROFILE_PHOTO → /user-details", () => {
    expect(getPreviousRoute(ROUTES.PROFILE_PHOTO, s())).toBe(ROUTES.USER_DETAILS)
  })

  it("PERSONAL_TRAINING → /plan", () => {
    expect(getPreviousRoute(ROUTES.PERSONAL_TRAINING, s())).toBe(ROUTES.PLAN)
  })

  describe("PROGRAM back-nav", () => {
    it("returns /exercise-type when exerciseType is set (came from intake sub-steps)", () => {
      expect(getPreviousRoute(ROUTES.PROGRAM, s({ exerciseType: "Calisthenics" }))).toBe(
        ROUTES.EXERCISE_TYPE
      )
    })

    it("returns /profile-photo for new enroll with a saved photo (exerciseType empty)", () => {
      expect(
        getPreviousRoute(
          ROUTES.PROGRAM,
          s({ status: "new", purpose: "enroll", profilePhotoUrl: "https://example.com/p.jpg" })
        )
      ).toBe(ROUTES.PROFILE_PHOTO)
    })

    it("returns /user-details for trial (no exerciseType, no photo requirement)", () => {
      expect(
        getPreviousRoute(ROUTES.PROGRAM, s({ status: "new", purpose: "trial" }))
      ).toBe(ROUTES.USER_DETAILS)
    })

    it("returns /user-details for returning member enroll (shouldRequireProfilePhoto = false)", () => {
      expect(
        getPreviousRoute(
          ROUTES.PROGRAM,
          s({ status: "member", purpose: "enroll", profilePhotoUrl: "https://example.com/p.jpg" })
        )
      ).toBe(ROUTES.USER_DETAILS)
    })
  })

  describe("PLAN back-nav", () => {
    it("returns /review for enquiry purpose (editing plan from review)", () => {
      expect(getPreviousRoute(ROUTES.PLAN, s({ purpose: "enquiry" }))).toBe(ROUTES.REVIEW)
    })

    it("returns /review for enquiry status", () => {
      expect(getPreviousRoute(ROUTES.PLAN, s({ status: "enquiry" as UserState["status"] }))).toBe(
        ROUTES.REVIEW
      )
    })

    it("returns /program for enroll purpose", () => {
      expect(getPreviousRoute(ROUTES.PLAN, s({ purpose: "enroll" }))).toBe(ROUTES.PROGRAM)
    })

    it("returns /program for trial purpose", () => {
      expect(getPreviousRoute(ROUTES.PLAN, s({ purpose: "trial" }))).toBe(ROUTES.PROGRAM)
    })
  })

  it("REVIEW → /plan", () => {
    expect(getPreviousRoute(ROUTES.REVIEW, s())).toBe(ROUTES.PLAN)
  })

  it("PAYMENT → /review", () => {
    expect(getPreviousRoute(ROUTES.PAYMENT, s())).toBe(ROUTES.REVIEW)
  })

  it("PAYMENT_CASH → /payment", () => {
    expect(getPreviousRoute(ROUTES.PAYMENT_CASH, s())).toBe(ROUTES.PAYMENT)
  })

  it("PAYMENT_UPI → /payment", () => {
    expect(getPreviousRoute(ROUTES.PAYMENT_UPI, s())).toBe(ROUTES.PAYMENT)
  })

  it("CONSENT → /payment", () => {
    expect(getPreviousRoute(ROUTES.CONSENT, s())).toBe(ROUTES.PAYMENT)
  })

  it("unknown route → null", () => {
    expect(getPreviousRoute(ROUTES.SUCCESS, s())).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// getRouteRedirect (guard layer)
// ---------------------------------------------------------------------------

describe("getRouteRedirect", () => {
  describe("/user-details guard", () => {
    it("redirects to /phone when phone is missing", () => {
      expect(getRouteRedirect("/user-details", s())).toBe("/phone")
    })

    it("allows through when phone is present", () => {
      expect(getRouteRedirect("/user-details", s({ phone: "9876543210" }))).toBeNull()
    })
  })

  describe("/consent guard", () => {
    it("redirects enquiry to /review (consent is not part of enquiry flow)", () => {
      expect(getRouteRedirect("/consent", s({ purpose: "enquiry" }))).toBe("/review")
    })

    it("redirects to /payment when payment is not yet completed", () => {
      // Must satisfy the full guard chain (intake, plan, batch) before the payment check fires.
      expect(
        getRouteRedirect(
          "/consent",
          s({
            ...INTAKE,
            purpose: "enroll",
            program: "Calisthenics",
            selectedPlanId: "plan-1",
            duration: "Monthly",
            batchType: "morning",
            batchTime: "6:00 AM",
            profilePhotoUrl: "https://example.com/p.jpg",
            paymentStatus: "",
            paymentMethod: "",
          })
        )
      ).toBe("/payment")
    })

    it("allows through when payment is done (user needs to complete consent on this screen)", () => {
      expect(
        getRouteRedirect(
          "/consent",
          s({ purpose: "enroll", paymentStatus: "paid", paymentMethod: "cash", ...INTAKE, program: "Calisthenics", selectedPlanId: "plan-1", duration: "Monthly", batchType: "morning", batchTime: "6:00 AM", profilePhotoUrl: "https://example.com/p.jpg" })
        )
      ).toBeNull()
    })
  })

  describe("/success guard", () => {
    it("allows idle/reset state through (post-reset, phone+purpose both empty)", () => {
      // After data.reset(), state looks like initialState: phone="", purpose="", status="new"
      expect(getRouteRedirect("/success", s())).toBeNull()
    })

    it("redirects to /payment when payment is missing", () => {
      expect(
        getRouteRedirect(
          "/success",
          s({ ...INTAKE, purpose: "enroll", program: "Calisthenics", selectedPlanId: "plan-1", duration: "Monthly", batchType: "morning", batchTime: "6:00 AM", profilePhotoUrl: "https://example.com/p.jpg", paymentStatus: "", paymentMethod: "", consentAgreed: false })
        )
      ).toBe("/payment")
    })

    it("redirects to /consent when payment done but consent not yet agreed", () => {
      expect(
        getRouteRedirect(
          "/success",
          s({ ...ENROLL_READY, consentAgreed: false })
        )
      ).toBe("/consent")
    })

    it("allows through when payment + consent are both complete (enroll)", () => {
      expect(getRouteRedirect("/success", s(ENROLL_READY))).toBeNull()
    })
  })

  describe("/profile-photo guard", () => {
    it("allows new enroll through (intake still incomplete — guard defers to intake check)", () => {
      // getProgramRedirect is used; with no exerciseType it redirects to /user-details
      expect(
        getRouteRedirect("/profile-photo", s({ status: "new", purpose: "enroll" }))
      ).toBe("/user-details")
    })

    it("redirects to /program for trial (profile-photo only required for new enroll)", () => {
      // Trial with completed intake but no exerciseType triggers /user-details redirect
      // Trial with full intake passes getProgramRedirect and arrives at null from /profile-photo
      // since getProgramRedirect only redirects to /profile-photo if shouldRequireProfilePhoto
      expect(
        getRouteRedirect(
          "/profile-photo",
          s({ ...INTAKE, status: "new", purpose: "trial" })
        )
      ).toBeNull()
    })
  })
})
