import { useId, useMemo, useState } from "react"
import { colors, radius, spacing } from "../../styles/GlobalStyles"
import {
 addDays,
 buildDateChipOptions,
 formatDateReadable,
 isSameDate,
 parseDateInputValue,
 startOfDay
} from "../../utils/dateTimeSelector"

interface QuickDateSelectorProps {
 label: string
 value: string
 onChange: (value: string) => void
 error?: string
 min?: string
 max?: string
 quickRangeDays?: number
 extendedRangeDays?: number
 helperText?: string
 showExtendedAction?: boolean
 quickLabels?: {
  today?: string
  tomorrow?: string
  custom?: string
 }
}

export default function QuickDateSelector({
 label,
 value,
 onChange,
 error,
 min,
 max,
 quickRangeDays = 10,
 extendedRangeDays = 18,
 helperText,
 showExtendedAction = true,
 quickLabels
}: QuickDateSelectorProps) {
 const fieldId = useId()
 const minDate = useMemo(() => parseDateInputValue(min || "") ?? startOfDay(), [min])
 const maxDate = useMemo(() => parseDateInputValue(max || ""), [max])
 const selectedDate = useMemo(() => parseDateInputValue(value), [value])
 const today = useMemo(() => startOfDay(), [])
 const tomorrow = useMemo(() => addDays(today, 1), [today])
 const isTodaySelected = isSameDate(selectedDate, today)
 const isTomorrowSelected = isSameDate(selectedDate, tomorrow)
 const isCustomSelected = Boolean(selectedDate && !isTodaySelected && !isTomorrowSelected)
 const [showCustomPicker, setShowCustomPicker] = useState(isCustomSelected)
 const [showExtendedRange, setShowExtendedRange] = useState(false)

 const customDateOptions = useMemo(
  () =>
   buildDateChipOptions(minDate, showExtendedRange ? extendedRangeDays : quickRangeDays, {
    minDate,
    maxDate
   }),
  [extendedRangeDays, maxDate, minDate, quickRangeDays, showExtendedRange]
 )
 const todayOption = customDateOptions.find((option) => isSameDate(option.date, today)) || null
 const tomorrowOption = customDateOptions.find((option) => isSameDate(option.date, tomorrow)) || null
 const todayDisabled = !todayOption
 const tomorrowDisabled = !tomorrowOption
 const shouldShowCustomPicker = showCustomPicker || isCustomSelected
 const selectedTextId = `${fieldId}-selected`
 const helperId = `${fieldId}-helper`
 const errorId = `${fieldId}-error`
 const describedBy = error
  ? `${selectedTextId} ${helperText ? helperId : ""} ${errorId}`.trim()
  : `${selectedTextId} ${helperText ? helperId : ""}`.trim()

 return (
  <div role="group" aria-labelledby={`${fieldId}-label`} aria-describedby={describedBy} aria-invalid={Boolean(error)}>
   <p id={`${fieldId}-label`} style={styles.label}>{label}</p>

   <div style={{ ...styles.surface, ...(error ? styles.surfaceError : {}) }}>
    <div style={styles.quickRow} role="radiogroup" aria-label={`${label} quick options`}>
     <button
      className="kiosk-focus-ring"
      type="button"
      role="radio"
      aria-checked={isTodaySelected}
      disabled={todayDisabled}
      onClick={() => {
       onChange(todayDisabled ? "" : todayOption?.value || "")
       setShowCustomPicker(false)
      }}
      style={{
       ...styles.quickButton,
       ...(isTodaySelected ? styles.quickButtonActive : {}),
       ...(todayDisabled ? styles.quickButtonDisabled : {})
      }}
     >
      <span style={styles.quickLabel}>{quickLabels?.today || "Today"}</span>
      <span style={styles.quickMeta}>{todayDisabled ? "Unavailable" : "Best choice"}</span>
     </button>

     <button
      className="kiosk-focus-ring"
      type="button"
      role="radio"
      aria-checked={isTomorrowSelected}
      disabled={tomorrowDisabled}
      onClick={() => {
       onChange(tomorrowDisabled ? "" : tomorrowOption?.value || "")
       setShowCustomPicker(false)
      }}
      style={{
       ...styles.quickButton,
       ...(isTomorrowSelected ? styles.quickButtonActive : {}),
       ...(tomorrowDisabled ? styles.quickButtonDisabled : {})
      }}
     >
      <span style={styles.quickLabel}>{quickLabels?.tomorrow || "Tomorrow"}</span>
      <span style={styles.quickMeta}>{tomorrowDisabled ? "Unavailable" : "Next available"}</span>
     </button>

     <button
      className="kiosk-focus-ring"
      type="button"
      role="radio"
      aria-checked={shouldShowCustomPicker}
      onClick={() => setShowCustomPicker(true)}
      style={{
       ...styles.quickButton,
       ...(showCustomPicker || isCustomSelected ? styles.quickButtonActive : {})
      }}
     >
      <span style={styles.quickLabel}>{quickLabels?.custom || "Pick Another Date"}</span>
      <span style={styles.quickMeta}>Choose from upcoming days</span>
     </button>
    </div>

    {shouldShowCustomPicker && (
     <div style={styles.customPanel}>
      <div style={styles.dateChipGrid} role="radiogroup" aria-label={`${label} date options`}>
       {customDateOptions.map((option, index) => {
        const selected = value === option.value
        const relativeTag = index === 0 ? "Soonest" : ""

        return (
         <button
          className="kiosk-focus-ring"
          key={option.value}
          type="button"
          role="radio"
          aria-checked={selected}
          onClick={() => onChange(option.value)}
          style={{
           ...styles.dateChip,
           ...(selected ? styles.dateChipActive : {})
          }}
         >
          <span style={styles.dateChipLabel}>{option.shortLabel}</span>
          <span style={styles.dateChipMeta}>{relativeTag || "Available"}</span>
         </button>
        )
       })}
      </div>

      {showExtendedAction && customDateOptions.length >= quickRangeDays && (
       <button
        className="kiosk-focus-ring"
        type="button"
        onClick={() => setShowExtendedRange((current) => !current)}
        style={styles.moreDatesButton}
       >
        {showExtendedRange ? "Show Fewer Dates" : "Show More Dates"}
       </button>
      )}
     </div>
    )}

    <p id={selectedTextId} style={styles.selectedText} aria-live="polite">
     Selected: {value ? formatDateReadable(value) : "No date selected"}
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
  boxShadow: "0 22px 52px rgba(0,0,0,0.25)",
  padding: "14px"
 },
 surfaceError: {
  border: "1px solid #D97C6C"
 },
 quickRow: {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 170px), 1fr))",
  gap: "10px"
 },
 quickButton: {
  minHeight: "88px",
  borderRadius: radius.md,
  border: `1px solid ${colors.border}`,
  background: "rgba(255,255,255,0.03)",
  color: colors.textPrimary,
  padding: "12px",
  textAlign: "left" as const,
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "space-between",
  gap: "10px",
  cursor: "pointer",
  transition: "border-color 0.22s ease, background 0.22s ease, transform 0.18s ease"
 },
 quickButtonActive: {
  border: `1px solid ${colors.borderStrong}`,
  background: "linear-gradient(135deg, rgba(200,169,108,0.2), rgba(106,166,154,0.14))"
 },
 quickButtonDisabled: {
  opacity: 0.46,
  cursor: "not-allowed"
 },
 quickLabel: {
  color: colors.textPrimary,
  fontSize: "15px",
  fontWeight: 700
 },
 quickMeta: {
  color: colors.textMuted,
  fontSize: "12px"
 },
 customPanel: {
  marginTop: "12px",
  paddingTop: "12px",
  borderTop: `1px solid ${colors.border}`
 },
 dateChipGrid: {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 145px), 1fr))",
  gap: "8px"
 },
 dateChip: {
  minHeight: "72px",
  borderRadius: "14px",
  border: `1px solid ${colors.border}`,
  background: "rgba(255,255,255,0.03)",
  color: colors.textPrimary,
  padding: "10px",
  textAlign: "left" as const,
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "space-between",
  gap: "8px",
  cursor: "pointer",
  transition: "border-color 0.22s ease, background 0.22s ease, transform 0.18s ease"
 },
 dateChipActive: {
  border: `1px solid ${colors.borderStrong}`,
  background: "linear-gradient(135deg, rgba(200,169,108,0.22), rgba(106,166,154,0.14))"
 },
 dateChipLabel: {
  color: colors.textPrimary,
  fontSize: "14px",
  fontWeight: 700
 },
 dateChipMeta: {
  color: colors.primaryLight,
  fontSize: "11px",
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
  fontWeight: 700
 },
 moreDatesButton: {
  marginTop: "10px",
  minHeight: "40px",
  borderRadius: "999px",
  border: `1px solid ${colors.borderStrong}`,
  background: "rgba(255,255,255,0.03)",
  color: colors.primaryLight,
  padding: "8px 14px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
  transition: "border-color 0.2s ease, background 0.2s ease, transform 0.16s ease"
 },
 selectedText: {
  marginTop: "12px",
  color: colors.textSecondary,
  fontSize: "13px",
  lineHeight: 1.45
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
