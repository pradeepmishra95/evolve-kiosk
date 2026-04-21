import { useState } from "react"
import { useNavigate } from "@/navigation/useAppNavigation"
import Container from "../../layout/Container"
import Grid from "../../layout/Grid"
import ChoiceCard from "../../components/cards/ChoiceCard"
import { useUserStore } from "../../store/userStore"
import { colors, radius, spacing, typography } from "../../styles/GlobalStyles"
import { TRIAL_FEE, TRIAL_FEE_NOTE } from "../../utils/trialPricing"
import {
 CARD_AND_EMI_SURCHARGE_RATE,
 getPaymentSurchargeAmount,
 getPendingPaymentStatus,
 getRemainingPaymentAmount,
 isUpiPaymentMethod,
 PAYMENT_METHOD_OPTIONS
} from "../../utils/payment"

export default function PaymentScreen(){

 const navigate = useNavigate()
 const data = useUserStore()
 const [activeMethod, setActiveMethod] = useState("")
 const [paymentError, setPaymentError] = useState("")
 const isTrialBooking = data.purpose === "trial"
 const trialCreditApplied = data.cameFromTrial && data.purpose === "enroll"
 const bookingPrice = isTrialBooking ? TRIAL_FEE : (trialCreditApplied ? Math.max(0, data.price - TRIAL_FEE) : data.price)
 const baseAmount = isTrialBooking ? TRIAL_FEE : Math.max(0, bookingPrice - data.discountAmount)
 const isSecondCollectionStep = (data.isPartialPayment || data.isSplitPayment) && data.paymentCollectionStep === 2
 const availablePaymentMethods = PAYMENT_METHOD_OPTIONS.filter(
  (method) => !(isTrialBooking && (method.value === "emi" || method.value === "cheque"))
 )

 const buildMethodSubtitle = (method: (typeof PAYMENT_METHOD_OPTIONS)[number]) => {
  const subtitleParts = [method.subtitle]

  if (data.isPartialPayment) {
   if (isSecondCollectionStep) {
    // Step 2: surcharge on remaining due amount
    const surcharge = getPaymentSurchargeAmount(data.dueAmount, method.value)
    const collectNow = data.dueAmount + surcharge
    if (surcharge > 0) subtitleParts.push(`Surcharge +₹${surcharge.toLocaleString("en-IN")} on ₹${data.dueAmount.toLocaleString("en-IN")}`)
    subtitleParts.push(`Collect ₹${collectNow.toLocaleString("en-IN")}`)
   } else {
    // Step 1: surcharge only on partial amount
    const surcharge = getPaymentSurchargeAmount(data.paidAmount, method.value)
    const collectNow = data.paidAmount + surcharge
    const remaining = getRemainingPaymentAmount(baseAmount, data.paidAmount)
    if (surcharge > 0) subtitleParts.push(`Surcharge +₹${surcharge.toLocaleString("en-IN")} on ₹${data.paidAmount.toLocaleString("en-IN")}`)
    subtitleParts.push(`Collect ₹${collectNow.toLocaleString("en-IN")} now • ₹${remaining.toLocaleString("en-IN")} due later`)
   }
  } else if (data.isSplitPayment) {
   if (isSecondCollectionStep) {
    // Step 2: surcharge on due amount
    const surcharge = getPaymentSurchargeAmount(data.dueAmount, method.value)
    const collectNow = data.dueAmount + surcharge
    if (surcharge > 0) subtitleParts.push(`Surcharge +₹${surcharge.toLocaleString("en-IN")} on ₹${data.dueAmount.toLocaleString("en-IN")}`)
    subtitleParts.push(`Collect ₹${collectNow.toLocaleString("en-IN")}`)
   } else {
    // Step 1: surcharge locked from review (on paidAmount, for the locked method)
    const collectNow = data.paidAmount + data.paymentSurchargeAmount
    subtitleParts.push(`Collect ₹${collectNow.toLocaleString("en-IN")} now • ₹${data.dueAmount.toLocaleString("en-IN")} next step`)
   }
  } else {
   // Full payment: surcharge on full amount
   const surcharge = getPaymentSurchargeAmount(baseAmount, method.value)
   if (surcharge > 0) {
    subtitleParts.push(`Surcharge +₹${surcharge.toLocaleString("en-IN")}`)
    subtitleParts.push(`Total ₹${(baseAmount + surcharge).toLocaleString("en-IN")}`)
   }
  }

  return subtitleParts.join(" • ")
 }

 const selectPayment = (method: (typeof PAYMENT_METHOD_OPTIONS)[number]["value"]) => {
  if (activeMethod) {
   return
  }

  setActiveMethod(method)
  setPaymentError("")

  const paymentStatus = getPendingPaymentStatus(method)

  data.setData({
   paymentReference: "",
   paymentMethod: method,
   paymentStatus
  })

  navigate(isUpiPaymentMethod(method) ? "/payment/upi" : "/payment/cash")
  setActiveMethod("")
 }

 return(

  <Container scrollable>

   <div style={styles.wrapper}>
    <div style={styles.surface}>
     <div style={styles.header}>
      <div>
       <p style={styles.kicker}>Payment</p>
       <h2 style={styles.heading}>Choose payment method</h2>
      </div>
     </div>

     {isTrialBooking && (
      <div style={styles.noticeCard}>
       <p style={styles.noticeTitle}>Trial booking fee</p>
       <p style={styles.noticeText}>
        {TRIAL_FEE_NOTE}
       </p>
      </div>
     )}

     {paymentError && (
      <p style={styles.errorText}>
       {paymentError}
      </p>
     )}

     {data.isSplitPayment && (
      <div style={styles.noticeCard}>
       <p style={styles.noticeTitle}>{isSecondCollectionStep ? "Collect second portion" : "Split payment — Step 1"}</p>
       <p style={styles.noticeText}>
        {isSecondCollectionStep
         ? `Collect remaining ₹${data.dueAmount.toLocaleString("en-IN")}. Card/EMI adds ${(CARD_AND_EMI_SURCHARGE_RATE * 100).toFixed(0)}% surcharge on this amount.`
         : `Collect ₹${data.paidAmount.toLocaleString("en-IN")}${data.paymentSurchargeAmount > 0 ? ` + ₹${data.paymentSurchargeAmount.toLocaleString("en-IN")} surcharge` : ""} now. Remaining ₹${data.dueAmount.toLocaleString("en-IN")} collected next.`}
       </p>
      </div>
     )}

     {data.isPartialPayment && (
      <div style={styles.noticeCard}>
       <p style={styles.noticeTitle}>{isSecondCollectionStep ? "Collect remaining amount" : "Partial payment mode"}</p>
       <p style={styles.noticeText}>
        {isSecondCollectionStep
         ? `Collect remaining ₹${data.dueAmount.toLocaleString("en-IN")}. Card/EMI adds ${(CARD_AND_EMI_SURCHARGE_RATE * 100).toFixed(0)}% surcharge on this remaining amount only.`
         : `Collect ₹${data.paidAmount.toLocaleString("en-IN")} now (surcharge applies on this partial amount only, not the full plan). Remaining ₹${data.dueAmount.toLocaleString("en-IN")} due later${data.partialPaymentDueDate ? ` (${data.partialPaymentDueDate})` : ""}.`}
       </p>
      </div>
     )}

     <Grid>
      {availablePaymentMethods.map((method) => (
       <ChoiceCard
        key={method.value}
        title={method.title}
        subtitle={buildMethodSubtitle(method)}
        onClick={() => selectPayment(method.value)}
       />
      ))}
     </Grid>
    </div>

   </div>

  </Container>

 )

}

const styles = {
 wrapper: {
  width: "100%",
  maxWidth: "720px",
  minHeight: "100%",
  margin: "0 auto",
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "center",
  padding: "clamp(8px, 1.8vh, 18px) 0",
  boxSizing: "border-box" as const
 },
 surface: {
  padding: "clamp(18px, 2.4vh, 28px)",
  border: `1px solid ${colors.border}`,
  borderRadius: radius.lg,
  background: "linear-gradient(160deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))",
  boxShadow: "0 20px 60px rgba(0,0,0,0.22)"
 },
 header: {
  marginBottom: spacing.sm
 },
 kicker: {
  color: colors.primaryLight,
  letterSpacing: "0.18em",
  textTransform: "uppercase" as const,
  fontSize: "12px",
  fontWeight: 700,
  marginBottom: spacing.xs
 },
 heading: {
  ...typography.subtitle,
  fontSize: "clamp(28px, 3.4vh, 36px)",
  margin: 0
 },
 description: {
  color: colors.textSecondary,
  lineHeight: 1.65,
  marginBottom: spacing.lg
 },
 noticeCard: {
  marginBottom: spacing.lg,
  padding: "14px 16px",
  borderRadius: radius.md,
  border: `1px solid ${colors.borderStrong}`,
  background: "linear-gradient(135deg, rgba(200,169,108,0.12), rgba(106,166,154,0.08))"
 },
 noticeTitle: {
  color: colors.primaryLight,
  fontSize: "12px",
  fontWeight: 800,
  textTransform: "uppercase" as const,
  letterSpacing: "0.12em",
  marginBottom: "6px"
 },
 noticeText: {
  color: colors.textSecondary,
  lineHeight: 1.6,
  fontSize: "13px"
 },
 errorText: {
  textAlign: "center" as const,
  color: "#F1A596",
  marginBottom: spacing.lg
 }
}
