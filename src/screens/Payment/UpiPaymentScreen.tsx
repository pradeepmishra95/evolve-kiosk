import { useNavigate } from "@/navigation/useAppNavigation"
import Container from "../../layout/Container"
import PrimaryButton from "../../components/buttons/PrimaryButton"
import { useUserStore } from "../../store/userStore"
import { colors, radius, spacing, typography } from "../../styles/GlobalStyles"
import { TRIAL_FEE, TRIAL_FEE_NOTE } from "../../utils/trialPricing"
import {
 getPaymentCollectionAmount,
 getPaymentMethodLabel,
 getPaymentMethodOption,
 getPaymentTotalAmount,
 getRemainingPaymentAmount,
 getResolvedPaymentSurchargeAmount
} from "../../utils/payment"

const formatPrice = (price: number) => `Rs. ${price.toLocaleString("en-IN")}`

export default function UpiPaymentScreen() {
 const navigate = useNavigate()
 const {
  program,
  duration,
  batchType,
  batchTime,
  price,
  purpose,
  isPartialPayment,
  paidAmount,
  dueAmount,
  paymentCollectionStep,
  paymentMethod1,
  paymentSurchargeAmount,
  setData
 } = useUserStore()
 const selectedMethod = "upi"
 const isTrialBooking = purpose === "trial"
 const baseAmount = isTrialBooking ? TRIAL_FEE : price
 const isSecondCollectionStep = isPartialPayment && paymentCollectionStep === 2
 const payableAmount = getPaymentCollectionAmount({
  baseAmount,
  method: selectedMethod,
  isPartialPayment,
  firstInstallmentAmount: paidAmount,
  paymentCollectionStep,
  lockedSurchargeAmount: paymentSurchargeAmount
 })
 const resolvedSurchargeAmount = getResolvedPaymentSurchargeAmount(
  baseAmount,
  selectedMethod,
  paymentSurchargeAmount
 )
 const totalPayableAmount = getPaymentTotalAmount(baseAmount, selectedMethod, paymentSurchargeAmount)
 const paymentMethodOption = getPaymentMethodOption(selectedMethod)
 const paymentLabel = getPaymentMethodLabel(selectedMethod)
 const screenTitle = paymentMethodOption?.detailTitle || "UPI Collection"
 const actionLabel = paymentMethodOption?.detailActionLabel || "Collect UPI"
 const paymentHint =
  paymentMethodOption?.detailHint || "Confirm the UPI payment has been completed before finishing."

 const handleFinish = async () => {
  if (isPartialPayment && paymentCollectionStep === 1) {
   const nextDueAmount = getRemainingPaymentAmount(
    baseAmount,
    paidAmount,
    selectedMethod,
    paymentSurchargeAmount
   )

   setData({
    paymentMethod: selectedMethod,
    paymentMethod1: selectedMethod,
    paymentMethod2: "",
    paymentStatus: "partial",
    paymentCollectionStep: 2,
    paymentSurchargeAmount: resolvedSurchargeAmount,
    paymentTotalAmount: totalPayableAmount,
    dueAmount: nextDueAmount
   })

   await Promise.resolve()
   navigate("/payment", { replace: true })
   return
  }

  setData({
   paymentMethod: selectedMethod,
   paymentMethod1: isPartialPayment ? paymentMethod1 || selectedMethod : selectedMethod,
   paymentMethod2: isPartialPayment ? selectedMethod : "",
   paymentStatus: "paid",
   dueAmount: isPartialPayment ? payableAmount : 0,
   paymentSurchargeAmount: resolvedSurchargeAmount,
   paymentTotalAmount: totalPayableAmount
  })

  await Promise.resolve()
  navigate("/consent", { replace: true })
 }

 return (
  <Container scrollable>
   <div style={styles.wrapper}>
    <h2 style={styles.heading}>{screenTitle}</h2>

    <div style={styles.amountCard}>
     <span style={styles.amountLabel}>{actionLabel}</span>
     <strong style={styles.amount}>{formatPrice(payableAmount)}</strong>
     {isPartialPayment && (
      <span style={styles.partialMeta}>
       {isSecondCollectionStep ? "Final collection" : `Base remaining: ${formatPrice(dueAmount)}`}
      </span>
     )}
    </div>

    {isTrialBooking && (
     <div style={styles.noticeCard}>
      <p style={styles.noticeTitle}>Trial booking fee: ₹{TRIAL_FEE}</p>
      <p style={styles.noticeText}>{TRIAL_FEE_NOTE}</p>
     </div>
    )}

    {isPartialPayment && (
     <div style={styles.noticeCard}>
      <p style={styles.noticeTitle}>{isSecondCollectionStep ? "Final collection" : "First collection"}</p>
      <p style={styles.noticeText}>
       {isSecondCollectionStep
        ? `Collect the remaining ₹${dueAmount.toLocaleString("en-IN")} now.`
        : `After this ₹${paidAmount.toLocaleString("en-IN")} collection, the remaining amount will be ₹${getRemainingPaymentAmount(baseAmount, paidAmount, selectedMethod, paymentSurchargeAmount).toLocaleString("en-IN")}.`}
      </p>
     </div>
    )}

    {resolvedSurchargeAmount > 0 && (
     <div style={styles.noticeCard}>
      <p style={styles.noticeTitle}>Surcharge Applied</p>
      <p style={styles.noticeText}>
       ₹{resolvedSurchargeAmount.toLocaleString("en-IN")} has already been added on the full plan amount. Total payable is ₹{totalPayableAmount.toLocaleString("en-IN")}.
      </p>
     </div>
    )}

    <div style={styles.summaryCard}>
     <h3 style={styles.summaryHeading}>Booking Snapshot</h3>
     <div style={styles.summaryRows}>
      <p><b>Program:</b> {program}</p>
      <p><b>Duration:</b> {duration}</p>
      <p><b>Payment Method:</b> {paymentLabel}</p>
      <p><b>Batch:</b> {batchType || "-"} {batchTime ? `| ${batchTime}` : ""}</p>
     </div>
    </div>

    <div style={styles.sessionCard}>
     <p style={styles.sessionText}>{paymentHint}</p>
     <div style={styles.sessionActions}>
      <PrimaryButton
       title="Finish"
       onClick={() => {
        void handleFinish()
       }}
      />
     </div>
    </div>
   </div>
  </Container>
 )
}

const styles = {
 wrapper: {
  maxWidth: "560px",
  margin: "0 auto",
  textAlign: "center" as const
 },

 heading: {
  ...typography.subtitle,
  marginBottom: spacing.md
 },

 description: {
  color: colors.textSecondary,
  lineHeight: 1.7,
  marginBottom: spacing.lg
 },

 amountCard: {
  padding: spacing.xl,
  borderRadius: radius.lg,
  border: `1px solid ${colors.border}`,
  background: "linear-gradient(145deg, rgba(200,169,108,0.12), rgba(255,255,255,0.03))",
  display: "flex",
  flexDirection: "column" as const,
  gap: spacing.xs
 },

 noticeCard: {
  marginTop: spacing.lg,
  width: "100%",
  padding: "14px 16px",
  borderRadius: radius.md,
  border: `1px solid ${colors.border}`,
  background: "rgba(200,169,108,0.08)",
  textAlign: "left" as const
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

 amountLabel: {
  color: colors.textMuted,
  fontSize: "13px",
  letterSpacing: "0.14em",
  textTransform: "uppercase" as const
 },

 amount: {
  color: colors.primaryLight,
  fontSize: "36px",
  fontWeight: 800
 },

 partialMeta: {
  fontSize: "13px",
  color: colors.primaryLight,
  fontWeight: 700
 },

 summaryCard: {
  marginTop: spacing.lg,
  padding: spacing.lg,
  borderRadius: radius.lg,
  border: `1px solid ${colors.border}`,
  background: "rgba(255,255,255,0.03)",
  textAlign: "left" as const
 },

 summaryHeading: {
  ...typography.subtitle,
  fontSize: "26px",
  marginBottom: spacing.md
 },

 summaryRows: {
  display: "flex",
  flexDirection: "column" as const,
  gap: spacing.sm,
  color: colors.textPrimary,
  lineHeight: 1.6
 },

 sessionCard: {
  marginTop: spacing.lg,
  padding: spacing.lg,
  borderRadius: radius.lg,
  border: `1px solid ${colors.border}`,
  background: "rgba(106,166,154,0.12)"
 },

 sessionText: {
  color: colors.textPrimary,
  lineHeight: 1.6,
  marginBottom: spacing.md
 },

 sessionActions: {
  display: "flex",
  gap: spacing.md,
  justifyContent: "center",
  alignItems: "center",
  flexWrap: "wrap" as const
 },

 actions: {
  display: "flex",
  gap: spacing.md,
  justifyContent: "center",
  alignItems: "center",
  flexWrap: "wrap" as const
 }
}
