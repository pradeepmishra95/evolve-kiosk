import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore"
import { db } from "../firebase/firebase"
import type {
 MembershipDuration,
 PaymentMethod,
 PaymentStatus,
 UserPurpose
} from "../types/domain"

interface PaymentRecordPayload {
 name: string
 phone: string
 countryCode?: string
 lookingFor?: string
 referenceSource?: string
 followUp?: {
  date?: string
  time?: string
 } | null
 program: string
 duration: MembershipDuration
 amount: number
 mainPlanPrice?: number
 selectedAddOnIds?: string[]
 addonTotalPrice?: number
 batchType: string
 batchTime: string
 batchDate: string
 purpose: UserPurpose
 paymentMethod: PaymentMethod
 paymentStatus: PaymentStatus
 isPartialPayment?: boolean
 isSplitPayment?: boolean
 paidAmount?: number
 dueAmount?: number
 partialPaymentDueDate?: string
 paymentMethod1?: PaymentMethod
 paymentMethod2?: PaymentMethod
 paymentSurchargeAmount?: number
 paymentTotalAmount?: number
 staffName: string
 staffUid: string
 staffEmail: string
 staffSessionId: string
 consentRequestId?: string
 consentRecordId?: string
 consentSigningStatus?: string
 consentSignerType?: string
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
 confirmedAt?: ReturnType<typeof serverTimestamp> | null
}

export async function createPaymentRecord(payload: PaymentRecordPayload) {
 const paymentDoc = await addDoc(collection(db, "payments"), {
  ...payload,
   createdAt: serverTimestamp(),
   updatedAt: serverTimestamp(),
   confirmedAt: payload.confirmedAt ?? null
 })

 return paymentDoc.id
}

export async function updatePaymentRecord(
 paymentReference: string,
 updates: Partial<PaymentRecordPayload> & { confirmedAt?: ReturnType<typeof serverTimestamp> | null }
) {
 if (!paymentReference) {
  return
 }

 await updateDoc(doc(db, "payments", paymentReference), {
  ...updates,
  updatedAt: serverTimestamp()
 })
}
