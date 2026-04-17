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
 getPaymentCollectionAmount,
 getPaymentTotalAmount,
 getPendingPaymentStatus,
 getRemainingPaymentAmount,
 getResolvedPaymentSurchargeAmount,
 isUpiPaymentMethod,
 PAYMENT_METHOD_OPTIONS
} from "../../utils/payment"

export default function PaymentScreen(){

 const navigate = useNavigate()
 const data = useUserStore()
 const [activeMethod, setActiveMethod] = useState("")
 const [paymentError, setPaymentError] = useState("")
 const isTrialBooking = data.purpose === "trial"
 const baseAmount = isTrialBooking ? TRIAL_FEE : data.price
 const isSecondCollectionStep = data.isPartialPayment && data.paymentCollectionStep === 2

 const buildMethodSubtitle = (method: (typeof PAYMENT_METHOD_OPTIONS)[number]) => {
  const surchargeAmount = getResolvedPaymentSurchargeAmount(
   baseAmount,
   method.value,
   data.paymentSurchargeAmount
  )
  const totalAmount = getPaymentTotalAmount(baseAmount, method.value, data.paymentSurchargeAmount)
  const collectNowAmount = getPaymentCollectionAmount({
   baseAmount,
   method: method.value,
   isPartialPayment: data.isPartialPayment,
   firstInstallmentAmount: data.paidAmount,
   paymentCollectionStep: data.paymentCollectionStep,
   lockedSurchargeAmount: data.paymentSurchargeAmount
  })
  const remainingAmount = data.isPartialPayment
   ? getRemainingPaymentAmount(baseAmount, data.paidAmount, method.value, data.paymentSurchargeAmount)
   : 0
  const subtitleParts = [method.subtitle]

  if (surchargeAmount > 0) {
   subtitleParts.push(
    `Surcharge +₹${surchargeAmount.toLocaleString("en-IN")} on full amount`
   )
  }

  if (data.isPartialPayment) {
   if (isSecondCollectionStep) {
    subtitleParts.push(`Collect now ₹${collectNowAmount.toLocaleString("en-IN")}`)
   } else {
    subtitleParts.push(
     `Collect now ₹${collectNowAmount.toLocaleString("en-IN")} • remaining ₹${remainingAmount.toLocaleString("en-IN")}`
    )
   }
  } else if (surchargeAmount > 0) {
   subtitleParts.push(`Total payable ₹${totalAmount.toLocaleString("en-IN")}`)
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

     {data.isPartialPayment && (
      <div style={styles.noticeCard}>
       <p style={styles.noticeTitle}>{isSecondCollectionStep ? "Collect remaining amount" : "Partial payment mode"}</p>
       <p style={styles.noticeText}>
        {isSecondCollectionStep
         ? data.paymentSurchargeAmount > 0
          ? `Now collect ₹${data.dueAmount.toLocaleString("en-IN")}. This already includes ₹${data.paymentSurchargeAmount.toLocaleString("en-IN")} card/EMI surcharge on the full plan amount.`
          : `Now collect the remaining ₹${data.dueAmount.toLocaleString("en-IN")}. Card and EMI methods add ${(CARD_AND_EMI_SURCHARGE_RATE * 100).toFixed(0)}% surcharge on the full plan amount.`
         : `Collect ₹${data.paidAmount.toLocaleString("en-IN")} now. Base remaining amount is ₹${data.dueAmount.toLocaleString("en-IN")}. Card and EMI methods add ${(CARD_AND_EMI_SURCHARGE_RATE * 100).toFixed(0)}% surcharge on the full plan amount.`}
       </p>
      </div>
     )}

     <Grid>
      {PAYMENT_METHOD_OPTIONS.map((method) => (
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
