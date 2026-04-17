import { useId, useMemo, useState, type KeyboardEvent } from "react"
import { colors, radius, spacing } from "../../styles/GlobalStyles"
import { calculateAgeFromDateOfBirth, formatDateOfBirth } from "../../utils/dateOfBirth"
import { parseDateInputValue, toDateInputValue } from "../../utils/dateTimeSelector"

interface DobSelectorProps {
 label: string
 value: string
 onChange: (value: string) => void
 error?: string
 min?: string
 max?: string
 emptyLabel?: string
 compact?: boolean
}

type DobStep = "year" | "month" | "day"
type DobStepConfig = { key: DobStep; label: string }

const monthFormatter = new Intl.DateTimeFormat("en-IN", { month: "short" })
const stepOptions: DobStepConfig[] = [
 { key: "year", label: "Year" },
 { key: "month", label: "Month" },
 { key: "day", label: "Day" }
]

const getYearOptions = (minDate: Date | null, maxDate: Date | null) => {
 const currentYear = new Date().getFullYear()
 const startYear = minDate?.getFullYear() ?? currentYear - 90
 const endYear = maxDate?.getFullYear() ?? currentYear
 const years: number[] = []

 for (let year = endYear; year >= startYear; year -= 1) {
  years.push(year)
 }

 return years
}

const getDateFromParts = (year: number | null, month: number | null, day: number | null) => {
 if (year === null || month === null || day === null) {
  return null
 }

 const nextDate = new Date(year, month, day)

 if (
  nextDate.getFullYear() !== year ||
  nextDate.getMonth() !== month ||
  nextDate.getDate() !== day
 ) {
  return null
 }

 return nextDate
}

const isDateWithinRange = (date: Date, minDate: Date | null, maxDate: Date | null) => {
 if (minDate && date < minDate) {
  return false
 }

 if (maxDate && date > maxDate) {
  return false
 }

 return true
}

export default function DobSelector({
 label,
 value,
 onChange,
 error,
 min,
 max,
 emptyLabel = "Select date of birth",
 compact = false
}: DobSelectorProps) {
 const minDate = useMemo(() => parseDateInputValue(min || ""), [min])
 const maxDate = useMemo(() => parseDateInputValue(max || ""), [max])
 const selectedDate = useMemo(() => parseDateInputValue(value), [value])
 const fieldId = useId()

 const [selectedYear, setSelectedYear] = useState<number | null>(selectedDate?.getFullYear() ?? null)
 const [selectedMonth, setSelectedMonth] = useState<number | null>(selectedDate?.getMonth() ?? null)
 const [selectedDay, setSelectedDay] = useState<number | null>(selectedDate?.getDate() ?? null)
 const [activeStep, setActiveStep] = useState<DobStep>(selectedDate ? "day" : "year")
 const [yearSearch, setYearSearch] = useState("")
 const [manualExpand, setManualExpand] = useState(false)

 const yearOptions = useMemo(() => getYearOptions(minDate, maxDate), [maxDate, minDate])
 const filteredYearOptions = useMemo(() => {
  const query = yearSearch.trim()

  if (!query) {
   return yearOptions
  }

  return yearOptions.filter((year) => String(year).includes(query))
 }, [yearOptions, yearSearch])

 const monthOptions = useMemo(() => {
  if (selectedYear === null) {
   return []
  }

  return Array.from({ length: 12 }, (_, monthIndex) => {
   const monthStart = new Date(selectedYear, monthIndex, 1)
   const monthEnd = new Date(selectedYear, monthIndex + 1, 0)
   const enabled =
    isDateWithinRange(monthStart, minDate, maxDate) ||
    isDateWithinRange(monthEnd, minDate, maxDate) ||
    (minDate && maxDate && monthStart < minDate && monthEnd > maxDate)

   return {
    index: monthIndex,
    label: monthFormatter.format(monthStart),
    enabled
   }
  })
 }, [maxDate, minDate, selectedYear])

 const dayOptions = useMemo(() => {
  if (selectedYear === null || selectedMonth === null) {
   return []
  }

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()
  const options: number[] = []

  for (let day = 1; day <= daysInMonth; day += 1) {
   const candidate = new Date(selectedYear, selectedMonth, day)

   if (isDateWithinRange(candidate, minDate, maxDate)) {
    options.push(day)
   }
  }

  return options
 }, [maxDate, minDate, selectedMonth, selectedYear])

 const selectedSummary = value ? formatDateOfBirth(value) : emptyLabel
 const summaryId = `${fieldId}-summary`
 const helperId = `${fieldId}-helper`
 const errorId = `${fieldId}-error`
 const resolvedAgeFromValue = calculateAgeFromDateOfBirth(value)
 const hasCompletedDob = Boolean(value && resolvedAgeFromValue !== null)
 const showSelectionControls = manualExpand || !hasCompletedDob
 const describedBy = [summaryId, showSelectionControls ? helperId : "", error ? errorId : ""]
  .filter(Boolean)
  .join(" ")
 const selectedAge = useMemo(() => {
  const selected = getDateFromParts(selectedYear, selectedMonth, selectedDay)

  if (!selected) {
   return null
  }

  return calculateAgeFromDateOfBirth(toDateInputValue(selected))
 }, [selectedDay, selectedMonth, selectedYear])
 const ageBadgeText =
  resolvedAgeFromValue !== null
   ? `Age ${resolvedAgeFromValue}`
   : selectedAge !== null
    ? `Age ${selectedAge}`
    : "Age -"

 const commitDateSelection = (year: number | null, month: number | null, day: number | null) => {
  const date = getDateFromParts(year, month, day)

  if (!date || !isDateWithinRange(date, minDate, maxDate)) {
   onChange("")
   return
  }

  onChange(toDateInputValue(date))
 }

 const selectYear = (year: number) => {
  setSelectedYear(year)
  setSelectedMonth(null)
  setSelectedDay(null)
  setActiveStep("month")
  onChange("")
 }

 const selectMonth = (month: number) => {
  if (selectedYear === null) {
   return
  }

  setSelectedMonth(month)
  setSelectedDay(null)
  setActiveStep("day")
  onChange("")
 }

 const selectDay = (day: number) => {
  if (selectedYear === null || selectedMonth === null) {
   return
  }

  setSelectedDay(day)
  setActiveStep("day")
  setManualExpand(false)
  commitDateSelection(selectedYear, selectedMonth, day)
 }

 const getStepLocked = (step: DobStep) =>
  (step === "month" && selectedYear === null) ||
  (step === "day" && (selectedYear === null || selectedMonth === null))

 const handleStepKeyDown = (event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
  if (
   event.key !== "ArrowRight" &&
   event.key !== "ArrowLeft" &&
   event.key !== "Home" &&
   event.key !== "End"
  ) {
   return
  }

  event.preventDefault()

  if (event.key === "Home") {
   setActiveStep("year")
   return
  }

  if (event.key === "End") {
   if (!getStepLocked("day")) {
    setActiveStep("day")
    return
   }

   if (!getStepLocked("month")) {
    setActiveStep("month")
    return
   }

   setActiveStep("year")
   return
  }

  const direction = event.key === "ArrowRight" ? 1 : -1

  for (let offset = 1; offset <= stepOptions.length; offset += 1) {
   const nextIndex = (currentIndex + direction * offset + stepOptions.length) % stepOptions.length
   const nextStep = stepOptions[nextIndex]

   if (nextStep && !getStepLocked(nextStep.key)) {
    setActiveStep(nextStep.key)
    return
   }
  }
 }

 return (
  <div style={{ marginBottom: compact ? 0 : spacing.md }}>
   <label id={`${fieldId}-label`} style={styles.label}>
    {label}
   </label>

   <div
    role="group"
    aria-labelledby={`${fieldId}-label`}
    aria-describedby={describedBy}
    aria-invalid={Boolean(error)}
    style={{ ...styles.surface, ...(error ? styles.surfaceError : {}) }}
   >
    <div style={styles.summaryBar}>
     <div>
      <p style={styles.summaryLabel}>Selected DOB</p>
     <p id={summaryId} style={styles.summaryValue}>{selectedSummary}</p>
     </div>

     <div style={styles.ageBadge} aria-live="polite">
      {ageBadgeText}
     </div>
    </div>

    {showSelectionControls ? (
     <>
      <p id={helperId} style={styles.helperText}>
       Choose year, then month, then day.
      </p>

      <div style={styles.stepTabs} role="tablist" aria-label="Date of birth selection steps">
       {stepOptions.map((tab, index) => {
        const isActive = activeStep === tab.key
        const isLocked = getStepLocked(tab.key)

        return (
         <button
          className="kiosk-focus-ring"
          key={tab.key}
          type="button"
          id={`${fieldId}-tab-${tab.key}`}
          role="tab"
          aria-selected={isActive}
          aria-controls={`${fieldId}-panel-${tab.key}`}
          disabled={isLocked}
          onClick={() => setActiveStep(tab.key)}
          onKeyDown={(event) => handleStepKeyDown(event, index)}
          style={{
           ...styles.stepButton,
           ...(isActive ? styles.stepButtonActive : {}),
           ...(isLocked ? styles.stepButtonLocked : {})
          }}
         >
          {tab.label}
         </button>
        )
       })}
      </div>

      {activeStep === "year" && (
      <div
       id={`${fieldId}-panel-year`}
       style={styles.stepPanel}
       role="tabpanel"
       aria-label="Year selection"
       aria-labelledby={`${fieldId}-tab-year`}
      >
      <input
       className="kiosk-focus-ring"
       type="text"
       inputMode="numeric"
       value={yearSearch}
       onChange={(event) => setYearSearch(event.target.value.replace(/[^0-9]/g, ""))}
       placeholder="Jump to year (e.g. 1987)"
       style={styles.searchInput}
      />

      <div style={styles.yearGrid}>
       {filteredYearOptions.map((year) => (
       <button
         className="kiosk-focus-ring"
         key={year}
         type="button"
         aria-pressed={selectedYear === year}
         onClick={() => selectYear(year)}
         style={{
          ...styles.chipButton,
          ...(selectedYear === year ? styles.chipButtonActive : {})
         }}
        >
         {year}
        </button>
       ))}
      </div>

      {filteredYearOptions.length === 0 && (
       <p style={styles.helperText}>No year found. Try another year.</p>
      )}
     </div>
    )}

      {activeStep === "month" && (
      <div
       id={`${fieldId}-panel-month`}
       style={styles.stepPanel}
       role="tabpanel"
       aria-label="Month selection"
       aria-labelledby={`${fieldId}-tab-month`}
      >
      <div style={styles.monthGrid}>
       {monthOptions.map((month) => (
        <button
         className="kiosk-focus-ring"
         key={month.index}
         type="button"
         aria-pressed={selectedMonth === month.index}
         disabled={!month.enabled}
         onClick={() => selectMonth(month.index)}
         style={{
          ...styles.chipButton,
          ...(selectedMonth === month.index ? styles.chipButtonActive : {}),
          ...(!month.enabled ? styles.chipButtonLocked : {})
         }}
        >
         {month.label}
        </button>
       ))}
      </div>
      </div>
     )}

      {activeStep === "day" && (
      <div
       id={`${fieldId}-panel-day`}
       style={styles.stepPanel}
       role="tabpanel"
       aria-label="Day selection"
       aria-labelledby={`${fieldId}-tab-day`}
      >
      <div style={styles.dayGrid}>
       {dayOptions.map((day) => (
        <button
         className="kiosk-focus-ring"
         key={day}
         type="button"
         aria-pressed={selectedDay === day}
         onClick={() => selectDay(day)}
         style={{
          ...styles.dayButton,
          ...(selectedDay === day ? styles.chipButtonActive : {})
         }}
        >
         {String(day).padStart(2, "0")}
        </button>
       ))}
      </div>
      </div>
     )}
     </>
    ) : (
     <div style={styles.actionsRow}>
      <button
       type="button"
       className="kiosk-focus-ring"
       onClick={() => {
        setManualExpand(true)
        setActiveStep("year")
       }}
       style={styles.changeDobButton}
      >
       Change DOB
      </button>
     </div>
    )}
   </div>

   {error && (
    <p id={errorId} style={styles.errorText}>
     {error}
    </p>
   )}
  </div>
 )
}

const styles = {
 label: {
  display: "block",
  marginBottom: spacing.sm,
  fontSize: "12px",
  color: colors.textSecondary,
  letterSpacing: "0.14em",
  textTransform: "uppercase" as const,
  fontWeight: 700
 },
 surface: {
  borderRadius: radius.lg,
  border: `1px solid ${colors.borderStrong}`,
  background:
   "radial-gradient(circle at top right, rgba(243,224,182,0.16), transparent 36%), linear-gradient(160deg, rgba(20,32,40,0.98), rgba(10,18,25,0.96))",
  boxShadow: "0 22px 56px rgba(0,0,0,0.28)",
  padding: "14px"
 },
 surfaceError: {
  border: "1px solid #D97C6C"
 },
 summaryBar: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: spacing.sm,
  flexWrap: "wrap" as const,
  marginBottom: "12px",
  padding: "10px 12px",
  borderRadius: radius.md,
  border: `1px solid ${colors.border}`,
  background: "rgba(255,255,255,0.03)"
 },
 summaryLabel: {
  color: colors.textMuted,
  fontSize: "11px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.14em",
  fontWeight: 700
 },
 summaryValue: {
  color: colors.textPrimary,
  fontSize: "15px",
  fontWeight: 700,
  marginTop: "4px"
 },
 ageBadge: {
  borderRadius: "999px",
  border: `1px solid ${colors.borderStrong}`,
  background: "linear-gradient(135deg, rgba(200,169,108,0.22), rgba(106,166,154,0.14))",
  color: colors.primaryLight,
  padding: "8px 12px",
  fontSize: "12px",
  fontWeight: 800,
  letterSpacing: "0.08em"
 },
 stepTabs: {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "8px",
  marginBottom: "12px"
 },
 stepButton: {
  minHeight: "44px",
  borderRadius: radius.md,
  border: `1px solid ${colors.border}`,
  background: "rgba(255,255,255,0.03)",
  color: colors.textSecondary,
  fontSize: "13px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  cursor: "pointer"
 },
 stepButtonActive: {
  border: `1px solid ${colors.borderStrong}`,
  background: "linear-gradient(135deg, rgba(200,169,108,0.2), rgba(106,166,154,0.12))",
  color: colors.textPrimary
 },
 stepButtonLocked: {
  opacity: 0.48,
  cursor: "not-allowed"
 },
 stepPanel: {
  borderRadius: radius.md,
  border: `1px solid ${colors.border}`,
  background: "rgba(255,255,255,0.02)",
  padding: "10px"
 },
 searchInput: {
  width: "100%",
  minHeight: "44px",
  borderRadius: radius.md,
  border: `1px solid ${colors.borderStrong}`,
  background: "rgba(255,255,255,0.04)",
  color: colors.textPrimary,
  padding: "10px 12px",
  fontSize: "14px",
  marginBottom: "10px",
  outline: "none"
 },
 yearGrid: {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(84px, 1fr))",
  gap: "8px",
  maxHeight: "220px",
  overflowY: "auto" as const
 },
 monthGrid: {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "8px"
 },
 dayGrid: {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(62px, 1fr))",
  gap: "8px",
  maxHeight: "220px",
  overflowY: "auto" as const
 },
 chipButton: {
  minHeight: "44px",
  borderRadius: "14px",
  border: `1px solid ${colors.border}`,
  background: "rgba(255,255,255,0.03)",
  color: colors.textPrimary,
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer"
 },
 dayButton: {
  minHeight: "42px",
  borderRadius: "12px",
  border: `1px solid ${colors.border}`,
  background: "rgba(255,255,255,0.03)",
  color: colors.textPrimary,
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer"
 },
 chipButtonActive: {
  border: `1px solid ${colors.borderStrong}`,
  background: "linear-gradient(135deg, rgba(200,169,108,0.22), rgba(106,166,154,0.14))"
 },
 chipButtonLocked: {
  opacity: 0.44,
  cursor: "not-allowed"
 },
 helperText: {
  marginTop: spacing.sm,
  marginBottom: spacing.sm,
  color: colors.textMuted,
  fontSize: "13px"
 },
 actionsRow: {
  display: "flex",
  justifyContent: "flex-start",
  marginTop: spacing.sm
 },
 changeDobButton: {
  minHeight: "40px",
  borderRadius: "999px",
  border: `1px solid ${colors.borderStrong}`,
  background: "rgba(255,255,255,0.03)",
  color: colors.primaryLight,
  padding: "8px 14px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: 800,
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const
 },
 errorText: {
  marginTop: spacing.sm,
  fontSize: "13px",
  color: "#F1A596",
  lineHeight: 1.5
 }
}
