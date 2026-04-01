import { useState } from "react"
import { useNavigate } from "@/navigation/useAppNavigation"
import Container from "../../layout/Container"
import StaffPinConfirmation from "../../components/payments/StaffPinConfirmation"
import { useUserStore } from "../../store/userStore"
import { colors, radius, spacing, typography } from "../../styles/GlobalStyles"

const formatPrice = (price: number) => `Rs. ${price.toLocaleString("en-IN")}`

export default function UpiPaymentScreen() {
 const navigate = useNavigate()
 const { name, program, duration, batchType, batchTime, price, setData } = useUserStore()
 const [pin, setPin] = useState("")
 const [pinError, setPinError] = useState("")
 const [confirming, setConfirming] = useState(false)

 const staffPin = (process.env.NEXT_PUBLIC_STAFF_PIN || process.env.NEXT_PUBLIC_ADMIN_PIN || "2580").trim()

 const handleBack = () => {
  setData({
   paymentReference: "",
   paymentMethod: "",
   paymentStatus: ""
  })
  navigate("/payment")
 }

 const handleConfirm = async () => {
  if (pin.trim() !== staffPin) {
   setPinError("Invalid staff PIN.")
   return
  }

  try {
   setConfirming(true)
   setPinError("")

   setData({ paymentStatus: "paid" })
   navigate("/success")
  } catch (error) {
   console.error("Failed to confirm UPI payment:", error)
   setPinError("We could not confirm this payment right now. Please try again.")
  } finally {
   setConfirming(false)
  }
 }

 return (
  <Container>
   <div style={styles.wrapper}>
    <h2 style={styles.heading}>Scan UPI QR</h2>

    <p style={styles.description}>
     Ask the member to scan the QR below and show the successful payment before you confirm.
    </p>

    <div style={styles.qrCard}>
     <img
      src="/upi-qr-placeholder.svg"
      alt="UPI QR code"
      style={styles.qrImage}
     />

     <div style={styles.amountBlock}>
      <span style={styles.amountLabel}>Amount Payable</span>
      <strong style={styles.amount}>{formatPrice(price)}</strong>
     </div>
    </div>

    <div style={styles.summaryCard}>
     <h3 style={styles.summaryHeading}>Payment Summary</h3>
     <div style={styles.summaryRows}>
      <p><b>Name:</b> {name}</p>
      <p><b>Program:</b> {program}</p>
      <p><b>Duration:</b> {duration}</p>
      <p><b>Batch:</b> {batchType || "-"} {batchTime ? `| ${batchTime}` : ""}</p>
     </div>
    </div>

    <div style={styles.actions}>
     <button
      type="button"
      onClick={() => {
       void handleBack()
      }}
      style={styles.secondaryButton}
     >
      Change Method
     </button>
    </div>

    <StaffPinConfirmation
     pin={pin}
     error={pinError}
     helperText="After the member completes payment, enter the staff PIN to verify and finish the enrollment."
     buttonTitle="Confirm UPI Payment"
     loading={confirming}
     onPinChange={(value) => {
      setPin(value)
      setPinError("")
     }}
     onConfirm={() => {
      void handleConfirm()
     }}
    />
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

 qrCard: {
  padding: spacing.lg,
  borderRadius: radius.lg,
  border: `1px solid ${colors.border}`,
  background: "rgba(255,255,255,0.03)",
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  gap: spacing.md
 },

 qrImage: {
  width: "min(100%, 280px)",
  borderRadius: radius.md,
  background: "#fff",
  padding: "14px",
  boxSizing: "border-box" as const
 },

 amountBlock: {
  display: "flex",
  flexDirection: "column" as const,
  gap: spacing.xs
 },

 amountLabel: {
  color: colors.textMuted,
  fontSize: "13px",
  letterSpacing: "0.14em",
  textTransform: "uppercase" as const
 },

 amount: {
  color: colors.primaryLight,
  fontSize: "34px",
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

 actions: {
  display: "flex",
  gap: spacing.md,
  justifyContent: "center",
  alignItems: "center",
  flexWrap: "wrap" as const
 },

 secondaryButton: {
  minHeight: "52px",
  marginTop: "30px",
  borderRadius: "999px",
  border: `1px solid ${colors.borderStrong}`,
  background: "transparent",
  color: colors.primaryLight,
  padding: "14px 22px",
  cursor: "pointer",
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
  fontSize: "12px",
  fontWeight: 700
 }
}
