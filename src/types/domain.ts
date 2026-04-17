import type { ConsentSigningStatus } from "../consent/consentTypes"

export type UserStatus = "new" | "enquiry" | "trial" | "member" | ""

export type UserPurpose = "trial" | "enroll" | "renew" | "enquiry" | ""

export type UserGender = "male" | "female" | "other" | ""

export type PaymentMethod = "cash" | "credit_card" | "debit_card" | "upi" | "emi" | "cheque" | ""

export type PaymentStatus =
 | "free"
 | "cash_pending"
 | "payment_pending"
 | "upi_pending"
 | "paid"
 | "partial"
 | "cancelled"
 | ""

export type ProfilePhotoSource = "camera" | "gallery" | ""

export type EnquirySource = "kiosk" | "website" | "instagram" | "walk_in" | "other"

export type EnquiryStatus =
 | "new"
 | "contacted"
 | "trial_booked"
 | "ready_for_enrollment"
 | "converted"

export type MembershipDuration =
 | "1 Day"
 | "1 Session"
 | "Free Trial"
 | "Monthly"
 | "Quarterly"
 | "Half Yearly"
 | "Yearly"
 | `${number} Sessions`
 | ""

export interface PlanPricing {
 duration: MembershipDuration
 price: number
 originalPrice?: number
}

export interface PriceBreakdownLine {
 label: string
 amount: number
}

export interface ProgramPlan {
 id: string
 name: string
 days?: string
 scheduleDays?: string[]
 timings?: string[]
 pricing?: PlanPricing[]
 type?: "personal"
 audience?: "adult" | "kids"
 experienceLevels?: string[]
 order?: number
 program?: string
 tags?: string[]
 active?: boolean
}

export interface PersonalTrainingCoach {
 coach: string
 perSession: number
 packageSessions: number
 packagePrice: number
}

export interface MemberRecord {
 id: string
 name: string
 phone: string
 dateOfBirth?: string
 referenceSource?: string
 age: number
 program: string
 duration: MembershipDuration
 batch: string
 time: string
 price: number
}

export interface EnquiryRecord {
 id: string
 name: string
 phone: string
 primaryGoal: string
 message: string
 status: EnquiryStatus
 source: EnquirySource
 createdAt: string
}

export interface PaymentRecord {
 id: string
 name: string
 phone: string
 countryCode?: string
 lookingFor?: string
 referenceSource?: string
 program: string
 duration: MembershipDuration
 amount: number
 mainPlanPrice?: number
 selectedAddOnIds?: string[]
 addonTotalPrice?: number
 batchType: string
 batchTime: string
 batchDate?: string
 paymentMethod: PaymentMethod
 paymentStatus: PaymentStatus
 isPartialPayment?: boolean
 paidAmount?: number
 dueAmount?: number
 paymentMethod1?: PaymentMethod
 paymentMethod2?: PaymentMethod
 paymentSurchargeAmount?: number
 paymentTotalAmount?: number
 purpose: UserPurpose
 staffName?: string
 staffUid?: string
 staffEmail?: string
 staffSessionId?: string
 consentRequestId?: string
 consentRecordId?: string
 consentSigningStatus?: ConsentSigningStatus | ""
 consentSignerType?: "member" | "guardian" | ""
 consentGuardianName?: string
 consentGuardianPhone?: string
 consentGuardianRelationship?: string
 consentTermsVersion?: string
 consentDocumentVersion?: string
 consentDocumentHash?: string
 consentProviderName?: string
 consentProviderRequestId?: string
 consentProviderTransactionId?: string
 consentAgreedAt?: string
 consentUnsignedPdfUrl?: string
 consentSignedPdfUrl?: string
 consentAuditTrailUrl?: string
 createdAt: string
 confirmedAt: string
}
