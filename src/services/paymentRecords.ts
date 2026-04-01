import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore"
import { db } from "../firebase/firebase"
import type { MembershipDuration, PaymentMethod, PaymentStatus, UserPurpose } from "../types/domain"

interface PaymentRecordPayload {
 name: string
 phone: string
 program: string
 duration: MembershipDuration
 amount: number
 batchType: string
 batchTime: string
 purpose: UserPurpose
 paymentMethod: PaymentMethod
 paymentStatus: PaymentStatus
}

export async function createPaymentRecord(payload: PaymentRecordPayload) {
 const paymentDoc = await addDoc(collection(db, "payments"), {
  ...payload,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  confirmedAt: null
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
