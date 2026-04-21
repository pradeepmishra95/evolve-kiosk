import { useNavigate } from "@/navigation/useAppNavigation"
import { serverTimestamp } from "firebase/firestore"
import { useAuthStore } from "../../store/authStore"
import { useUserStore } from "../../store/userStore"

import Container from "../../layout/Container"
import PrimaryButton from "../../components/buttons/PrimaryButton"

import { spacing, typography } from "../../styles/GlobalStyles"
import { useCallback, useEffect, useRef, useState } from "react"
import { trackKioskSessionCompletion } from "../../services/kioskSessions"
import { getDurationDays } from "../../utils/duration"
import { createPaymentRecord } from "../../services/paymentRecords"
import { TRIAL_FEE } from "../../utils/trialPricing"
import { getPaymentMethodLabel, getSplitPaymentMethodLabel } from "../../utils/payment"
import { saveEnquirySubmission } from "../../services/enquirySubmission"
import { saveMemberSubmission } from "../../services/memberSubmission"

export default function SuccessScreen() {

 const navigate = useNavigate()

 const data = useUserStore()
 const staffUser = useAuthStore((state) => state.user)
 const paymentMethodLabel = data.isPartialPayment
  ? getSplitPaymentMethodLabel(data.paymentMethod1, data.paymentMethod2)
  : getPaymentMethodLabel(data.paymentMethod)
 const trialCreditApplied = data.cameFromTrial && data.purpose === "enroll"
 const bookingPrice = data.purpose === "trial" ? TRIAL_FEE : (trialCreditApplied ? Math.max(0, data.price - TRIAL_FEE) : data.price)
 const discountAmount = data.purpose === "trial" ? 0 : data.discountAmount
 const finalPayable = data.purpose === "trial" ? TRIAL_FEE : Math.max(0, bookingPrice - discountAmount)
 const finalPaymentAmount = data.paymentTotalAmount > 0 ? data.paymentTotalAmount : finalPayable
 const addonTotalPrice = data.selectedAddOnIds.length
  ? Math.max(data.price - (data.mainPlanPrice || 0), 0)
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
    console.debug("[SuccessScreen] Saving enquiry submission")
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
     price: finalPayable,
     discountAmount: discountAmount || undefined,
     staffUser
    })

    navigate(destination, { replace: true })
    data.reset()
    return
   }

   const today = new Date()
   const daysToAdd = getDurationDays(data.duration)
   const expiryDate = new Date()
   expiryDate.setDate(today.getDate() + daysToAdd)

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
        discountAmount: discountAmount || undefined,
        mainPlanPrice: data.mainPlanPrice || 0,
        selectedAddOnIds: data.selectedAddOnIds,
        addonTotalPrice,
        batchType: data.batchType,
        batchTime: data.batchTime,
        batchDate: data.batchDate,
        followUp:
         data.followUpDate || data.followUpTime
          ? { date: data.followUpDate, time: data.followUpTime }
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

   console.debug("[SuccessScreen] Saving full user document to Firestore")
   await saveMemberSubmission({
    state: data,
    staffUser,
    paymentReference,
    effectivePrice: finalPayable,
    discountAmount: discountAmount || undefined,
    finalPaymentAmount,
    addonTotalPrice,
    expiryDate
   })

   void trackKioskSessionCompletion(staffMetadata.staffSessionId, {
    purpose: data.purpose,
    program: data.program
   }).catch((error) => {
    console.error("Kiosk session tracking error:", error)
   })

   navigate(destination, { replace: true })
   data.reset()

  } catch (error) {
   console.error("[SuccessScreen] Failed to save user document — staying on screen:", error)
   hasAutoSubmittedRef.current = false
  } finally {
   setLoading(false)
  }
 }, [addonTotalPrice, data, discountAmount, finalPayable, finalPaymentAmount, navigate, staffUser])

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
