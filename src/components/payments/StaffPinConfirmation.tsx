import PrimaryButton from "../buttons/PrimaryButton"
import TextInput from "../inputs/TextInput"
import { colors, radius, spacing } from "../../styles/GlobalStyles"

interface Props {
 pin: string
 error: string
 helperText: string
 buttonTitle: string
 loading?: boolean
 onPinChange: (value: string) => void
 onConfirm: () => void | Promise<void>
}

export default function StaffPinConfirmation({
 pin,
 error,
 helperText,
 buttonTitle,
 loading,
 onPinChange,
 onConfirm
}: Props) {
 return (
  <div style={styles.card}>
   <p style={styles.helperText}>{helperText}</p>

   <TextInput
    label="Staff PIN"
    type="password"
    inputMode="numeric"
    maxLength={6}
    value={pin}
    placeholder="Enter staff PIN"
    onChange={onPinChange}
    error={error}
   />

   <div style={styles.buttonRow}>
    <PrimaryButton
     title={loading ? "Confirming..." : buttonTitle}
     onClick={onConfirm}
     disabled={loading}
    />
   </div>
  </div>
 )
}

const styles = {
 card: {
  marginTop: spacing.lg,
  padding: spacing.lg,
  borderRadius: radius.lg,
  border: `1px solid ${colors.border}`,
  background: "rgba(255,255,255,0.03)"
 },

 helperText: {
  color: colors.textSecondary,
  lineHeight: 1.6,
  marginBottom: spacing.md
 },

 buttonRow: {
  display: "flex",
  justifyContent: "center"
 }
}
