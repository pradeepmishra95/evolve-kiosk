import { create } from "zustand"
import { persist, type PersistStorage, type StorageValue } from "zustand/middleware"
import { CONSENT_DOCUMENT_VERSION, CONSENT_TERMS_VERSION } from "../consent/consentContent"
import type { ConsentSignerType, ConsentSigningStatus } from "../consent/consentTypes"
import type {
 MembershipDuration,
 PaymentMethod,
 PaymentStatus,
 ProfilePhotoSource,
 UserGender,
 UserPurpose,
 UserStatus
} from "../types/domain"
import { calculateAgeFromDateOfBirth } from "../utils/dateOfBirth"
import { normalizeCountryCode } from "../utils/validation"

export interface UserState {

 language: string

 purpose: UserPurpose

 primaryGoal: string
 specificGoal: string
 enquiryMessage: string

 name: string
 dateOfBirth: string
 age: number | null
 phone: string
 countryCode: string
 gender: UserGender
 lookingFor: string
 referenceSource: string
 followUpDate: string
 followUpTime: string

 experience: string
 priorExerciseExperience: string
 priorExerciseActivity: string[]
 priorExerciseDuration: string
 lastExerciseTime: string
 injury: boolean
 injuryAnswered: boolean
 injuryDetails: string

 exerciseType: string

 selectedPlanId: string

 program: string
 plan: string
 coach: string
 days: string
 selectedAddOnIds: string[]
 mainPlanPrice: number
 mainPlanOriginalPrice: number

 price: number
 discountAmount: number
 duration: MembershipDuration

 batchType: string
 batchTime: string
 batchDate: string
 profilePhotoUrl: string
 profilePhotoStoragePath: string
 profilePhotoHash: string
 profilePhotoUploadedAt: string
 profilePhotoSource: ProfilePhotoSource

 paymentReference: string
 paymentMethod: PaymentMethod
 paymentStatus: PaymentStatus
 isPartialPayment: boolean
 partialPaymentDueDate: string
 isSplitPayment: boolean
 paidAmount: number
 dueAmount: number
 paymentCollectionStep: 1 | 2
 paymentMethod1: PaymentMethod
 paymentMethod2: PaymentMethod
 paymentSurchargeAmount: number
 paymentTotalAmount: number

 consentRequestId: string
 consentRecordId: string
 consentSigningStatus: ConsentSigningStatus
 consentSignerType: ConsentSignerType | ""
 consentGuardianName: string
 consentGuardianPhone: string
 consentGuardianRelationship: string
 consentTermsVersion: string
 consentDocumentVersion: string
 consentAgreed: boolean
 consentAgreedAt: string
 consentProviderName: string
 consentProviderRequestId: string
 consentProviderTransactionId: string
 consentDocumentHash: string
 consentUnsignedPdfUrl: string
 consentSignedPdfUrl: string
 consentAuditTrailUrl: string
 consentUnsignedPdfStoragePath: string
 consentSignedPdfStoragePath: string
 consentAuditTrailStoragePath: string
 consentSupplementarySignatureDataUrl: string
 consentSupplementarySignatureUrl: string
 consentSupplementarySignatureStoragePath: string
 consentSupplementarySignatureHash: string
 consentErrorMessage: string

 status: UserStatus
 cameFromTrial: boolean
 hydrated: boolean

 setData: (data: Partial<UserState>) => void
 setHydrated: (hydrated: boolean) => void
 clearConsentSigning: () => void
 reset: () => void
}

export type UserStoreData = Omit<UserState, "setData" | "setHydrated" | "clearConsentSigning" | "reset">

const initialState: UserStoreData = {

 language: "",

 purpose: "",

 primaryGoal: "",
 specificGoal: "",
 enquiryMessage: "",

 name: "",
 dateOfBirth: "",
 age: null,
 phone: "",
 countryCode: "+91",
 gender: "",
 lookingFor: "",
 referenceSource: "",
 followUpDate: "",
 followUpTime: "",

 experience: "",
 priorExerciseExperience: "",
 priorExerciseActivity: [],
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
 selectedAddOnIds: [],
 mainPlanPrice: 0,
 mainPlanOriginalPrice: 0,

 price: 0,
 discountAmount: 0,
 duration: "",

 batchType: "",
 batchTime: "",
 batchDate: "",
 profilePhotoUrl: "",
 profilePhotoStoragePath: "",
 profilePhotoHash: "",
 profilePhotoUploadedAt: "",
 profilePhotoSource: "",

 paymentReference: "",
 paymentMethod: "",
 paymentStatus: "",
 isPartialPayment: false,
 partialPaymentDueDate: "",
 isSplitPayment: false,
 paidAmount: 0,
 dueAmount: 0,
 paymentCollectionStep: 1,
 paymentMethod1: "",
 paymentMethod2: "",
 paymentSurchargeAmount: 0,
 paymentTotalAmount: 0,

 consentRequestId: "",
 consentRecordId: "",
 consentSigningStatus: "draft",
 consentSignerType: "",
 consentGuardianName: "",
 consentGuardianPhone: "",
 consentGuardianRelationship: "",
 consentTermsVersion: CONSENT_TERMS_VERSION,
 consentDocumentVersion: CONSENT_DOCUMENT_VERSION,
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

 status: "new",
 cameFromTrial: false,
 hydrated: false
}

const safeSessionStorage: PersistStorage<unknown> = {
 getItem: (name) => {
  if (typeof window === "undefined") {
   return null
  }

  const rawValue = window.sessionStorage.getItem(name)

  if (!rawValue) {
   return null
  }

  try {
   return JSON.parse(rawValue) as StorageValue<unknown>
  } catch {
   window.sessionStorage.removeItem(name)
   return null
  }
 },
 setItem: (name, value) => {
  if (typeof window === "undefined") {
   return
  }

  window.sessionStorage.setItem(name, JSON.stringify(value))
 },
 removeItem: (name) => {
  if (typeof window === "undefined") {
   return
  }

  window.sessionStorage.removeItem(name)
 }
}

const USER_FLOW_STORAGE_KEY = "evolve-kiosk-user-flow"

export const useUserStore = create<UserState>()(
 persist(
  (set) => ({
   ...initialState,

   setData: (data) =>
    set((state) => ({
     ...state,
     ...data
   })),

   setHydrated: (hydrated) => set({ hydrated }),

   clearConsentSigning: () =>
    set({
     consentRequestId: "",
     consentRecordId: "",
     consentSigningStatus: "draft",
     consentSignerType: "",
     consentGuardianName: "",
     consentGuardianPhone: "",
     consentGuardianRelationship: "",
     consentTermsVersion: CONSENT_TERMS_VERSION,
     consentDocumentVersion: CONSENT_DOCUMENT_VERSION,
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
    consentErrorMessage: ""
    }),

   reset: () => {
    safeSessionStorage.removeItem(USER_FLOW_STORAGE_KEY)
    set({
     ...initialState,
     hydrated: true
    })
   }
  }),
  {
   name: USER_FLOW_STORAGE_KEY,
   version: 12,
   storage: safeSessionStorage,
   partialize: (state) => ({
    language: state.language,
    purpose: state.purpose,
    primaryGoal: state.primaryGoal,
    specificGoal: state.specificGoal,
    enquiryMessage: state.enquiryMessage,
    name: state.name,
    dateOfBirth: state.dateOfBirth,
    age: state.age,
    phone: state.phone,
    countryCode: state.countryCode,
    gender: state.gender,
    lookingFor: state.lookingFor,
    referenceSource: state.referenceSource,
    followUpDate: state.followUpDate,
    followUpTime: state.followUpTime,
    experience: state.experience,
    priorExerciseExperience: state.priorExerciseExperience,
    priorExerciseActivity: state.priorExerciseActivity,
    priorExerciseDuration: state.priorExerciseDuration,
    lastExerciseTime: state.lastExerciseTime,
    injury: state.injury,
    injuryAnswered: state.injuryAnswered,
    injuryDetails: state.injuryDetails,
    exerciseType: state.exerciseType,
    selectedPlanId: state.selectedPlanId,
    program: state.program,
    plan: state.plan,
    coach: state.coach,
    days: state.days,
    selectedAddOnIds: state.selectedAddOnIds,
    mainPlanPrice: state.mainPlanPrice,
    mainPlanOriginalPrice: state.mainPlanOriginalPrice,
    price: state.price,
    discountAmount: state.discountAmount,
    duration: state.duration,
    batchType: state.batchType,
    batchTime: state.batchTime,
    batchDate: state.batchDate,
    profilePhotoUrl: state.profilePhotoUrl,
    profilePhotoStoragePath: state.profilePhotoStoragePath,
    profilePhotoHash: state.profilePhotoHash,
    profilePhotoUploadedAt: state.profilePhotoUploadedAt,
    profilePhotoSource: state.profilePhotoSource,
    paymentReference: state.paymentReference,
    paymentMethod: state.paymentMethod,
    paymentStatus: state.paymentStatus,
    isPartialPayment: state.isPartialPayment,
    partialPaymentDueDate: state.partialPaymentDueDate,
    isSplitPayment: state.isSplitPayment,
    paidAmount: state.paidAmount,
    dueAmount: state.dueAmount,
    paymentCollectionStep: state.paymentCollectionStep,
    paymentMethod1: state.paymentMethod1,
    paymentMethod2: state.paymentMethod2,
    paymentSurchargeAmount: state.paymentSurchargeAmount,
    paymentTotalAmount: state.paymentTotalAmount,
    consentRequestId: state.consentRequestId,
    consentRecordId: state.consentRecordId,
    consentSigningStatus: state.consentSigningStatus,
    consentSignerType: state.consentSignerType,
    consentGuardianName: state.consentGuardianName,
    consentGuardianPhone: state.consentGuardianPhone,
    consentGuardianRelationship: state.consentGuardianRelationship,
    consentTermsVersion: state.consentTermsVersion,
    consentDocumentVersion: state.consentDocumentVersion,
    consentAgreed: state.consentAgreed,
    consentAgreedAt: state.consentAgreedAt,
    consentProviderName: state.consentProviderName,
    consentProviderRequestId: state.consentProviderRequestId,
    consentProviderTransactionId: state.consentProviderTransactionId,
    consentDocumentHash: state.consentDocumentHash,
    consentUnsignedPdfUrl: state.consentUnsignedPdfUrl,
    consentSignedPdfUrl: state.consentSignedPdfUrl,
    consentAuditTrailUrl: state.consentAuditTrailUrl,
    consentUnsignedPdfStoragePath: state.consentUnsignedPdfStoragePath,
    consentSignedPdfStoragePath: state.consentSignedPdfStoragePath,
    consentAuditTrailStoragePath: state.consentAuditTrailStoragePath,
    consentSupplementarySignatureDataUrl: state.consentSupplementarySignatureDataUrl,
    consentSupplementarySignatureUrl: state.consentSupplementarySignatureUrl,
    consentSupplementarySignatureStoragePath: state.consentSupplementarySignatureStoragePath,
    consentSupplementarySignatureHash: state.consentSupplementarySignatureHash,
    consentErrorMessage: state.consentErrorMessage,
    status: state.status,
    hydrated: state.hydrated
   }),
   migrate: (persistedState) => {
    const nextState = (persistedState ?? {}) as Partial<UserStoreData> & {
     priorExerciseActivity?: string[] | string
    }

    const dateOfBirth = typeof nextState.dateOfBirth === "string" ? nextState.dateOfBirth : ""
    const derivedAge = dateOfBirth ? calculateAgeFromDateOfBirth(dateOfBirth) : null
    const lookingFor = typeof nextState.lookingFor === "string" ? nextState.lookingFor : ""
    const referenceSource =
     typeof nextState.referenceSource === "string" ? nextState.referenceSource : ""
    const countryCode = normalizeCountryCode(
     typeof nextState.countryCode === "string" ? nextState.countryCode : ""
    )
    const selectedAddOnIds = Array.isArray((nextState as { selectedAddOnIds?: unknown }).selectedAddOnIds)
     ? (nextState as { selectedAddOnIds?: string[] }).selectedAddOnIds?.filter(
        (item): item is string => typeof item === "string" && Boolean(item)
       ) ?? []
     : []
    const mainPlanPrice =
     typeof (nextState as { mainPlanPrice?: unknown }).mainPlanPrice === "number" &&
     Number.isFinite((nextState as { mainPlanPrice?: number }).mainPlanPrice ?? NaN)
      ? ((nextState as { mainPlanPrice?: number }).mainPlanPrice ?? 0)
      : 0

    return {
     ...initialState,
     ...nextState,
     dateOfBirth,
     countryCode,
     lookingFor,
     referenceSource,
     age:
      typeof nextState.age === "number" && !Number.isNaN(nextState.age)
       ? nextState.age
       : derivedAge,
     selectedAddOnIds,
     mainPlanPrice,
     priorExerciseActivity: Array.isArray(nextState.priorExerciseActivity)
      ? nextState.priorExerciseActivity
      : typeof nextState.priorExerciseActivity === "string" && nextState.priorExerciseActivity
       ? [nextState.priorExerciseActivity]
       : [],
     batchDate: typeof nextState.batchDate === "string" ? nextState.batchDate : "",
     profilePhotoUrl: typeof nextState.profilePhotoUrl === "string" ? nextState.profilePhotoUrl : "",
     profilePhotoStoragePath:
      typeof nextState.profilePhotoStoragePath === "string" ? nextState.profilePhotoStoragePath : "",
     profilePhotoHash: typeof nextState.profilePhotoHash === "string" ? nextState.profilePhotoHash : "",
     profilePhotoUploadedAt:
     typeof nextState.profilePhotoUploadedAt === "string" ? nextState.profilePhotoUploadedAt : "",
     profilePhotoSource:
      nextState.profilePhotoSource === "camera" || nextState.profilePhotoSource === "gallery"
       ? nextState.profilePhotoSource
       : "",
     isPartialPayment: Boolean(nextState.isPartialPayment),
     paidAmount:
      typeof nextState.paidAmount === "number" && Number.isFinite(nextState.paidAmount)
       ? nextState.paidAmount
       : 0,
     dueAmount:
      typeof nextState.dueAmount === "number" && Number.isFinite(nextState.dueAmount)
       ? nextState.dueAmount
       : 0,
     paymentCollectionStep: nextState.paymentCollectionStep === 2 ? 2 : 1,
     paymentMethod1:
      typeof nextState.paymentMethod1 === "string" ? nextState.paymentMethod1 : "",
     paymentMethod2:
      typeof nextState.paymentMethod2 === "string" ? nextState.paymentMethod2 : "",
     paymentSurchargeAmount:
      typeof nextState.paymentSurchargeAmount === "number" && Number.isFinite(nextState.paymentSurchargeAmount)
       ? nextState.paymentSurchargeAmount
       : 0,
     paymentTotalAmount:
      typeof nextState.paymentTotalAmount === "number" && Number.isFinite(nextState.paymentTotalAmount)
       ? nextState.paymentTotalAmount
       : 0
    }
   },
   onRehydrateStorage: () => (state) => {
    state?.setHydrated(true)
   }
  }
 )
)
