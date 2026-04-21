import { doc, serverTimestamp, setDoc } from "firebase/firestore"
import { db } from "../firebase/firebase"
import type { UserState } from "../store/userStore"
import type { StaffSessionUser } from "../store/authStore"
import { getPhoneDocumentId } from "../utils/validation"

export interface MemberSubmissionInput {
 state: UserState
 staffUser: StaffSessionUser | null
 paymentReference: string | undefined
 effectivePrice: number
 discountAmount?: number
 finalPaymentAmount: number
 addonTotalPrice: number
 expiryDate: Date
}

/**
 * Writes the full member document to Firestore for enroll, trial, and renewal journeys.
 * Enquiry journeys use saveEnquirySubmission instead.
 */
export const saveMemberSubmission = async (input: MemberSubmissionInput): Promise<void> => {
 const { state: data, staffUser } = input
 const phoneDocId = getPhoneDocumentId(data.phone, data.countryCode)
 const cameFromEnquiry = data.status === "enquiry"

 await setDoc(
  doc(db, "users", phoneDocId),
  {
   name: data.name,
   phone: data.phone,
   countryCode: data.countryCode,
   dateOfBirth: data.dateOfBirth,
   lookingFor: data.lookingFor,
   referenceSource: data.referenceSource,
   age: data.age,
   gender: data.gender,
   purpose: data.purpose,
   experience: data.experience,
   priorExerciseExperience: data.priorExerciseExperience,
   priorExerciseActivity: data.priorExerciseActivity,
   priorExerciseDuration: data.priorExerciseDuration,
   lastExerciseTime: data.lastExerciseTime,
   injury: data.injury,
   injuryDetails: data.injury ? data.injuryDetails : "",
   exerciseType: data.exerciseType,
   program: data.program,
   days: data.days,
   plan: data.plan,
   duration: data.duration,
   batchType: data.batchType,
   batchTime: data.batchTime,
   batchDate: data.batchDate,
   followUp:
    data.followUpDate || data.followUpTime
     ? { date: data.followUpDate, time: data.followUpTime }
     : null,
   price: input.effectivePrice,
   discountAmount: input.discountAmount || undefined,
   mainPlanPrice: data.mainPlanPrice || 0,
   selectedAddOnIds: data.selectedAddOnIds,
   addonTotalPrice: input.addonTotalPrice,
   staffName: staffUser?.name || "",
   staffUid: staffUser?.uid || "",
   staffEmail: staffUser?.email || "",
   staffSessionId: staffUser?.sessionId || "",
   paymentReference: input.paymentReference,
   paymentMethod: data.paymentMethod,
   paymentStatus: data.paymentStatus,
   isPartialPayment: data.isPartialPayment,
   isSplitPayment: data.isSplitPayment,
   paidAmount: data.isPartialPayment || data.isSplitPayment ? data.paidAmount : undefined,
   dueAmount: data.isPartialPayment || data.isSplitPayment ? data.dueAmount : undefined,
   partialPaymentDueDate: data.isPartialPayment ? data.partialPaymentDueDate : undefined,
   paymentMethod1: data.isPartialPayment || data.isSplitPayment ? data.paymentMethod1 : undefined,
   paymentMethod2: data.isPartialPayment || data.isSplitPayment ? data.paymentMethod2 : undefined,
   paymentSurchargeAmount: data.paymentSurchargeAmount || undefined,
   paymentTotalAmount: input.finalPaymentAmount,
   consentRequestId: data.consentRequestId,
   consentRecordId: data.consentRecordId,
   consentSigningStatus: data.consentSigningStatus,
   consentSignerType: data.consentSignerType,
   consentGuardianName: data.consentGuardianName,
   consentGuardianPhone: data.consentGuardianPhone,
   consentGuardianRelationship: data.consentGuardianRelationship,
   consentTermsVersion: data.consentTermsVersion,
   consentDocumentVersion: data.consentDocumentVersion,
   consentAgreed: data.consentAgreed,
   consentAgreedAt: data.consentAgreedAt,
   consentProviderName: data.consentProviderName,
   consentProviderRequestId: data.consentProviderRequestId,
   consentProviderTransactionId: data.consentProviderTransactionId,
   consentDocumentHash: data.consentDocumentHash,
   consentUnsignedPdfUrl: data.consentUnsignedPdfUrl,
   consentSignedPdfUrl: data.consentSignedPdfUrl,
   consentAuditTrailUrl: data.consentAuditTrailUrl,
   consentUnsignedPdfStoragePath: data.consentUnsignedPdfStoragePath,
   consentSignedPdfStoragePath: data.consentSignedPdfStoragePath,
   consentAuditTrailStoragePath: data.consentAuditTrailStoragePath,
   consentSupplementarySignatureDataUrl: data.consentSupplementarySignatureDataUrl,
   consentSupplementarySignatureUrl: data.consentSupplementarySignatureUrl,
   consentSupplementarySignatureStoragePath: data.consentSupplementarySignatureStoragePath,
   consentSupplementarySignatureHash: data.consentSupplementarySignatureHash,
   status: data.purpose === "trial" ? "trial" : "member",
   ...(cameFromEnquiry
    ? { enquiryStatus: data.purpose === "trial" ? "trial_booked" : "converted" }
    : {}),
   createdAt: serverTimestamp(),
   updatedAt: serverTimestamp(),
   expiryDate: input.expiryDate
  },
  { merge: true }
 )
}
