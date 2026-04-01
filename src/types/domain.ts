export type UserStatus = "new" | "enquiry" | "trial" | "member" | ""

export type UserPurpose = "trial" | "enroll" | "enquiry" | ""

export type UserGender = "male" | "female" | "other" | ""

export type PaymentMethod = "cash" | "upi" | ""

export type PaymentStatus = "free" | "cash_pending" | "upi_pending" | "paid" | "cancelled" | ""

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
}

export interface ProgramPlan {
 id: number
 name: string
 days?: string
 pricing?: PlanPricing[]
 type?: "personal"
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
 program: string
 duration: MembershipDuration
 amount: number
 batchType: string
 batchTime: string
 paymentMethod: PaymentMethod
 paymentStatus: PaymentStatus
 purpose: UserPurpose
 createdAt: string
 confirmedAt: string
}
