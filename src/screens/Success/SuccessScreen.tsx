import { useNavigate } from "@/navigation/useAppNavigation"
import { doc, serverTimestamp, setDoc } from "firebase/firestore"
import { db } from "../../firebase/firebase"
import { useAuthStore } from "../../store/authStore"
import { useUserStore } from "../../store/userStore"

import Container from "../../layout/Container"
import PrimaryButton from "../../components/buttons/PrimaryButton"

import { spacing, typography } from "../../styles/GlobalStyles"
import { useCallback, useEffect, useRef, useState } from "react"
import { trackKioskSessionCompletion } from "../../services/kioskSessions"
import { getDurationDays } from "../../utils/duration"
import { createPaymentRecord } from "../../services/paymentRecords"
import { getPhoneDocumentId } from "../../utils/validation"
import { TRIAL_FEE } from "../../utils/trialPricing"
import { getPaymentMethodLabel, getSplitPaymentMethodLabel } from "../../utils/payment"
import { saveEnquirySubmission } from "../../services/enquirySubmission"

export default function SuccessScreen() {

 const navigate = useNavigate()

 const data = useUserStore()
 const staffUser = useAuthStore((state) => state.user)
 const paymentMethodLabel = data.isPartialPayment
  ? getSplitPaymentMethodLabel(data.paymentMethod1, data.paymentMethod2)
  : getPaymentMethodLabel(data.paymentMethod)
 const effectivePrice = data.purpose === "trial" ? TRIAL_FEE : data.price
 const finalPaymentAmount = data.paymentTotalAmount > 0 ? data.paymentTotalAmount : effectivePrice
 const addonTotalPrice = data.selectedAddOnIds.length
  ? Math.max(effectivePrice - (data.mainPlanPrice || 0), 0)
  : 0

 const [loading,setLoading] = useState(false)
 const hasAutoSubmittedRef = useRef(false)

 const handleFinish = useCallback(async () => {
  if (hasAutoSubmittedRef.current) {
   return
  }

  hasAutoSubmittedRef.current = true

  if (!data.phone) {
   console.error("Phone number missing")
   hasAutoSubmittedRef.current = false
   return
  }

  const phoneDocId = getPhoneDocumentId(data.phone, data.countryCode)
  const destination = data.purpose === "enquiry" ? "/enquiry-thank-you" : "/"

  try {
   setLoading(true)

   const staffMetadata = {
    staffName: staffUser?.name || "",
    staffUid: staffUser?.uid || "",
    staffEmail: staffUser?.email || "",
    staffSessionId: staffUser?.sessionId || ""
   }

   if (data.purpose === "enquiry") {
    await saveEnquirySubmission({
     name: data.name,
     phone: data.phone,
     countryCode: data.countryCode,
     dateOfBirth: data.dateOfBirth,
     lookingFor: data.lookingFor,
     referenceSource: data.referenceSource,
     age: data.age,
     gender: data.gender,
     primaryGoal: data.primaryGoal,
     enquiryMessage: data.enquiryMessage,
     experience: data.experience,
     priorExerciseExperience: data.priorExerciseExperience,
     priorExerciseActivity: data.priorExerciseActivity,
     priorExerciseDuration: data.priorExerciseDuration,
     lastExerciseTime: data.lastExerciseTime,
     injury: data.injury,
     injuryDetails: data.injuryDetails,
     exerciseType: data.exerciseType,
     program: data.program,
     days: data.days,
     duration: data.duration,
     batchType: data.batchType,
     batchTime: data.batchTime,
     batchDate: data.batchDate,
     followUpDate: data.followUpDate,
     followUpTime: data.followUpTime,
     price: data.price,
     staffUser
    })

    return
   }

   const today = new Date()
   const daysToAdd = getDurationDays(data.duration)
   const expiryDate = new Date()
   expiryDate.setDate(today.getDate() + daysToAdd)
   const cameFromEnquiry = data.status === "enquiry"
   const paymentReference =
    data.paymentMethod && data.paymentStatus === "paid"
     ? await createPaymentRecord({
        name: data.name,
        phone: data.phone,
        countryCode: data.countryCode,
        lookingFor: data.lookingFor,
        referenceSource: data.referenceSource,
        program: data.program,
        duration: data.duration,
        amount: finalPaymentAmount,
        mainPlanPrice: data.mainPlanPrice || 0,
        selectedAddOnIds: data.selectedAddOnIds,
        addonTotalPrice,
        batchType: data.batchType,
        batchTime: data.batchTime,
        batchDate: data.batchDate,
        followUp:
         data.followUpDate || data.followUpTime
          ? {
           date: data.followUpDate,
           time: data.followUpTime
          }
          : null,
        purpose: data.purpose,
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentStatus,
        isPartialPayment: data.isPartialPayment,
        isSplitPayment: data.isSplitPayment,
        paidAmount: (data.isPartialPayment || data.isSplitPayment) ? data.paidAmount : undefined,
        dueAmount: (data.isPartialPayment || data.isSplitPayment) ? data.dueAmount : undefined,
        partialPaymentDueDate: data.isPartialPayment ? data.partialPaymentDueDate : undefined,
        paymentMethod1: (data.isPartialPayment || data.isSplitPayment) ? data.paymentMethod1 : undefined,
        paymentMethod2: (data.isPartialPayment || data.isSplitPayment) ? data.paymentMethod2 : undefined,
        paymentSurchargeAmount: data.paymentSurchargeAmount || undefined,
        paymentTotalAmount: finalPaymentAmount,
        consentRequestId: data.consentRequestId,
        consentRecordId: data.consentRecordId,
        consentSigningStatus: data.consentSigningStatus,
        consentSignerType: data.consentSignerType,
        consentGuardianName: data.consentGuardianName,
        consentGuardianPhone: data.consentGuardianPhone,
        consentGuardianRelationship: data.consentGuardianRelationship,
        consentTermsVersion: data.consentTermsVersion,
        consentDocumentVersion: data.consentDocumentVersion,
        consentDocumentHash: data.consentDocumentHash,
        consentProviderName: data.consentProviderName,
        consentProviderRequestId: data.consentProviderRequestId,
        consentProviderTransactionId: data.consentProviderTransactionId,
        consentAgreedAt: data.consentAgreedAt,
        consentUnsignedPdfUrl: data.consentUnsignedPdfUrl,
        consentSignedPdfUrl: data.consentSignedPdfUrl,
        consentAuditTrailUrl: data.consentAuditTrailUrl,
        ...staffMetadata,
        confirmedAt: serverTimestamp()
       })
     : data.paymentReference

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
       ? {
        date: data.followUpDate,
        time: data.followUpTime
       }
       : null,
     price: effectivePrice,
     mainPlanPrice: data.mainPlanPrice || 0,
     selectedAddOnIds: data.selectedAddOnIds,
     addonTotalPrice,
     ...staffMetadata,
     paymentReference,
     paymentMethod: data.paymentMethod,
     paymentStatus: data.paymentStatus,
     isPartialPayment: data.isPartialPayment,
     isSplitPayment: data.isSplitPayment,
     paidAmount: (data.isPartialPayment || data.isSplitPayment) ? data.paidAmount : undefined,
     dueAmount: (data.isPartialPayment || data.isSplitPayment) ? data.dueAmount : undefined,
     partialPaymentDueDate: data.isPartialPayment ? data.partialPaymentDueDate : undefined,
     paymentMethod1: (data.isPartialPayment || data.isSplitPayment) ? data.paymentMethod1 : undefined,
     paymentMethod2: (data.isPartialPayment || data.isSplitPayment) ? data.paymentMethod2 : undefined,
     paymentSurchargeAmount: data.paymentSurchargeAmount || undefined,
     paymentTotalAmount: finalPaymentAmount,
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
      ? {
         enquiryStatus: data.purpose === "trial" ? "trial_booked" : "converted"
        }
      : {}),
     createdAt: serverTimestamp(),
     updatedAt: serverTimestamp(),
     expiryDate
    },
    { merge: true }
   )

   void trackKioskSessionCompletion(staffMetadata.staffSessionId, {
    purpose: data.purpose,
    program: data.program
   }).catch((error) => {
    console.error("Kiosk session tracking error:", error)
   })

} catch (error) {
   console.error("Error saving user:", error)
  } finally {
   setLoading(false)
   navigate(destination, { replace: true })
   data.reset()
  }
 }, [addonTotalPrice, data, effectivePrice, finalPaymentAmount, navigate, staffUser])

 useEffect(() => {
  if (hasAutoSubmittedRef.current) {
   return
  }

  const timer = window.setTimeout(() => {
   void handleFinish()
  }, 2500)

  return () => window.clearTimeout(timer)
 }, [handleFinish])

  return(

  <Container scrollable>

   <div
    style={{
     textAlign:"center",
     maxWidth:"500px",
     margin:"auto"
    }}
   >

    <h2
     style={{
      fontSize: typography.subtitle.fontSize,
      marginBottom: spacing.lg
     }}
    >
     {data.purpose === "enquiry"
      ? "Thanks for Enquiring"
      : data.purpose === "trial"
       ? "Trial Booking Confirmed"
       : data.purpose === "renew"
        ? "Membership Renewal Confirmed"
       : `${paymentMethodLabel} Payment Confirmed`}
    </h2>

    <p style={{marginBottom:spacing.lg}}>
     {data.purpose === "enquiry"
      ? "Thank you for your enquiry. Our team will get in touch with you soon."
      : data.purpose === "trial"
       ? `Your trial has been successfully booked through ${paymentMethodLabel}.`
       : data.purpose === "renew"
        ? `Your membership has been successfully renewed through ${paymentMethodLabel}.`
       : `Your membership has been successfully activated through ${paymentMethodLabel}.`}
    </p>

    <PrimaryButton
     title={loading ? "Saving..." : data.purpose === "enquiry" ? "Finish Enquiry" : "Finish"}
     onClick={handleFinish}
     disabled={loading}
    />

   </div>

  </Container>

 )
}
