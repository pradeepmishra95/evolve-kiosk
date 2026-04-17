import { useId, useMemo } from "react"
import { colors, radius, spacing } from "../../styles/GlobalStyles"
import {
 formatDateReadable,
 parseDateInputValue,
 startOfDay
} from "../../utils/dateTimeSelector"

interface SmartDateSelectorProps {
 label: string
 value: string
 onChange: (value: string) => void
 error?: string
 helperText?: string
 min?: string
 max?: string
 emptyText?: string
}

const getDayDifference = (value: string) => {
 const parsedDate = parseDateInputValue(value)

 if (!parsedDate) {
  return null
 }

 const selectedDay = startOfDay(parsedDate)
 const today = startOfDay()

 return Math.round((selectedDay.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
}

const getSelectedLabel = (value: string, emptyText: string) => {
 if (!value) {
  return `Selected: ${emptyText}`
 }

 const dayDifference = getDayDifference(value)

 if (dayDifference === 0) {
  return "Selected: Today"
 }

 if (dayDifference === 1) {
  return "Selected: Tomorrow"
 }

 if (typeof dayDifference === "number" && dayDifference > 1) {
  return `Selected: In ${dayDifference} days`
 }

 return `Selected: ${formatDateReadable(value)}`
}

export default function SmartDateSelector({
 label,
 value,
 onChange,
 error,
 helperText,
 min,
 max,
 emptyText = "No date selected"
}: SmartDateSelectorProps) {
 const fieldId = useId()
 const helperId = `${fieldId}-helper`
 const errorId = `${fieldId}-error`
 const selectedTextId = `${fieldId}-selected`
 const describedBy = useMemo(() => {
  if (error) {
   return `${selectedTextId} ${helperText ? helperId : ""} ${errorId}`.trim()
  }

  return `${selectedTextId} ${helperText ? helperId : ""}`.trim()
 }, [error, errorId, helperId, helperText, selectedTextId])

 return (
  <div
   role="group"
   aria-labelledby={`${fieldId}-label`}
   aria-describedby={describedBy}
   aria-invalid={Boolean(error)}
  >
   <p id={`${fieldId}-label`} style={styles.label}>{label}</p>

   <div style={{ ...styles.surface, ...(error ? styles.surfaceError : {}) }}>
    <label style={styles.inputLabel} htmlFor={`${fieldId}-input`}>
     Choose exact follow-up date
    </label>

    <input
     id={`${fieldId}-input`}
     className="kiosk-focus-ring"
     type="date"
     min={min}
     max={max}
     value={value}
     onChange={(event) => onChange(event.target.value)}
     style={styles.dateInput}
    />

    <p id={selectedTextId} style={styles.selectedText} aria-live="polite">
     {getSelectedLabel(value, emptyText)}
    </p>
   </div>

   {(error || helperText) && (
    <p id={error ? errorId : helperId} style={error ? styles.errorText : styles.helperText}>
     {error || helperText}
    </p>
   )}
  </div>
 )
}

const styles = {
 label: {
  color: colors.textSecondary,
  fontSize: "12px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.14em",
  fontWeight: 700,
  marginBottom: spacing.sm
 },
 surface: {
  borderRadius: radius.lg,
  border: `1px solid ${colors.borderStrong}`,
  background:
   "radial-gradient(circle at top right, rgba(243,224,182,0.14), transparent 36%), linear-gradient(160deg, rgba(20,32,40,0.98), rgba(10,18,25,0.96))",
  boxShadow: "0 20px 52px rgba(0,0,0,0.25)",
  padding: "14px"
 },
 surfaceError: {
  border: "1px solid #D97C6C"
 },
 inputLabel: {
  color: colors.textMuted,
  fontSize: "11px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.14em",
  marginBottom: "8px",
  display: "block",
  fontWeight: 700
 },
 dateInput: {
  width: "100%",
  minHeight: "50px",
  borderRadius: "14px",
  border: `1px solid ${colors.border}`,
  background: "rgba(255,255,255,0.03)",
  color: colors.textPrimary,
  padding: "0 14px",
  fontSize: "16px",
  fontWeight: 700
 },
 selectedText: {
  marginTop: "12px",
  color: colors.textSecondary,
  fontSize: "13px"
 },
 helperText: {
  marginTop: spacing.sm,
  color: colors.textMuted,
  fontSize: "13px"
 },
 errorText: {
  marginTop: spacing.sm,
  color: "#F1A596",
  fontSize: "13px",
  lineHeight: 1.5
 }
}
