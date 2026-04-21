import { useNavigate } from "@/navigation/useAppNavigation"
import Container from "../../layout/Container"
import PrimaryButton from "../../components/buttons/PrimaryButton"
import ConsentContent from "../../components/consent/ConsentContent"
import { useUserStore } from "../../store/userStore"
import { colors, radius, spacing, typography } from "../../styles/GlobalStyles"
import { TRIAL_FEE, TRIAL_FEE_NOTE } from "../../utils/trialPricing"
import {
 getPaymentCollectionAmount,
 getPaymentMethodLabel,
 getPaymentMethodOption,
 getPaymentSurchargeAmount,
 getRemainingPaymentAmount
} from "../../utils/payment"

const formatPrice = (price: number) => `Rs. ${price.toLocaleString("en-IN")}`

export default function CashPaymentScreen() {
 const navigate = useNavigate()
 const {
  program,
  duration,
  batchType,
  batchTime,
  price,
  purpose,
  cameFromTrial,
  discountAmount,
  paymentMethod,
  isPartialPayment,
  isSplitPayment,
  paidAmount,
  dueAmount,
  paymentCollectionStep,
  paymentMethod1,
  paymentStatus,
  paymentSurchargeAmount,
  consentAgreed,
  setData
 } = useUserStore()
 const isTrialBooking = purpose === "trial"
 const trialCreditApplied = cameFromTrial && purpose === "enroll"
 const bookingPrice = isTrialBooking ? TRIAL_FEE : (trialCreditApplied ? Math.max(0, price - TRIAL_FEE) : price)
 const baseAmount = isTrialBooking ? TRIAL_FEE : Math.max(0, bookingPrice - discountAmount)
 const selectedMethod = paymentMethod || "cash"
 const isStagedPayment = isPartialPayment || isSplitPayment
 const isSecondCollectionStep = isStagedPayment && paymentCollectionStep === 2
 const payableAmount = getPaymentCollectionAmount({
  baseAmount,
  method: selectedMethod,
  isPartialPayment,
  isSplitPayment,
  firstInstallmentAmount: paidAmount,
  dueAmount,
  paymentCollectionStep,
  lockedSurchargeAmount: paymentSurchargeAmount
 })
 // Surcharge on the amount being collected right now (not on full plan)
 const resolvedSurchargeAmount = isStagedPayment
  ? isSecondCollectionStep
   ? getPaymentSurchargeAmount(dueAmount, selectedMethod)
   : isPartialPayment
    ? getPaymentSurchargeAmount(paidAmount, selectedMethod)
    : paymentSurchargeAmount
  : getPaymentSurchargeAmount(baseAmount, selectedMethod)
 const totalPayableAmount = payableAmount
 const paymentMethodOption = getPaymentMethodOption(selectedMethod)
 const paymentLabel = getPaymentMethodLabel(selectedMethod)
 const screenTitle = paymentMethodOption?.detailTitle || "Payment Collection"
 const actionLabel = paymentMethodOption?.detailActionLabel || "Collect Payment"
 const paymentHint =
  paymentMethodOption?.detailHint || "Confirm the payment has been completed before finishing."
 const shouldShowInlineConsent = paymentStatus === "paid" && !consentAgreed

 const handleFinish = async () => {
  if (isSplitPayment && paymentCollectionStep === 1) {
   setData({
    paymentMethod: selectedMethod,
    paymentMethod1: selectedMethod,
    paymentMethod2: "",
    paymentStatus: "partial",
    paymentCollectionStep: 2
   })

   await Promise.resolve()
   navigate("/payment", { replace: true })
   return
  }

  if (isPartialPayment && paymentCollectionStep === 1) {
   // Store surcharge on partial amount only; remaining = base plan - partial (no pre-surcharge)
   setData({
    paymentMethod: selectedMethod,
    paymentMethod1: selectedMethod,
    paymentMethod2: "",
    paymentStatus: "partial",
    paymentCollectionStep: 2,
    paymentSurchargeAmount: resolvedSurchargeAmount,
    paymentTotalAmount: payableAmount,
    dueAmount: getRemainingPaymentAmount(baseAmount, paidAmount)
   })

   await Promise.resolve()
   navigate("/payment", { replace: true })
   return
  }

  setData({
   paymentStatus: "paid",
   paymentMethod: selectedMethod,
   paymentMethod1: isStagedPayment ? paymentMethod1 || selectedMethod : selectedMethod,
   paymentMethod2: isStagedPayment ? selectedMethod : "",
   dueAmount: isPartialPayment ? payableAmount : 0,
   ...(isSplitPayment
    ? {}
    : {
       paymentSurchargeAmount: resolvedSurchargeAmount,
       paymentTotalAmount: totalPayableAmount
      })
  })

  await Promise.resolve()
  if (consentAgreed) {
   navigate("/success", { replace: true })
  }
 }

 return (
  <Container scrollable>
   {shouldShowInlineConsent ? (
    <ConsentContent
     onComplete={() => {
      navigate("/success", { replace: true })
     }}
    />
   ) : (
   <div style={styles.wrapper}>
    <h2 style={styles.heading}>{screenTitle}</h2>

    <div style={styles.amountCard}>
     <span style={styles.amountLabel}>{actionLabel}</span>
     <strong style={styles.amount}>{formatPrice(payableAmount)}</strong>
    </div>

    {isTrialBooking && (
     <div style={styles.noticeCard}>
      <p style={styles.noticeTitle}>Trial booking fee: ₹{TRIAL_FEE}</p>
      <p style={styles.noticeText}>{TRIAL_FEE_NOTE}</p>
     </div>
    )}

    {isStagedPayment && (
     <div style={styles.noticeCard}>
      <p style={styles.noticeTitle}>{isSecondCollectionStep ? "Final collection" : "First collection"}</p>
      <p style={styles.noticeText}>
       {isSecondCollectionStep
        ? `Collect the remaining ₹${dueAmount.toLocaleString("en-IN")}${resolvedSurchargeAmount > 0 ? ` + ₹${resolvedSurchargeAmount.toLocaleString("en-IN")} surcharge = ₹${payableAmount.toLocaleString("en-IN")}` : ""}.`
        : isSplitPayment
         ? `Collect ₹${payableAmount.toLocaleString("en-IN")} now${paymentSurchargeAmount > 0 ? ` (includes ₹${paymentSurchargeAmount.toLocaleString("en-IN")} surcharge on ₹${paidAmount.toLocaleString("en-IN")})` : ""}. Remaining ₹${dueAmount.toLocaleString("en-IN")} will be collected next.`
         : resolvedSurchargeAmount > 0
          ? `Collect ₹${paidAmount.toLocaleString("en-IN")} + ₹${resolvedSurchargeAmount.toLocaleString("en-IN")} surcharge = ₹${payableAmount.toLocaleString("en-IN")} now. Remaining ₹${getRemainingPaymentAmount(baseAmount, paidAmount).toLocaleString("en-IN")} due later (surcharge decided at that time).`
          : `Collect ₹${paidAmount.toLocaleString("en-IN")} now. Remaining ₹${getRemainingPaymentAmount(baseAmount, paidAmount).toLocaleString("en-IN")} due later.`}
      </p>
     </div>
    )}

    {resolvedSurchargeAmount > 0 && (
     <div style={styles.noticeCard}>
      <p style={styles.noticeTitle}>Surcharge Applied</p>
      <p style={styles.noticeText}>
       ₹{resolvedSurchargeAmount.toLocaleString("en-IN")} surcharge added on ₹{(isSecondCollectionStep ? dueAmount : isStagedPayment ? paidAmount : baseAmount).toLocaleString("en-IN")}. Total to collect: ₹{payableAmount.toLocaleString("en-IN")}.
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
   )}
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

 noteCard: {
  marginTop: spacing.lg,
  padding: spacing.md,
  borderRadius: radius.md,
  border: `1px solid ${colors.border}`,
  background: "rgba(106,166,154,0.1)"
 },

 noteText: {
  color: colors.textSecondary,
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
